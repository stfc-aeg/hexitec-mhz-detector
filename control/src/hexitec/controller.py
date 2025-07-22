import logging
import time
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from .base.base_controller import BaseController, BaseError

from .util.iac import iac_set, iac_get
from .admonitor.adxdma_flags import AdxdmaFlags
from .admonitor.adxdma_state import AdxdmaMonitor


class HexitecError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""

class HexitecController(BaseController):
    """Controller class for HEXITEC."""
    executor = ThreadPoolExecutor(max_workers=2)

    def __init__(self, options):
        self.options = options
        self.executor_threads_en = True
        self.ad_flags = AdxdmaFlags()
        self.adxdma_monitor = None
        self.param_tree = None

    def initialize(self, adapters):
        self.adapters = adapters
        logging.debug(f"Adapters initialized: {list(adapters.keys())}")

        #add self.options here
        try:
            self.adxdma_monitor = AdxdmaMonitor(controller=self, check_interval=5, bond_timeout=100)
        except Exception as e:
            logging.debug(f"Error: {e}")

        try:
            if self.adxdma_monitor:
                self.adxdma_tree = ParameterTree({
                    'current_retry': (lambda: self.adxdma_monitor.current_retry, None),
                    'max_retries': (lambda: self.adxdma_monitor.max_retries, None),
                    'reset_retries': (lambda: None, self.adxdma_monitor._reset_retries),
                    'chan_up': (lambda: self.adxdma_monitor.chan_up, None),
                    'lane_up': (lambda: self.adxdma_monitor.lane_up, None),
                    'bonded': (lambda: self.adxdma_monitor.bonded, None),
                    'current_state': (lambda: self.adxdma_monitor.current_state.name, None),
                    'all_states': (lambda: [state.name for state in self.adxdma_monitor.states], None),
                    'transition_details': (lambda: [
                        {
                            'name': t.event,
                            'from': t.source.id,
                            'to': t.target.id
                        }
                        for state in self.adxdma_monitor.states_map.values()
                        for t in state.transitions
                    ], None),
                    'available_from_current': (lambda: [
                        {
                            'name': t.event,
                            'to': t.target.id
                        }
                        for t in self.adxdma_monitor.current_state.transitions
                    ] if self.adxdma_monitor.current_state else [], None)
                })
            else:
                self.adxdma_tree = ParameterTree({
                    'current_state': (lambda: "Not Available", None),
                    'all_states': (lambda: [], None),
                    'transition_details': (lambda: [], None),
                    'available_from_current': (lambda: [], None)
                })
        except Exception as e:
            logging.debug(f"Error: {e}")

        # all_transitions = [
        #     t
        #     for state in self.adxdma_monitor.states_map.values()     
        #     for t in state.transitions
        # ]


        # logging.debug(f"{all_transitions}")
        # for t in all_transitions:
        #     logging.debug(f"{t.source.id} -> {t.target.id}")

        self.param_tree = ParameterTree({
            'adxdma_monitor': self.adxdma_tree
        })
        self.background_task()
        self.admonitor_task()


    def cleanup(self):
        """Cleanly shutdown adapter services"""
        logging.info("Cleaning up Controller")
        self.executor_threads_en = False
        if self.adxdma_monitor:
            self.adxdma_monitor.cleanup = True

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
    def admonitor_task(self):
        """"""
        while self.executor_threads_en:
            time.sleep(1)
            # only cll loop if the statemachine created successfully
            if self.adxdma_monitor:
                try:
                    if self.adxdma_monitor.current_state.name == 'Monitoring':
                        self.adxdma_monitor.loop()
                except Exception as e:
                    logging.error(f"ADXDMA monitor error:{e}")
