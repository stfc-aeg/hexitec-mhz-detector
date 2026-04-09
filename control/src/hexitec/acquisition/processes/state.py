"""A class to manage the state of the acquisition process, such as previewing, acquisition, and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import iac_get, iac_set

class AcquisitionStateError(Exception):
    """Custom exception for acquisition state errors."""
    pass

class State():
    def __init__(self, adapters):
        self.munir = adapters["munir"].controller
        self.munir_odindata_controller = self.munir.munir_managers['hexitec_mhz'].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"].controller
        self.readout = adapters["readout"].controller
        self.liveview = adapters["liveview"].controller

        # Are we in 'preview' mode - i.e. liveview without data capture
        self.is_previewing = False
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
        iac_set(self.munir_ad, "subsystems/hexitec_mhz", {"start_lv_frames": True})
        setattr(self.histogrammer.histogrammer.acqHandler, "outFrames", 20_000_000)
        # Set input frames based on tree variable
        self.histogrammer.setRun(True)

    def _stop_preview(self):
        """Stops the preview mode, returning the system to an idle state."""
        # Stop histogrammer
        self.histogrammer.setRun(False)
        iac_set(self.munir_ad, "subsystems/hexitec_mhz", {"stop_execute": True})

    def set_preview_frames_per_hist(self, frames):
        self.preview_frames_per_hist = int(frames)
        setattr(self.histogrammer.histogrammer.acqHandler, "impFrames", self.preview_frames_per_hist)
        # Other logic e.g. pass value to alveo
        pass

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
