import time
import logging
from datetime import datetime
from collections import deque

from statemachine import StateMachine, State
from ..util.iac import iac_get, iac_set


class MHZMonitor(StateMachine):
    """
    StateMachine to monitor the datapath of the AD card in the HexitecMHz system, performs a set of 
    remedial actions to attempt to re-establish the datapath when error's are detected.  
    """

    # States
    idle = State("Idle", initial=True)
    initialising = State("Initialising")
    monitoring = State("Monitoring")
    resetting = State("Resetting")
    waiting_for_lanes = State("WaitingForLanes")
    rebonding = State("Rebonding")
    waiting_for_channels = State("WaitingForChannels")
    reactivating = State("Reactivating")
    error = State("Error")

    # Transitions for init process
    start = idle.to(initialising)
    init_success = initialising.to(monitoring)
    init_failed = initialising.to(error)

    # Monitoring loop - self transition
    monitor = monitoring.to(monitoring)

    # Transitions for reset workflow
    trigger_reset = monitoring.to(resetting)
    wait_lanes = resetting.to(waiting_for_lanes)
    send_rebond = waiting_for_lanes.to(rebonding)
    wait_channels = rebonding.to(waiting_for_channels)
    reactivate = waiting_for_channels.to(reactivating)
    resume_monitoring = reactivating.to(monitoring)

    # Retry transitions
    retry_reset_from_lanes = waiting_for_lanes.to(resetting)
    retry_reset_from_channels = waiting_for_channels.to(resetting)
    retry_reset_from_reactivating = reactivating.to(resetting)

    # Error transitions
    error_from_monitoring = monitoring.to(error)
    error_from_resetting = resetting.to(error)
    error_from_waiting_lanes = waiting_for_lanes.to(error)
    error_from_rebonding = rebonding.to(error)
    error_from_waiting_channels = waiting_for_channels.to(error)
    error_from_reactivating = reactivating.to(error)

    # Recovery transition
    recover = error.to(initialising)

    def __init__(
        self,
        controller,
        check_interval=5,
        lane_timeout=30,
        channel_timeout=30,
        max_retries=3,
        frame_check_interval=0.5,
        event_history=100
    ):
        self.ctrl = controller
        self.frame_check_duration = check_interval
        self.frame_check_interval = frame_check_interval
        self.lane_timeout = lane_timeout
        self.channel_timeout = channel_timeout
        self.max_retries = max_retries

        # Paths for xdma adapter
        self.stat_path = "registers/adm_pcie_9v5_stat/"
        self.ctrl_path = "registers/adm_pcie_9v5_ctrl/"
        self.mhz_top_path = "registers/hexitec_mhz_top/"
        self.fields_path = (
            "hexitec_mhz_front_end_hexitec_hist_frame_generator_acq_ctrl/fields/"
        )
        self.frame_counter_lower_path = (
            "hexitec_mhz_front_end_hexitec_hist_frame_generator_frame_number_lower/value"
        )

        # Adapters
        self.proxy = self.ctrl.adapters["proxy"]
        self.xdma = self.ctrl.adapters["xdma"]
        
        # Status parameters
        self.current_retry = 0
        self.cleanup = False
        self.reset_counter = 0
        self.reset_history = deque(maxlen=event_history)

        self.chan_up = None
        self.lane_up = None
        self.bonded = False
        self.expected_value = 0xFFFFF
        
        # call the init of the StateMachine class to register all the states and transisitons
        super().__init__()

    def on_enter_idle(self):
        logging.info("ADXDMA monitor started")

    def on_enter_initialising(self):
        """Initialise by attempting to get status information"""
        try:
            # Read and store status
            chan_up, lane_up = self._get_status()
            if chan_up is None or lane_up is None:
                raise Exception("Cannot read ADXDMA status registers")

            # Read a frame number once
            frame = self._get_frame_number()
            if frame is None:
                raise Exception("Cannot read frame counter")

            logging.info(
                f"Initialisation successful. Chan: 0x{chan_up:05X}, "
                f"Lane: 0x{lane_up:05X}, Frame: {frame}"
            )
            self.current_retry = 0
            self.init_success()

        except Exception as e:
            logging.error(f"Initialisation failed: {e}")
            self.current_retry += 1
            if self.current_retry >= self.max_retries:
                self.init_failed()

    def on_monitor(self):
        """
        Checks lane and channel status, looks for frame count varying to indicate compelete 
        datapath, performs remedial actions if an error is detected.
        """
        try:
            # Check aurora status
            chan_up, lane_up = self._get_status()

            # Check if valid response was returned
            if chan_up is None or lane_up is None:
                self.error_from_monitoring()
                return
            
            logging.info(
                f"Monitoring: Chan: 0x{chan_up:05X} | Lane: 0x{lane_up:05X}"
            )

            # Check if all lanes and channels are up
            if lane_up != self.expected_value or chan_up != self.expected_value:
                reason = (
                    f"Lane/Channel down - Lane: 0x{lane_up:05X} Chan: 0x{chan_up:05X}"
                )
                logging.warning(reason)
                self.log_reset_event(reason)
                # start the reset if the cleanup flag has not been set
                self.trigger_reset() if not self.cleanup else None
                return

            # Check if the frame count is varying, indicating data flowing
            if not self._check_frame_variation():
                reason = "Frames not varying despite good lane/channel status"
                logging.warning(reason)
                self.log_reset_event(reason)
                # start the reset if the cleanup flag has not been set  
                self.trigger_reset() if not self.cleanup else None
                return

        except Exception as e:
            logging.error(f"Error in monitoring: {e}")
            self.error_from_monitoring()

    def on_enter_resetting(self):
        """Execute reset sequence."""
        logging.info(
            f"Starting reset sequence (attempt {self.current_retry + 1}/{self.max_retries})"
        )

        try:
            # Data SYNC OFF
            iac_set(self.proxy, "loki/application/system_state", {"SYNC": False})
            logging.debug("Data sync OFF")

            # Manual trigger and acquire OFF
            iac_set(self.xdma, self.mhz_top_path + self.fields_path, {"manual_trig": False})
            iac_set(self.xdma, self.mhz_top_path + self.fields_path, {"acquire": False})
            logging.debug("Manual trigger and acquire OFF")

            # Reset registers
            reset_registers = [
                "data_path_reset",
                "aurora_reset",
                "cmac_0_reset",
                "cmac_1_reset",
                "cmac_2_reset",
            ]

            for register in reset_registers:
                # toggle the reset high then low
                iac_set(self.xdma, self.ctrl_path + "domain_resets/fields/", {register: 1})
                iac_set(self.xdma, self.ctrl_path + "domain_resets/fields/", {register: 0})
                logging.debug(f"Reset {register} complete")

            self.wait_lanes()

        except Exception as e:
            logging.error(f"Error during reset: {e}")
            self.error_from_resetting()

    def on_enter_waiting_for_lanes(self):
        """Wait for lanes to come up."""
        logging.info("Waiting for aurora lanes to come up")
        start_time = time.time()

        # Poll the lane status, while cleanup hasnt been called, and the executor threads are active
        while (time.time() - start_time) < self.lane_timeout:
            if self.cleanup or not self.ctrl.executor_threads_en:
                return

            try:
                # get status
                chan_up, lane_up = self._get_status()
                if lane_up == self.expected_value:
                    logging.info(f"Aurora lanes up: 0x{lane_up:05X}")
                    self.send_rebond()
                    return

                logging.debug(f"Waiting for lanes: 0x{lane_up:05X}")
                time.sleep(1)

            except Exception as e:
                logging.error(f"Error waiting for lanes: {e}")
                self.error_from_waiting_lanes()
                return

        # Timeout
        logging.warning("Timeout waiting for lanes")
        self.current_retry += 1
        if self.current_retry >= self.max_retries:
            self.error_from_waiting_lanes()
        else:
            self.retry_reset_from_lanes()

    def on_enter_rebonding(self):
        """Send rebond command."""
        logging.info("Sending ASIC_REBOND command")

        try:
            # send the rebond command to loki through proxy
            iac_set(self.proxy, "loki/application/system_state", {"ASIC_REBOND": True})
            logging.debug("ASIC_REBOND command sent")
            self.wait_channels()

        except Exception as e:
            logging.error(f"Error during rebonding: {e}")
            self.error_from_rebonding()

    def on_enter_waiting_for_channels(self):
        """Wait for channels to bond."""
        logging.info("Waiting for aurora channels to bond")
        start_time = time.time()

        while (time.time() - start_time) < self.channel_timeout:
            if self.cleanup or not self.ctrl.executor_threads_en:
                return

            try:
                chan_up, lane_up = self._get_status()
                if chan_up == self.expected_value and lane_up == self.expected_value:
                    logging.info(
                        f"Bonding successful - Chan: 0x{chan_up:05X}, Lane: 0x{lane_up:05X}"
                    )
                    self.reactivate()
                    return

                logging.debug(
                    f"Waiting for bond - Chan: 0x{chan_up:05X}, Lane: 0x{lane_up:05X}"
                )
                time.sleep(1)

            except Exception as e:
                logging.error(f"Error waiting for channels: {e}")
                self.error_from_waiting_channels()
                return

        # Timeout
        logging.warning("Timeout waiting for channels")
        self.current_retry += 1
        if self.current_retry >= self.max_retries:
            self.error_from_waiting_channels()
        else:
            self.retry_reset_from_channels()

    def on_enter_reactivating(self):
        """Set  back on and verify."""
        logging.info("Reactivating data acquisition...")

        try:
            # Acquire and manual trigger ON
            iac_set(self.xdma, self.mhz_top_path + self.fields_path, {"acquire": True})
            iac_set(self.xdma, self.mhz_top_path + self.fields_path, {"manual_trig": True})
            logging.debug("Acquire and manual trigger ON")

            # Data sync ON
            iac_set(self.proxy, "loki/application/system_state", {"SYNC": True})
            logging.debug("Data sync ON")

            # Verify frames are varying
            if self._check_frame_variation():
                logging.info("Datapath recovered")
                self.current_retry = 0
                self.resume_monitoring()
            else:
                logging.warning("Frames not varying after reactivation")
                self.current_retry += 1
                if self.current_retry >= self.max_retries:
                    self.error_from_reactivating()
                else:
                    self.log_reset_event("Frames not varying after reactivation")
                    self.retry_reset_from_reactivating()

        except Exception as e:
            logging.error(f"Error during reactivation: {e}")
            self.error_from_reactivating()

    def on_enter_error(self):
        """Log error details."""
        logging.error(f"Entered error state after {self.current_retry} attempts")
        logging.error(f"Total resets performed: {self.reset_counter}")

        if self.reset_history:
            logging.error("Recent reset history:")
            for event in list(self.reset_history)[-5:]:
                logging.error(
                    f"  Reset #{event['count']} at {event['timestamp']}: {event['reason']}"
                )

        self.current_retry = 0

    def _reset_retries(self, _=None):
        """Function for controller paramtree to use to reset the current retry"""
        self.current_retry = 0

    def log_reset_event(self, reason="Unknown"):
        """Log a reset event."""
        self.reset_counter += 1
        event = {
            "count": self.reset_counter,
            "timestamp": datetime.now().isoformat(),
            "reason": reason,
            "retry_attempt": self.current_retry,
        }
        self.reset_history.append(event)

    def _get_status(self):
        """
        Get aurora status and update self.chan_up / self.lane_up / self.bonded.
        Returns (chan_up, lane_up) or (None, None) on error.
        """
        # if cleanup is in progress, return None values
        if self.cleanup:
            return None, None
        
        try:
            stat = iac_get(self.xdma, self.stat_path, as_dict=True)
            chan_up = int(stat["adm_pcie_9v5_stat"]["aurora_chan_up"]["value"])
            lane_up = int(stat["adm_pcie_9v5_stat"]["aurora_lane_up"]["value"])
            self.chan_up = chan_up
            self.lane_up = lane_up
            self.bonded = (chan_up == self.expected_value) and (lane_up == self.expected_value)
            return chan_up, lane_up
        except Exception as e:
            logging.error(f"Failed to get status: {e}")
            self.chan_up = None
            self.lane_up = None
            self.bonded = False
            return None, None

    def _get_frame_number(self):
        """Get frame number."""
        try:
            return int(iac_get(self.xdma, self.mhz_top_path + self.frame_counter_lower_path))
        except Exception as e:
            logging.error(f"Failed to get frame number: {e}")
            return None

    def _check_frame_variation(self, ):
        """Check frame variation."""
        # Get a reference frame number
        start = self._get_frame_number()
        if start is None:
            return False

        # workout while duration
        timeout_tstamp = time.time() + self.frame_check_duration
        while time.time() < timeout_tstamp:
            # If the adapter is being cleaned up, return true to exit the check and to prevent a false-reset from occuring
            if self.cleanup is True:
                return True
            # get a new frame number to compare
            current = self._get_frame_number()
            if current is None:
                return False
            if current != start:
                logging.debug(f"Frame counter varied from {start} to {current}")
                return True
            time.sleep(self.frame_check_interval)

        logging.warning(f"Frame counter stuck at {start} for {self.frame_check_duration} seconds")
        return False

    def get_reset_stats(self):
        """Get statistics."""
        return {
            "total_resets": self.reset_counter,
            "recent_resets": list(self.reset_history),
            "current_state": self.current_state.name,
            "current_retry": self.current_retry,
            "chan_up": self.chan_up,
            "lane_up": self.lane_up,
            "bonded": self.bonded,
        }
