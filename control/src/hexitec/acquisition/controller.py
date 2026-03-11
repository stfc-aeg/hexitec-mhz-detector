import logging
from hexitec.base.base_controller import BaseController, BaseError
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from hexitec.acquisition.processes.configuration import Configuration

from typing import TypedDict, cast
from histogrammer.adapter.adapter import HistogramAdapter, HistogramController
from hexitec.liveview.adapter import HistogramLiveViewAdapter, HistogramLiveViewController
from munir.adapter import MunirAdapter, MunirFpController, MunirController
from odin.adapters.proxy import ProxyAdapter
from hexitec.adapter import HexitecAdapter, HexitecController
from readout_processor.adapter import ReadoutProcessorAdapter, ReadoutProcessorController

class Adapters(TypedDict):
    histogram: HistogramAdapter
    liveview: HistogramLiveViewAdapter
    munir: MunirAdapter
    proxy: ProxyAdapter
    hexitec: HexitecAdapter
    readout: ReadoutProcessorController

class AcquisitionError(BaseError):
    """Exception raised for errors in the AcquisitionController."""
    pass

class AcquisitionController(BaseController):
    """Controller for 3D histogram live data visualization."""

    def __init__(self, options):
        """Initialise the AcquisitionController object."""

        self.options = options

        self.bin_mode = options.get('default_bin_mode', 'histogram_1024')
        self.munir_subsystem = options.get('munir_subsystem', 'hexitec_mhz')

        self.acquiring = False

    def initialize(self, adapters: Adapters):
        """Initialise the acquisition controller with information about adapters currently loaded
        into the running application.
        :param adapters: dictionary of adapter instances keyed by name
        """
        self.adapters = adapters
        
        # Verify all required adapters are present
        required_adapters = ['histogram', 'liveview', 'munir', 'proxy', 'hexitec', 'readout']
        missing = [name for name in required_adapters if name not in adapters]
        if missing:
            missing = ", ".join(missing)
            raise AcquisitionError(f"Missing required adapters: {missing}")
        
        # Cast and store adapter controllers
        self.histogrammer = cast(HistogramController, adapters['histogram'].controller)
        self.liveview = cast(HistogramLiveViewController, adapters['liveview'].controller)
        self.munir = cast(MunirFpController, adapters['munir'].controller)
        self.proxy = cast(ProxyAdapter, adapters['proxy'])
        self.hexitec = cast(HexitecController, adapters['hexitec'].controller)
        self.readout = cast(ReadoutProcessorController, adapters['readout'].controller)

        # Verify munir subsystem exists
        if self.munir_subsystem not in self.munir.munir_managers:
            raise AcquisitionError(
                f"Could not find munir subsystem '{self.munir_subsystem}' in available managers: "
                f"{list(self.munir.munir_managers.keys())}"
            )
        self.munir_hexitec = self.munir.munir_managers[self.munir_subsystem]

        # Provide adapters to sub-processess
        self.configuration = Configuration(self.munir_hexitec, self.histogrammer, self.readout)

        # Connect histogrammer and setup UDP
        self.histogrammer.setConnect(True)
        self.histogrammer.histogrammer.udpHandler.setupUdp()

        self._build_tree()

    def _build_tree(self):
        """Build the parameter tree for the acquisition controller."""
        config_tree = self.configuration.tree
        self.param_tree = ParameterTree({
            'acquisition': {
                'run': (lambda: self.acquiring, self.run_acquisition)
            },
            'config': config_tree,
        })

    def _start_preview(self):
        pass

    def _stop_preview(self):
        pass

    def run_acquisition(self, value):
        """Start or stop an acquisition.
        :param value: boolean: if True, start. If False, stop
        """
        if value:
            self._start_acquisition()
        else:
            self._stop_acquisition()

    def _start_acquisition(self):
        self.acquiring = True
        # Check histogrammer details are sensible
        # Configure odin data with histogrammer details
        # Tell odin data to start acquisition
        # Start histogrammer to send data
        # Need some awaiting of acquisition end signal?

    def _stop_acquisition(self):
        self.acquiring = False
        # Tell histogrammer to stop
        # Tell odin data to stop
        # Restart preview? Perhaps should not turn on automatically, could be optional

    def get(self, path, with_metadata=False):
        """Get parameter data from controller."""
        try:
            return self.param_tree.get(path, with_metadata)
        except ParameterTreeError as error:
            logging.error("Error getting parameter: %s", error)
            raise AcquisitionError(str(error))

    def set(self, path, data):
        """Set parameter data in controller."""
        try:
            self.param_tree.set(path, data)
        except ParameterTreeError as error:
            logging.error("Error setting parameter: %s", error)
            raise AcquisitionError(str(error))
        
    def cleanup(self):
        """Clean up controller resources."""
        logging.debug("Cleaning up AcquisitionController")
