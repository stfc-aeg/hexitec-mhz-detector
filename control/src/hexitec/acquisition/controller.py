import logging
from hexitec.base.base_controller import BaseController, BaseError
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from hexitec.acquisition.processes.configuration import Configuration
from hexitec.acquisition.processes.state import State

from typing import TypedDict, cast
from histogrammer.adapter.adapter import HistogramAdapter, HistogramController
from hexitec.liveview.adapter import HistogramLiveViewAdapter, HistogramLiveViewController
from munir.adapter import MunirAdapter, MunirFpController, MunirController
from odin.adapters.proxy import ProxyAdapter
from hexitec.adapter import HexitecAdapter, HexitecController
from readout_processor.adapter import ReadoutProcessorAdapter, ReadoutProcessorController

from hexitec.util.iac import iac_get, iac_set

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
        self.munir_ad = cast(MunirAdapter, adapters['munir'])
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

        # Set a default file name and path
        setattr(self.munir_hexitec, 'file_path', self.options.get('default_filepath', '/tmp/'))
        setattr(self.munir_hexitec, 'file_name', self.options.get('default_filename', 'mhz_acquisition'))

        # Provide adapters to sub-processess
        self.configuration = Configuration(self.adapters)
        self.state = State(self.adapters)

        # Connect histogrammer and setup UDP
        self.histogrammer.setConnect(True)
        self.histogrammer.histogrammer.udpHandler.setupUdp()

        self._build_tree()
        self._handle_default_settings()

    def _handle_default_settings(self):
        """Take the default configuration options provided and apply them."""
        # Baseline
        self.histogrammer.setBaselineMode('baselineDiv', int(self.options.get('baseline_divide', 256)))
        self.histogrammer.setBaselineMode('enableDither', bool(int(self.options.get('baseline_dither', 0))))
        # Thresholds
        self.histogrammer.setThreshold(
            'absolute', 
            low=int(self.options.get('thres_abs_low_default', 1)),
            high=int(self.options.get('thres_abs_high_default', 1000))
        )
        self.histogrammer.setThreshold(
            'lower',
            low=int(self.options.get('thres_low_neg_default', -35)),
            high=int(self.options.get('thres_low_pos_default', 25))
        )
        self.histogrammer.setThreshold(
            'main',
            low=int(self.options.get('thres_main_neg_default', -35)),
            high=int(self.options.get('thres_main_pos_default', 25))
        )
        # Charge-sharing
        self.histogrammer.SetChargeSharing("enbEdgePos", bool(int(self.options.get('charge_pos_edge', 0))))
        self.histogrammer.SetChargeSharing("enbSumming", bool(int(self.options.get('charge_sum_enable', 0))))
        self.histogrammer.SetChargeSharing("enbNegNeb", bool(int(self.options.get('charge_neg_neighbour', 0))))
        self.histogrammer.SetChargeSharing("enbAdjPosn", bool(int(self.options.get('charge_pos_adjust', 0))))

    def _build_tree(self):
        """Build the parameter tree for the acquisition controller."""
        config_tree = self.configuration.tree
        state_tree = self.state.tree
        self.param_tree = ParameterTree({
            'config': config_tree,
            'state': state_tree
        })

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
