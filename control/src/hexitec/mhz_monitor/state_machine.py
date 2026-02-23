import logging
from collections import deque
from datetime import datetime
from typing import TypedDict

from hexitec.util.iac import IACError, iac_get, iac_set
from odin.adapters.adapter import ApiAdapter
from odin.adapters.proxy import ProxyAdapter
from readout_processor.adapter import ReadoutProcessorAdapter
from statemachine import State, StateMachine, Event
from statemachine.transition_list import TransitionList
from tornado.ioloop import PeriodicCallback


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


class MHZMonitor(StateMachine):
    current_retry = 0
    reset_counter = 0
    cleanup = False

    frame_number = 0
    status: ReadoutStatus = None

    # States
    idle = State("Idle", initial=True)
    initialising = State("Initialising")
    monitoring = State("Monitoring")
    resetting = State("Resetting")
    waiting_for_lanes = State("WaitingForLanes")
    waiting_for_channels = State("WaitingForChannels")
    reactivating = State("Reactivating")
    error = State("Error")

    # Transitions
    start = Event(idle.to(initialising))
    init_success = initialising.to(monitoring)

    # Monitor Loop
    monitor: TransitionList = (monitoring.to.itself(internal=True)
                               | reactivating.to(monitoring)
                               )

    # Reset Path
    wait_lanes: TransitionList = (resetting.to(waiting_for_lanes)
                                  | waiting_for_lanes.to.itself(internal=True))
    wait_channels: TransitionList = (waiting_for_lanes.to(waiting_for_channels)
                                     | waiting_for_channels.to.itself(internal=True))
    reactivate: TransitionList = (waiting_for_channels.to(reactivating)
                                  | reactivating.to.itself(internal=True))

    reset = (monitoring.to(resetting)
             | waiting_for_lanes.to(resetting)
             | waiting_for_channels.to(resetting)
             | reactivating.to(resetting)
             )

    # Error State
    raise_error = (monitoring.to(error)
                   | resetting.to(error)
                   | waiting_for_lanes.to(error)
                   | waiting_for_channels.to(error)
                   | reactivating.to(error)
                   )

    recover = error.to(resetting)

    def __init__(self, adapters: dict[str, ApiAdapter],
                 timeout=60, max_retries=3, event_history=100):
        
        # self.frame_check_duration = check_interval
        # self.frame_check_interval = frame_check_interval
        self.timeout = timeout
        self.max_timeout = timeout
        self.max_retries = max_retries
        self.reset_history = deque(maxlen=event_history)

        self.proxy: ProxyAdapter = adapters["proxy"]
        self.readout: ReadoutProcessorAdapter = adapters["readout"]

        super().__init__()

    def on_enter_idle(self):
        logging.info("State Machine Started")

    @start.on
    def initialise(self):
        """Initialise State Machine"""
        try:
            self.status = self._get_status()
            self.frame_number = self._get_frame_number()
        except IOError:
            logging.error("State Machine Initialisation Failed, could not read from device")
            self.raise_error()
        
        self.init_success()
    
    @monitoring.enter
    def start_monitoring(self):
        logging.info("Monitoring Loop Started")

    @monitor.on
    def monitor_readout(self):
        """Monitor Readout status. Trigger reset if not running."""

        try:
            self.status = self._get_status()
        except IOError:
            self.raise_error()
        
        if not self.status["is_running"] or not self.status["frame_changing"]:
            # Readout is not running, start reset process
            logging.warning("Readout not running. Triggering Reset")
            self.reset()

    @reset.before
    def log_reset_event(self, event: str, source: State):
        """Log a reset event before starting the reset process"""
        if source != self.monitoring:
            self.current_retry += 1
            if self.current_retry > self.max_retries:
                logging.warning("Exceeded Reset Retry limit")
                self.raise_error()

        self.reset_counter += 1
        logging.info("Starting reset sequence. Attempt %d/%d",
                     self.current_retry + 1, self.max_retries)
        reasons = {
            self.monitoring.name: "Monitoring Loop saw failed Readout",
            self.waiting_for_lanes.name: "Timeout Waiting for Lanes",
            self.waiting_for_channels.name: "Timeout Waiting for Channel",
            self.reactivating.name: "Timeout waiting for Reactivation to succeed"
        }
        event = {
            "count": self.reset_counter,
            "timestamp": datetime.now().isoformat(),
            "reason": reasons.get(source.name, "Unknown Reset Event"),
            "retry_attempt": self.current_retry
        }

        self.reset_history.append(event)

    @reset.on
    def reset_readout(self):
        """Start the Reset process"""

        try:
            iac_set(self.proxy, "loki/application/system_state", {"SYNC": False})
            logging.debug("Loki Data Sync OFF")

            iac_set(self.readout, "status", {"reset": True})
            logging.debug("Readout resetting")

            self.wait_lanes()
        except IACError:
            self.raise_error()

    @waiting_for_lanes.enter
    def start_wait_lanes(self):
        logging.info("Waiting for Lane to come back")

    @wait_lanes.on
    def await_lanes(self):
        try:
            self.status = self._get_status()
        except IOError:
            self.raise_error()

        if self.status["aurora"]["lane"]:
            logging.debug("Lane Up")
            self.timeout = self.max_timeout
            self.wait_channels()
        else:
            # still waiting. reduce timeout
            self.timeout -= 1
            if not self.timeout:
                # timed out
                self.reset()

    @waiting_for_channels.enter
    def start_wait_channel(self):

        try:
            iac_set(self.proxy, "loki/application/system_state", {"ASIC_REBOND": True})
            logging.debug("Loki Rebond command sent")
            self.wait_channels()
        except IACError:
            self.raise_error()
    
        logging.info("Waiting for Channel to come back")

    @wait_channels.on
    def await_channel(self):
        try:
            self.status = self._get_status()
        except IACError:
            self.raise_error()
        
        if self.status["aurora"]["channel"]:
            logging.debug("Channel Up")
            self.timeout = self.max_timeout
            self.reactivate()
        else:
            # still waiting. reduce timeout
            self.timeout -= 1
            if not self.timeout:
                # timed out
                self.reset()
    
    @reactivating.enter
    def start_reactivation(self):
        logging.info("Reactivating Readout after reset")

        try:
            iac_set(self.readout, "status", {"reactivate": True})
            iac_set(self.proxy, "loki/application/system_state", {"SYNC": True})
        
        except IACError:
            self.raise_error()

    @reactivate.on
    def await_reactivation(self):

        try:
            self.status = self._get_status()
        except IACError:
            self.raise_error()

        if self.status["is_running"] and self.status["frame_changing"]:
            logging.debug("Datapath recovered")
            self.timeout = self.max_timeout
            self.current_retry = 0
            self.monitor()
        else:
            self.timeout -= 1
            if not self.timeout:
                self.reset()

    @raise_error.on
    def process_error(self, event: str, source: State):
        logging.error("Entered Error State from %s State", source)
        logging.error("Total resets performed: %d", self.reset_counter)

    @recover.before
    def recover_from_error(self):
        logging.info("Recovering from Error")
        self.reset()

    def _get_status(self) -> ReadoutStatus:
        """Get the Readout Status"""

        try:
            stat = iac_get(self.readout, "status")
            if not stat['is_running']:
                logging.debug("Readout is not running correctly")
                logging.debug("Aurora Channel: %s. Aurora Lane: %s",
                              stat["aurora"]["channel"], stat["aurora"]["lane"])
                logging.debug("CMAC Lane 0: %s. Lane 1: %s",
                              stat["cmac"]["cmac_0_lane_up"] == 1,
                              stat["cmac"]["cmac_1_lane_up"] == 1)
            return stat
        except IACError as err:
            logging.error("Failed to get Readout Status from Adapter")
            logging.error(err)
            raise err

    def _get_frame_number(self) -> int:
        """Get the Frame Number"""

        stat = self._get_status()
        return stat["frame_number"]

    def _check_frame_variation(self) -> bool:
        """Check that the frame number is changing"""

        self.status = self._get_status()
        return self.status["frame_changing"]

    def _clear_counters(self):
        self.current_retry = 0
        self.reset_counter = 0
        self.reset_history.clear()


class StateMonitor:
    """Class to run the State Machine in the tornado IO loop"""
    def __init__(self, adapters: dict[str, ApiAdapter],
                 timeout=60, max_retries=3, event_history=100,
                 frequency: float = 1000):
        
        self.machine = MHZMonitor(adapters, timeout,
                                  int(max_retries), int(event_history))
        
        self.machine.start()  # initialise state machine

        self.run_loop = PeriodicCallback(self.run, frequency)
        self.run_loop.start()

        self.tree = {
            "state": (lambda: self.machine.current_state.name, None,
                      {"allowed_values": [state.name for state in self.machine.states]}),
            "num_resets": (lambda: self.machine.reset_counter, None),
            "reset_history": (lambda: list(self.machine.reset_history), None),
            "clear_history": (None, lambda _: self.machine._clear_counters()),
            "current_retry": (lambda: self.machine.current_retry, None,
                              {"max": self.machine.max_retries}),
            "recover": (lambda: self.machine.current_state == self.machine.error,
                        lambda _: self.recover_from_error()),
            "monitoring": (self.run_loop.is_running, self.run_monitor,
                           {"description": "Run the IOLoop Callback to trigger Monitoring events"})
        }

    def run_monitor(self, run: bool):
        if run and not self.run_loop.is_running():
            self.run_loop.start()
        if not run and self.run_loop.is_running():
            self.run_loop.stop()

    def run(self):
        state = self.machine.current_state

        if state == self.machine.idle:
            # shouldnt be, because of initialisation, but just in case
            self.machine.start()

        # loops!
        elif state == self.machine.monitoring:
            # continue monitoring
            self.machine.monitor()

        elif state == self.machine.waiting_for_lanes:
            # continue waiting for lanes
            self.machine.wait_lanes()

        elif state == self.machine.waiting_for_channels:
            # continue waiting for channel
            self.machine.wait_channels()

        elif state == self.machine.reactivating:
            self.machine.reactivate()

    def recover_from_error(self):

        state = self.machine.current_state

        if state == self.machine.error:
            self.machine.recover()
