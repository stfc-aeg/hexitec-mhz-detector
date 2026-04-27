"""A class to manage the state of the acquisition process, such as previewing, acquisition, and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import iac_get, iac_set
import time

class State():
    def __init__(self, adapters, AcquisitionError):
        self.munir = adapters["munir"]
        self.munir_odindata_controller = self.munir.controller.munir_managers['hexitec_mhz'].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"]
        self.readout = adapters["readout"]
        self.liveview = adapters["liveview"]

        self.AcquisitionError = AcquisitionError

        # Are we in 'preview' mode - i.e. liveview without data capture
        self.is_previewing = False
        self.was_previewing = False
        self.preview_frames_per_hist = 1000000
        self.is_acquiring = False

        self.tree = ParameterTree({
            'preview': {
                'toggle': (lambda: self.is_previewing, self.toggle_preview),
                'frames_per_hist': (lambda: self.preview_frames_per_hist, self.set_preview_frames_per_hist)
            },
            'acquisition': {
                'toggle': (lambda: self.is_acquiring, self.toggle_acquisition)
            }
        })

    def _register_configuration(self, configuration):
        """Get a reference to the configuration class."""
        self.configuration = configuration

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
        iac_set(self.munir, "subsystems/hexitec_mhz", {"start_lv_frames": True})

        iac_set(self.histogrammer, "acquisition/output_frames", 20_000_000)
        iac_set(self.histogrammer, "acquisition/input_frames", self.preview_frames_per_hist)
        iac_set(self.histogrammer, "acquisition/run", True)

    def _stop_preview(self):
        """Stops the preview mode, returning the system to an idle state."""
        # Stop histogrammer
        iac_set(self.histogrammer, "acquisition/run", False)
        iac_set(self.munir, "subsystems/hexitec_mhz", {"stop_execute": True})

    def set_preview_frames_per_hist(self, frames):
        """Set the number of frames per histogram for preview mode.
        The setting is applied immediately only while previewing. When previewing starts this
        value is used."""
        self.preview_frames_per_hist = int(frames)
        if self.is_previewing:
            iac_set(self.histogrammer, "acquisition/input_frames", self.preview_frames_per_hist)

    def toggle_acquisition(self, value):
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

        if self.is_previewing:
            self.toggle_preview(False)
            self.is_previewing = False
            self.was_previewing = True

        # Check modes are compatible
        try:
            num_bins = iac_get(self.histogrammer, "config/hist_format/num_bins")
            num_bins = "histogram_" + str(num_bins)
            munir_mode = iac_get(self.munir, "subsystems/hexitec_mhz/frame_procs/status")
            munir_mode = munir_mode[0].get("HexitecMhz", {}).get("mode", "")
            # munir_mode = iac_get(self.munir, "subsystems/hexitec_mhz/frame_procs/status/HexitecMhz/mode")
        except Exception as error:
            logging.error(f"Error checking modes before acquisition: {error}")
            raise self.AcquisitionError(f"Error checking modes before acquisition: {error}")
        if num_bins != munir_mode:
            logging.warning(f"Histogrammer num_bins {num_bins} does not match munir mode {munir_mode}. Changing bin modes to match histogrammer.")
            self.configuration.change_bin_mode(num_bins)
            while iac_get(self.munir, "subsystems/hexitec_mhz/frame_procs/status/HexitecMhz/mode") != num_bins:
                logging.warning(f"Waiting for odin data to reconfigure to new bin mode...")
                time.sleep(0.5)

        # TODO: Check min and max input frames vs bin mode

        # TODO: Consider filename overwriting?
        
        # No. frames handle in configuration.start_histogramming
        self.configuration._configure_histogramming()

        # Start sending data
        iac_set(self.munir, "execute", {'hexitec_mhz': True})
        iac_set(self.histogrammer, "acquisition/run", True)
        
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

        iac_set(self.histogrammer, "acquisition/run", False)
        iac_set(self.munir, "subsystems/hexitec_mhz/stop_execute", False)

        if self.was_previewing:
            self.toggle_preview(True)