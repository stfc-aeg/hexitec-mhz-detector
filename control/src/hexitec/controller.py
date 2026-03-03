import logging
from concurrent.futures import ThreadPoolExecutor

from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from .base.base_controller import BaseController, BaseError
from .mhz_monitor.state_machine import StateMonitor
from .util.iac import IACError, iac_set


class HexitecError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""


class HexitecController(BaseController):
    """Controller class for HEXITEC."""
    executor = ThreadPoolExecutor(max_workers=2)

    def __init__(self, options: dict[str, str]):
        self.options = options
        self.mhz_monitor = None
        self.param_tree = None

    def initialize(self, adapters):
        try:
            self.adapters = adapters
            logging.debug(f"Adapters initialized: {list(adapters.keys())}")
            # open xdma device
            iac_set(adapters["readout"], "control", {'open': 'true'})
        except IACError as e:
            logging.error(f"{e}")

        kwargs = {key: float(self.options[key]) for key in
                  ("timeout", "max_retries", "event_history", "frequency")
                  if key in self.options}
        kwargs["adapters"] = self.adapters

        self.mhz_monitor = StateMonitor(**kwargs)
        self.adxdma_tree = ParameterTree(self.mhz_monitor.tree)

        self.param_tree = ParameterTree({
            'mhz_monitor': self.adxdma_tree,
            'user_type': (lambda: self.options['user_type'], None)
        })

    def cleanup(self):
        """Cleanly shutdown adapter services"""
        logging.info("Cleaning up Controller")
        if self.mhz_monitor:
            self.mhz_monitor.run_monitor(False)

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
