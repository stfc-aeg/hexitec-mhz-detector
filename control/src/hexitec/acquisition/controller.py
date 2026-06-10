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
        self.histogrammer = cast(HistogramAdapter, adapters['histogram'])
        self.liveview = cast(HistogramLiveViewController, adapters['liveview'])
        self.munir = cast(MunirFpController, adapters['munir'])
        self.proxy = cast(ProxyAdapter, adapters['proxy'])
        self.hexitec = cast(HexitecController, adapters['hexitec'])
        self.readout = cast(ReadoutProcessorController, adapters['readout'])

        # Verify munir subsystem exists
        if self.munir_subsystem not in self.munir.controller.munir_managers:
            raise AcquisitionError(
                f"Could not find munir subsystem '{self.munir_subsystem}' in available managers: "
                f"{list(self.munir.controller.munir_managers.keys())}"
            )

        # Set a default file name and path
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_path", self.options.get('default_filepath', '/tmp/'))
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", self.options.get('default_filename', 'mhz_acquisition'))

        # Provide adapters to sub-processess

        self.configuration = Configuration(self.adapters, self.munir_subsystem, AcquisitionError)
        self.state = State(self.adapters, self.munir_subsystem, AcquisitionError)

        self.state._register_configuration(self.configuration)
        self.configuration._register_state(self.state)

        # Connect histogrammer and setup UDP
        iac_set(self.histogrammer, "device/connect", True)
        iac_set(self.histogrammer, "udp/setup", True)

        self._build_tree()
        self._handle_default_settings()


    def _handle_default_settings(self):
        """Take the default configuration options provided and apply them."""
        # Baseline
        iac_set(self.histogrammer, "config/baseline/divide", int(self.options.get('baseline_divide', 256)))
        iac_set(self.histogrammer, "config/baseline/dither", bool(int(self.options.get('baseline_dither', 0))))

        # Thresholds
        iac_set(self.histogrammer, "config/thresholds/absolute/high", int(self.options.get('thres_abs_high_default', 1000)))
        iac_set(self.histogrammer, "config/thresholds/absolute/low", int(self.options.get('thres_abs_low_default', 1)))
        iac_set(self.histogrammer, "config/thresholds/low/neg", int(self.options.get('thres_low_neg_default', -35)))
        iac_set(self.histogrammer, "config/thresholds/low/pos", int(self.options.get('thres_low_pos_default', 25)))
        iac_set(self.histogrammer, "config/thresholds/main/neg", int(self.options.get('thres_main_neg_default', -35)))
        iac_set(self.histogrammer, "config/thresholds/main/pos", int(self.options.get('thres_main_pos_default', 25)))

        # Charge-sharing
        iac_set(self.histogrammer, "config/charge_sharing/positive_edge", bool(int(self.options.get('charge_pos_edge', 0))))
        iac_set(self.histogrammer, "config/charge_sharing/sum_enable", bool(int(self.options.get('charge_sum_enable', 0))))
        iac_set(self.histogrammer, "config/charge_sharing/negative_neighbour", bool(int(self.options.get('charge_neg_neighbour', 0))))
        iac_set(self.histogrammer, "config/charge_sharing/position_adjust", bool(int(self.options.get('charge_pos_adjust', 0))))
        
        # UDP settings
        iac_set(self.readout, "udp/core_0/dest_mac", self.options.get('core_0_dest_mac', 'E8:EB:D3:CC:A9:00'))
        iac_set(self.readout, "udp/core_0/src_mac", self.options.get('core_0_src_mac', '62:00:00:00:01:0A'))
        iac_set(self.readout, "udp/core_0/dest_ip", self.options.get('core_0_dest_ip', '10.0.100.8'))
        iac_set(self.readout, "udp/core_0/src_ip", self.options.get('core_0_src_ip', '10.0.100.108'))
        iac_set(self.readout, "udp/core_1/dest_mac", self.options.get('core_1_dest_mac', 'E8:EB:D3:CC:A9:00'))
        iac_set(self.readout, "udp/core_1/src_mac", self.options.get('core_1_src_mac', '62:00:00:00:01:0A'))
        iac_set(self.readout, "udp/core_1/dest_ip", self.options.get('core_1_dest_ip', '10.0.100.8'))
        iac_set(self.readout, "udp/core_1/src_ip", self.options.get('core_1_src_ip', '10.0.100.108'))

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
