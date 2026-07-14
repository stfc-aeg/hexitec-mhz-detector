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
        
        if 'sequencer' in self.adapters:
            logging.debug("Acquisition controller registering contexts with sequencer")
            self.adapters['sequencer'].add_context('acquisition', self)
            self.adapters['sequencer'].add_context('monitor', self.hexitec.controller)
            self.adapters['sequencer'].add_context('liveview', self.liveview.controller)
            self.adapters['sequencer'].add_context('histogram', self.histogrammer.controller)
            self.adapters['sequencer'].add_context('munir', self.munir.controller)
            self.adapters['sequencer'].add_context('proxy', self.proxy)
            self.adapters['sequencer'].add_context('readout', self.readout.controller)

        # Set a default file name and path
        default_filepath = self.options.get('default_filepath', '/tmp/')
        default_filename = self.options.get('default_filename', 'mhz_acquisition')
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_path", default_filepath)
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", default_filename)

        # Provide adapters to sub-processess

        self.configuration = Configuration(self.adapters, self.munir_subsystem, AcquisitionError)
        self.state = State(self.adapters, self.munir_subsystem, AcquisitionError, default_filepath, default_filename)

        self.state._register_configuration(configuration=self.configuration)
        self.configuration._register_state(state=self.state)

        # Connect histogrammer and setup UDP
        iac_set(self.histogrammer, "device/connect", True)
        # Currently histogrammer does not respect config, this will be fixed later
        iac_set(self.histogrammer, "udp/accelerator/rx_ip", self.options.get('accel_rx_ip', '10.0.100.8'))
        iac_set(self.histogrammer, "udp/accelerator/tx_ip", self.options.get('accel_tx_ip', '10.0.101.109'))
        iac_set(self.histogrammer, "udp/destination/ip", self.options.get('dest_ip', '10.0.101.8'))
        iac_set(self.histogrammer, "udp/source/ip", self.options.get('source_ip', '10.0.100.108'))
        iac_set(self.histogrammer, "udp/source/port", int(self.options.get('source_port', 61648)))
        iac_set(self.histogrammer, "udp/accelerator/port", int(self.options.get('accel_port', 61649)))

        iac_set(self.histogrammer, "udp/setup", True)

        try:
            # Proxy expects a JSON body; send a dict so iac_set will encode it
            iac_set(self.proxy, "loki/application/asic_settings", {"negative_range_lowhigh": "high"})
        except Exception as e:
            logging.error(f"Set failed: {e}")

        # handle_default_settings
        initial_profile = self.options.get('initial_profile', 'default')
        self.configuration.set_profile(initial_profile)

        # self._handle_default_settings()
        self._build_tree()

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
        # Stop background task
        self.state.acquisition_progress_task_enable = False
        logging.debug(f"Stopped acquisition progress task")
