import logging
from collections import deque
from datetime import datetime
from typing import TypedDict

from hexitec.util.iac import IACError, iac_get, iac_set
from odin.adapters.adapter import ApiAdapter
from odin.adapters.proxy import ProxyAdapter
from readout_processor.adapter import ReadoutProcessorAdapter
from statemachine import Event, State, StateMachine
from statemachine.exceptions import TransitionNotAllowed
from tornado.ioloop import PeriodicCallback


class StateMachineException(Exception):
    """Basic State Machine Exception Class"""


class ReadoutStatusControl(TypedDict):
    acquire: int
    acquisition_abort: int
    manual_trig: int


class ReadoutStatusAurora(TypedDict):
    channel: bool
    lane: bool


class ReadoutStatusResets(TypedDict):
    aurora_reset: int
    cmac_0_reset: int
    cmac_1_reset: int
    cmac_2_reset: int
    data_path_reset: int


class ReadoutStatusCmac(TypedDict):
    cmac_0_lane_up: int
    cmac_1_lane_up: int


class ReadoutStatus(TypedDict):
    acq_control: ReadoutStatusControl
    aurora: ReadoutStatusAurora
    clock_resets: ReadoutStatusCmac
    cmac: ReadoutStatusCmac
    frame_number: int
    frame_changing: bool
    is_running: bool
    reactivate: None
    reset: None


class LokiStatus(TypedDict):
    ENABLE_STATE: str
    ENABLE_STATE_STATUS_MESSAGE: str

    POWER_BOARD_INIT: bool
    COB_INIT: bool
    ASIC_INIT: bool

    SYNC: bool
    REGS_EN: bool
    ASIC_EN: bool

    proxy_status: int


class Monitor:
    """State Domain Model, which defines state Actions
    (that trigger when entering/exiting state or on transitions)
    , and holds class variables for the system, such as the
    IAC adapters and timeouts """
    def __init__(self, adapters: dict[str, ApiAdapter],
                 timeout=60, max_retries=3, event_history=50):
        self.retries = 0
        self.reset_counter = 0
        self.frame_number = 0

        self.timeout = timeout
        self.max_timeout = timeout

        self.max_retries = max_retries
        self.reset_history = deque(maxlen=event_history)

        self.loki: ProxyAdapter = adapters["proxy"]
        self.readout: ReadoutProcessorAdapter = adapters["readout"]

        self.readout_status: ReadoutStatus = None
        self.loki_status: LokiStatus = None

        self.loki_state_path = "loki/application/system_state"

        self.error: Exception = None

    # Adapter Communication Methods, for getting system status
    def get_readout_status(self) -> ReadoutStatus:
        return iac_get(self.readout, "status")

    def get_loki_status(self) -> LokiStatus:
        stat: LokiStatus = iac_get(self.loki, self.loki_state_path)
        stat["proxy_status"] = iac_get(self.loki, "status/loki/status_code")

        return stat

    def clear_counters(self):
        self.reset_counter = 0
        self.retries = 0
        self.timeout = self.max_timeout
        self.reset_history.clear()

    # Conditionals
    def is_running(self):
        return self.readout_status["is_running"]

    def is_chan_up(self):
        return self.readout_status["aurora"]["channel"]

    def is_lane_up(self):
        return self.readout_status["aurora"]["lane"]

    def is_loki_power_board(self):
        return self.loki_status["POWER_BOARD_INIT"]

    def is_loki_cob(self):
        return self.loki_status["COB_INIT"]

    def is_loki_asic(self):
        return self.loki_status["ASIC_INIT"]

    def is_loki_up(self) -> bool:
        return all([self.is_loki_power_board(),
                   self.is_loki_asic(),
                   self.is_loki_cob()])

    def is_error(self):
        return self.error is not None

    def is_timeout(self):
        return self.timeout < 1

    def is_max_attempts(self):
        return self.retries > self.max_retries

    # Actions
    def on_enter_idle(self):
        logging.info("State Machine Started")

    def on_start(self):
        """On Transition: idle -> initialise"""
        try:
            self.readout_status = self.get_readout_status()
            self.loki_status = self.get_loki_status()
        except IACError:
            logging.error("Unable to read status at initialisation")
            self.error = StateMachineException("Unable to read status at initialisation")

    def on_enter_monitoring(self):
        logging.info("Monitoring Loop Started")
        self.retries = 0

    def on_monitor(self):
        """On Transition: monitoring -> monitoring,
        error -> monitoring, reactivating -> monitoring"""
        try:
            self.readout_status = self.get_readout_status()
            self.loki_status = self.get_loki_status()
        except IACError:
            self.error = StateMachineException("Unable to read status whilst Monitoring")

        if not 200 <= self.loki_status["proxy_status"] < 300:
            # proxy is showing an error Status Code. We should error out
            self.error = StateMachineException(
                "Loki Proxy Error. HTTP Code: ({})".format(self.loki_status["proxy_status"]))

    def on_enter_resetting(self, event: str, source: State):
        """Log a reset event before starting the reset process"""
        self.retries += 1
        if self.retries > self.max_retries:
            logging.error("Exceeded Reset Retry limit")
            self.error = StateMachineException(
                "Exceeeded Retry Limit of {}".format(self.max_retries)
            )

        else:
            try:
                self.reset_counter += 1
                logging.warning("Starting reset sequence. Attempt %d/%d",
                                self.retries, self.max_retries)

                self.readout_status = self.get_readout_status()
                self.loki_status = self.get_loki_status()

                if not self.is_loki_up():
                    monitoring_reason = "Loki Board Failed"
                else:
                    monitoring_reason = "Data Readout Failed"

                reasons = {
                    "Monitoring": monitoring_reason,
                    "WaitingForLanes": "Timeout Waiting for Lanes",
                    "WaitingForChannels": "Timeout Waiting for Channel",
                    "Reactivating": "Timeout waiting for Reactivation to succeed"
                }
                event = {
                    "count": self.reset_counter,
                    "timestamp": datetime.now().isoformat(),
                    "reason": reasons.get(source.name, "Unknown Reset Event"),
                    "retry_attempt": self.retries
                }

                self.reset_history.append(event)
            except IACError as err:
                self.error = err

    # Resetting Steps for Readout
    def on_enter_waiting_for_lanes(self):
        """Entering WaitingForLanes State"""
        self.timeout = self.max_timeout  # resetting timeout
        try:
            iac_set(self.loki, self.loki_state_path, {"SYNC": False})
            logging.debug("Loki Data Sync OFF")

            iac_set(self.readout, "status", {"reset": True})
            logging.debug("Readout resetting")
            self.readout_status = self.get_readout_status()
        except IACError as err:
            self.error = err
        logging.info("Waiting for Lane to come back")

    def on_enter_waiting_for_channels(self):
        self.timeout = self.max_timeout
        try:
            iac_set(self.loki, self.loki_state_path, {"ASIC_REBOND": True})
            logging.debug("Loki Rebond command sent")
            self.readout_status = self.get_readout_status()
        except IACError as err:
            self.error = err
    
        logging.info("Waiting for Channel to come back")

    def on_enter_reactivating(self):
        self.timeout = self.max_timeout
        logging.info("Reactivating Readout after reset")
        try:
            iac_set(self.readout, "status", {"reactivate": True})
            iac_set(self.loki, self.loki_state_path, {"SYNC": True})

        except IACError as err:
            self.error = err

    def on_wait(self):
        """Checking status while waiting for reset step.
        This Action will trigger for the lane, channel, and reactivating States"""

        try:
            self.readout_status = self.get_readout_status()
            self.timeout -= 1
        except IACError as err:
            self.error = err

    # Resetting steps for Loki
    def on_enter_loki_power_init(self):
        """Initialise LOKI Power Board"""
        self.timeout = self.max_timeout
        try:
            iac_set(self.loki, self.loki_state_path, {"ENABLE_STATE": "PWR_DONE"})
        except IACError as err:
            self.error = err

    def on_enter_loki_cob_init(self):
        """Init Loki COB"""
        self.timeout = self.max_timeout
        try:
            iac_set(self.loki, self.loki_state_path, {"ENABLE_STATE": "COB_DONE"})
        except IACError as err:
            self.error = err

    def on_enter_loki_asic_init(self):
        """Init Loki Asic"""
        self.timeout = self.max_timeout
        try:
            iac_set(self.loki, self.loki_state_path, {"ENABLE_STATE": "ASIC_DONE"})
        except IACError as err:
            self.error = err

    def on_wait_loki(self):
        """Check Loki Status while waiting for reset steps"""
        try:
            self.loki_status = self.get_loki_status()
            self.timeout -= 1
        except IACError as err:
            self.error = err

    def on_enter_error(self, source: State):
        logging.error("Entered Error State from %s State", source)
        logging.error("Error Messsage: %s", self.error)

    def on_exit_error(self):
        logging.info("Resetting after error")
        self.error = None
        self.retries = 0


class MonitorControl(StateMachine):

    # States
    idle = State("System Idle", initial=True)
    initialising = State("Initialising")
    monitoring = State("Monitoring")
    resetting = State("Resetting")
    waiting_for_lanes = State("Waiting For Lanes")
    waiting_for_channels = State("Waiting For Channels")
    reactivating = State("Reactivating")
    error = State("Error")

    loki_power_init = State("Loki Power Init")
    loki_cob_init = State("Loki COB Init")
    loki_asic_init = State("Loki ASIC Init")

    # Transitions

    # All states can fall into error state if an error is raised
    raise_error = error.from_.any(cond="is_error")


    # Monitoring Loop
    monitor = (
        initialising.to(monitoring, unless="is_error")
        | monitoring.to(monitoring, internal=True, unless="is_error", cond="is_running")
    )

    # branch to pick which reset step to begin
    start_reset = (
        resetting.to(waiting_for_lanes, cond="is_loki_up", unless="is_max_attempts or is_error")
        | resetting.to(loki_power_init, cond="!is_loki_power_board", unless="is_max_attempts or is_error")
        | resetting.to(loki_cob_init, cond="!is_loki_cob", unless="is_max_attempts or is_error")
        | resetting.to(loki_asic_init, cond="!is_loki_asic", unless="is_max_attempts or is_error")
    )

    reset = (
        monitoring.to(resetting, cond="!is_running", unless="is_error")
        | waiting_for_lanes.to(resetting, cond="is_timeout", unless="is_error")
        | waiting_for_channels.to(resetting, cond="is_timeout", unless="is_error")
        | reactivating.to(resetting, cond="is_timeout", unless="is_error")
        | loki_power_init.to(resetting, cond="is_timeout", unless="is_error")
        | loki_cob_init.to(resetting, cond="is_timeout", unless="is_error")
        | loki_asic_init.to(resetting, cond="is_timeout", unless="is_error")
    )

    # Resetting Steps. Loops included for waiting.
    wait = (
        waiting_for_lanes.to(waiting_for_lanes, internal=True,
                             cond=["!is_timeout", "!is_lane_up"], unless="is_error")
        | waiting_for_lanes.to(waiting_for_channels,
                               cond="is_lane_up", unless="is_error")
        | waiting_for_channels.to(waiting_for_channels, internal=True,
                                  cond=["!is_timeout", "!is_chan_up"], unless="is_error")
        | waiting_for_channels.to(reactivating,
                                  cond="is_chan_up", unless="is_error")
        | reactivating.to(reactivating, internal=True,
                          cond=["!is_timeout", "!is_running"], unless="is_error")
        | reactivating.to(monitoring, cond="is_running", unless="is_error")
    )

    wait_loki = (
        loki_power_init.to(loki_power_init, internal=True, cond=["!is_loki_power_board", "!is_timeout"], unless="is_error")
        | loki_power_init.to(loki_cob_init, cond="is_loki_power_board", unless="is_error")
        | loki_cob_init.to(loki_cob_init, internal=True, cond=["!is_loki_cob", "!is_timeout"], unless="is_error")
        | loki_cob_init.to(loki_asic_init, cond="is_loki_cob", unless="is_error")
        | loki_asic_init.to(loki_asic_init, internal=True, cond=["!is_timeout", "!is_loki_asic"], unless="is_error")
        | loki_asic_init.to(monitoring, cond="is_loki_asic", unless="is_error")
    )

    # recover from error state
    recover = Event(error.to(monitoring))

    # start the state machine
    start = Event(idle.to(initialising))


class StateMonitor:
    """Class to run the State Machine in the tornado IO loop"""
    def __init__(self, adapters: dict[str, ApiAdapter],
                 timeout=60, max_retries=3, event_history=100,
                 frequency: float = 1000):
        self.monitor = Monitor(adapters, int(timeout), int(max_retries), int(event_history))
        self.machine = MonitorControl(self.monitor)

        self.machine.send("start")  # initialise state machine

        self.run_loop = PeriodicCallback(self.run, frequency)
        self.run_loop.start()

        self.tree = {
            "state": (lambda: self.machine.current_state.name, None,
                      {"allowed_values": [state.name for state in self.machine.states]}),
            "num_resets": (lambda: self.monitor.reset_counter, None),
            "reset_history": (lambda: list(self.monitor.reset_history), None),
            "clear_history": (None, lambda _: self.monitor.clear_counters()),
            "current_retry": (lambda: self.monitor.retries, None,
                              {"max": self.monitor.max_retries}),
            "recover": (lambda: self.machine.current_state == self.machine.error,
                        lambda _: self.recover_from_error()),
            "monitoring": (self.run_loop.is_running, self.run_monitor,
                           {"description": "Run the IOLoop Callback to trigger Monitoring events"}),
            "error": (lambda: str(self.monitor.error) if self.monitor.error is not None else "", None),
            "debug_error": (None, lambda _: self._inject_error()),
            "next_state": (lambda: [t.target.name for t in self.machine.current_state.transitions
                                    if t.target not in [self.machine.current_state, self.machine.error]], None)
        }

    def run_monitor(self, run: bool):
        if run and not self.run_loop.is_running():
            self.run_loop.start()
        if not run and self.run_loop.is_running():
            self.run_loop.stop()

    def run(self):
        try:
            state = self.machine.current_state
            enabled_events: list[Event] = self.machine.enabled_events()
            if state != self.machine.error:
                if len(enabled_events) > 1:
                    # report if State Machine is not certain of which state to transition to
                    # due to the setup of the state machine conditions, this should not happen
                    logging.warning("State machine has no definitive Event: %s",
                                    ", ".join([f"{e.name}" for e in enabled_events]))

                self.machine.send(enabled_events[0].id)
            else:
                self.run_monitor(False)

        except TransitionNotAllowed as err:
            logging.error("Error trying to run State Machine: %s", err)

    def _inject_error(self):
        self.monitor.error = StateMachineException("Debug Injected Error")

    def recover_from_error(self):

        state = self.machine.current_state

        if state == self.machine.error:
            self.machine.send("recover")
            self.run_monitor(True)
