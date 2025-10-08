import logging
import time
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from .base.base_controller import BaseController, BaseError

from .mhz_monitor.mhz_fm_state_machine import MHZMonitor

from .util.iac import iac_get, iac_set


class HexitecError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""

class HexitecController(BaseController):
    """Controller class for HEXITEC."""
    executor = ThreadPoolExecutor(max_workers=2)

    def __init__(self, options):
        self.options = options
        self.task_interval = float(options["task_interval"])
        self.executor_threads_en = True
        self.mhz_monitor = None
        self.param_tree = None
        self.expected_value = 0xFFFFF

    def initialize(self, adapters):
        try:
            self.adapters = adapters
            logging.debug(f"Adapters initialized: {list(adapters.keys())}")

            #open xdma device
            iac_set(adapters["registerAccessor"], "control", {'open':'true'})

            stat = iac_get(adapters["registerAccessor"], "registers/adm_pcie_9v5_stat/", as_dict=True)
            
            chan_up = hex(int(stat["adm_pcie_9v5_stat"]["aurora_chan_up"]["value"]))
            lane_up = hex(int(stat["adm_pcie_9v5_stat"]["aurora_lane_up"]["value"]))
            logging.debug(f"Chan: {chan_up}, Lane: {lane_up}")

            logging.debug(f"{(lane_up != self.expected_value or chan_up != self.expected_value)}")

        except Exception as e:
            logging.error(f"{e}")


        try:
            self.mhz_monitor = MHZMonitor(
                controller=self,
                check_interval = float(self.options["check_interval"]),
                lane_timeout = float(self.options["lane_timeout"]),
                channel_timeout = float(self.options["channel_timeout"]),
                max_retries = int(self.options["max_retries"]),
                frame_check_interval = float(self.options["frame_check_interval"]),
                event_history = int(self.options["event_history"]),
            )
            self.adxdma_tree = ParameterTree({
                    'current_retry': (lambda: self.mhz_monitor.current_retry, None),
                    'max_retries': (lambda: self.mhz_monitor.max_retries, None),
                    'reset_retries': (lambda: None, self.mhz_monitor._reset_retries),
                    'chan_up': (lambda: self.mhz_monitor.chan_up, None),
                    'lane_up': (lambda: self.mhz_monitor.lane_up, None),
                    'bonded': (lambda: self.mhz_monitor.bonded, None),
                    'current_state': (lambda: self.mhz_monitor.current_state.name, None),
                    'all_states': (lambda: [state.name for state in self.mhz_monitor.states], None),
                    'transition_details': (lambda: [
                        {
                            'name': t.event,
                            'from': t.source.id,
                            'to': t.target.id
                        }
                        for state in self.mhz_monitor.states_map.values()
                        for t in state.transitions
                    ], None),
                    'reset_events': (lambda: list(self.mhz_monitor.reset_history), None),
                    'total_resets': (lambda: self.mhz_monitor.reset_counter, None),
                    'available_from_current': (lambda: [
                        {
                            'name': t.event,
                            'to': t.target.id
                        }
                        for t in self.mhz_monitor.current_state.transitions
                    ] if self.mhz_monitor.current_state else [], None)
                })
        except Exception as e:
            logging.debug(f"Error: {e}")
            self.mhz_monitor = None
            self.adxdma_tree = ParameterTree({
                'current_state': (lambda: "Not Available", None),
                'all_states': (lambda: [], None),
                'transition_details': (lambda: [], None),
                'available_from_current': (lambda: [], None)
            })

        self.param_tree = ParameterTree({
            'mhz_monitor': self.adxdma_tree, 
            'user_type': (lambda: self.options['user_type'], None)
        })
        
        # Start background and statemachine tasks
        self.background_task()
        
        if self.mhz_monitor:
            self.mhz_monitor_task()

    def cleanup(self):
        """Cleanly shutdown adapter services"""
        logging.info("Cleaning up Controller")
        self.executor_threads_en = False
        if self.mhz_monitor:
            self.mhz_monitor.cleanup = True

    def get(self, path, with_metadata=False):
        try:
            return self.param_tree.get(path, with_metadata)
        except ParameterTreeError as error:
            logging.error(error)
            raise HexitecError(error)

    def set(self, path, data):
        try:
            self.param_tree.set(path, data)
        except ParameterTreeError as error:
            logging.error(error)
            raise HexitecError(error)
        
    @run_on_executor
    def background_task(self):
        """"""
        return
        while self.executor_threads_en:
            time.sleep(1)

    @run_on_executor
    def mhz_monitor_task(self):
        """Start the state machine and run monitoring loop"""
        while self.executor_threads_en:
            time.sleep(1)

            try:
                state_name = self.mhz_monitor.current_state.name

                if state_name == "Idle":
                    logging.info("Starting ADXDMA monitoring")
                    self.mhz_monitor.start()

                elif state_name == "Monitoring":
                    self.mhz_monitor.monitor()

            except Exception as e:
                logging.error(f"ADXDMA monitor error: {e}")