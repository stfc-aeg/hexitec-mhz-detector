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

        # Are we in 'preview' mode - i.e. liveview without data capture
        self.is_previewing = False
        self.preview_frames_per_hist = 1000000
        self.is_acquiring = False

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

        # Set a default file name and path
        setattr(self.munir_hexitec, 'file_path', self.options.get('default_filepath', '/tmp/'))
        setattr(self.munir_hexitec, 'file_name', self.options.get('default_filename', 'mhz_acquisition'))

        # Provide adapters to sub-processess
        self.configuration = Configuration(self.munir_hexitec, self.histogrammer, self.readout)

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
        self.param_tree = ParameterTree({
            'acquisition': {
                'run': (lambda: self.is_acquiring, self.run_acquisition),
                'preview': {
                    'toggle': (lambda: self.is_previewing, self.toggle_preview),
                    'frames_per_hist': (lambda: self.preview_frames_per_hist, self.set_preview_frames_per_hist)
                }
            },
            'config': config_tree,
        })

    def toggle_preview(self, toggle):
        if self.is_acquiring and toggle:
            logging.warning("Cannot enable preview mode while acquiring. Please stop acquisition first.")
            return

        self.is_previewing = bool(toggle)
        if self.is_previewing:
            self._start_preview()
        else:
            self._stop_preview()

    def _start_preview(self):
        """Starts 'preview mode', which runs the histogrammer through software and saves no data."""
        # TODO: Set up odin data to receive but not write/save data
        setattr(self.histogrammer.histogrammer.acqHandler, "outFrames", 20_000_000)
        self.histogrammer.setRun(True)

    def _stop_preview(self):
        """Stops the preview mode, returning the system to an idle state."""
        # Stop histogrammer
        self.histogrammer.setRun(False)
        # TODO: Stop odin data preview

    def set_preview_frames_per_hist(self, frames):
        self.preview_frames_per_hist = int(frames)
        setattr(self.histogrammer.histogrammer.acqHandler, "impFrames", self.preview_frames_per_hist)
        # Other logic e.g. pass value to alveo
        pass

    def run_acquisition(self, value):
        """Start or stop an acquisition.
        :param value: boolean: if True, start. If False, stop
        """
        if self.is_previewing:
            logging.warning("Disabling preview mode to start acquisition.")
            self.toggle_preview(False)

        if value:
            self._start_acquisition()
        else:
            self._stop_acquisition()

    def _start_acquisition(self):
        self.is_acquiring = True
        # Check histogrammer details are sensible
        # Configure odin data with histogrammer details
        # Tell odin data to start acquisition
            # odin-data needs to be armed before capturing - for that it needs the name and path
                    # have a local set_filename/path that handles acq_id stuff and arms it as soon as both are truthy
            # mode -> change it if wrong
            # filepath, filename (see odin_data_config, acquisition_id? where is UI pointing), # frames (if hardware/unknown, set it to 0)
        # Start histogrammer to send data
        # Need some awaiting of acquisition end signal?
        # check acquisition progress: written frames vs target.
            # if unknown frame target, have to stop acquiring manually

    def _stop_acquisition(self):
        self.is_acquiring = False
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
