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
    executor = ThreadPoolExecutor(max_workers=1)

    def __init__(self, options):
        self.options = options
        self.background_task_en = True
        self.ad_flags = AdxdmaFlags()
        self.adxdma_monitor = None
        self.param_tree = ParameterTree({
        })

    def initialize(self, adapters):
        self.adapters = adapters
        logging.debug(f"Adapters initialized: {list(adapters.keys())}")

        #add self.options here
        try:
            self.adxdma_monitor = AdxdmaMonitor(controller=self, check_interval=5, bind_timeout=100)
        except Exception as e:
            logging.debug(f"Error: {e}")
        self.background_task()

    def cleanup(self):
        """Cleanly shutdown adapter services"""
        logging.info("Cleaning up Controller")
        logging.info('Stopping background task')
        self.background_task_en = False

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
        logging.debug("calling background task")
        while self.background_task_en:
            time.sleep(1)
            try:
                self.adxdma_monitor.loop()
            except Exception as e:
                logging.error(f"ADXDMA monitor error:{e}")
