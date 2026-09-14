import logging

from hexitec.liveview.controller import HistogramLiveViewController
from odin_control.adapters.base_controller import BaseController, BaseError
from odin_control.adapters.parameter_tree import ParameterTree, ParameterTreeError
from odin_control.adapters.proxy import ProxyAdapter

from hexitec.acquisition.processes.configuration import Configuration
from hexitec.acquisition.processes.state import State
from hexitec.acquisition.processes.config_mapping import mapping

from typing import TypedDict
from histogrammer.adapter.adapter import  HistogramController
from hexitec.liveview.adapter import HistogramLiveViewController
from munir.adapter import MunirFpController
from hexitec.controller import HexitecController
from readout_processor.adapter import ReadoutProcessorController
from hexitec.configuration.adapter import ConfigurationController

from hexitec.util.iac import icc_set

class Adapters(TypedDict):
    histogram: HistogramController
    liveview: HistogramLiveViewController
    munir: MunirFpController
    proxy: ProxyAdapter
    hexitec: HexitecController
    readout: ReadoutProcessorController
    config: ConfigurationController

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

        self.config_mapping = mapping

    def initialize(self, adapters: Adapters):
        """Initialise the acquisition controller with information about adapters currently loaded
        into the running application.
        :param adapters: dictionary of adapter instances keyed by name
        """
        try:
            # Verify all required adapters are present
            required_adapters = ['histogram', 'liveview', 'munir', 'proxy', 'hexitec', 'readout', 'config']
            missing = [name for name in required_adapters if name not in adapters]
            if missing:
                missing = ", ".join(missing)
                raise AcquisitionError(f"Missing required adapters: {missing}")

            # Adapter controllers references
            self.histogrammer = adapters['histogram'].controller
            self.liveview = adapters['liveview'].controller
            self.munir = adapters['munir'].controller
            self.proxy = adapters['proxy']
            self.hexitec = adapters['hexitec'].controller
            self.readout = adapters['readout'].controller
            self.config = adapters['config'].controller

            # Verify munir subsystem exists
            if self.munir_subsystem not in self.munir.munir_managers:
                raise AcquisitionError(
                    f"Could not find munir subsystem '{self.munir_subsystem}' in available managers: "
                    f"{list(self.munir.munir_managers.keys())}"
                )
            
            if 'sequencer' in adapters:
                logging.debug("Acquisition controller registering contexts with sequencer")
                adapters['sequencer'].add_context('acquisition', self)
                adapters['sequencer'].add_context('monitor', self.hexitec)
                adapters['sequencer'].add_context('liveview', self.liveview)
                adapters['sequencer'].add_context('histogram', self.histogrammer)
                adapters['sequencer'].add_context('munir', self.munir)
                adapters['sequencer'].add_context('proxy', self.proxy)
                adapters['sequencer'].add_context('readout', self.readout)
                adapters['sequencer'].add_context('config', self.config)

            # Set a default file name and path
            default_filepath = self.options.get('default_filepath', '/tmp/')
            default_filename = self.options.get('default_filename', 'mhz_acquisition')
            icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_path", default_filepath)
            icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", default_filename)

            # Provide adapters to sub-processess
            self.configuration = Configuration(adapters, self.munir_subsystem, AcquisitionError)
            self.state = State(adapters, self.munir_subsystem, AcquisitionError, default_filepath, default_filename)

            self.state._register_configuration(configuration=self.configuration)
            self.configuration._register_state(state=self.state)

            # Configuration profiles
            self.config.set_mapping(self.config_mapping)

            # Connect histogrammer and setup UDP
            icc_set(self.histogrammer, "device/connect", True)
            # Currently histogrammer does not respect config, this will be fixed later
            icc_set(self.histogrammer, "udp/accelerator/rx_ip", self.options.get('accel_rx_ip', '10.0.100.8'))
            icc_set(self.histogrammer, "udp/accelerator/tx_ip", self.options.get('accel_tx_ip', '10.0.101.109'))
            icc_set(self.histogrammer, "udp/destination/ip", self.options.get('dest_ip', '10.0.101.8'))
            icc_set(self.histogrammer, "udp/source/ip", self.options.get('source_ip', '10.0.100.108'))
            icc_set(self.histogrammer, "udp/source/port", int(self.options.get('source_port', 61648)))
            icc_set(self.histogrammer, "udp/accelerator/port", int(self.options.get('accel_port', 61649)))

            icc_set(self.histogrammer, "udp/setup", True)

            # self._handle_default_settings()
            self._build_tree()
        except Exception as e:
            logging.error(f"Error initializing AcquisitionController: {e}")

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
