"""A class to manage the state of the acquisition process, such as previewing, acquisition, and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import iac_get, iac_set
import time
from datetime import datetime

from tornado.concurrent import run_on_executor
from concurrent import futures

class State():

    executor = futures.ThreadPoolExecutor(max_workers=1)

    def __init__(self, adapters, munir_subsystem, AcquisitionError):
        self.munir_subsystem = munir_subsystem

        self.munir = adapters["munir"]
        self.munir_odindata_controller = self.munir.controller.munir_managers[self.munir_subsystem].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"]
        self.readout = adapters["readout"]
        self.liveview = adapters["liveview"]

        self.AcquisitionError = AcquisitionError

        # Are we in 'preview' mode - i.e. liveview without data capture
        self.is_previewing = False
        self.was_previewing = False
        self.preview_frames_per_hist = 1000000
        self.is_acquiring = False

        self.acquisition_progress_task_enable = False
        self.acquisition_progress_task_interval = 0.5
        self.acquisition_progress = 0.0

        # File settings (as convenience functions for munir)
        self.file_name = "mhz_acquisition"
        self.file_path = "/tmp"
        self.file_timestamp = False

        self.tree = ParameterTree({
            'preview': {
                'toggle': (lambda: self.is_previewing, self.toggle_preview),
                'frames_per_hist': (lambda: self.preview_frames_per_hist, self.set_preview_frames_per_hist)
            },
            'acquisition': {
                'toggle': (lambda: self.is_acquiring, self.toggle_acquisition),
                "progress_task": {
                    "interval": (lambda: self.acquisition_progress_task_interval, self.set_progress_task_interval),
                    "progress": (lambda: self.acquisition_progress, None)
                },
                'file_name': (lambda: self.file_name, self.set_file_name),
                'file_path': (lambda: self.file_path, self.set_file_path),
                'add_timestamp': (lambda: self.file_timestamp, self.toggle_file_timestamp)
            }
        })

    def set_file_name(self, filename: str):
        """Set the name of the file to be saved through munir arguments.
        :param filename: string representing the name of the file
        """
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", filename)
        self.file_name = filename

    def set_file_path(self, filepath: str):
        """Set the path that the file is to be saved to through munir arguments.
        :param filepath: string representing the filepath
        """
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_path", filepath)
        self.file_path = filepath

    def toggle_file_timestamp(self, enable: bool):
        """Set the file timestamp toggle to True or False.
        This adds a timestamp to the name of the file at time of acquisition start.
        The format is: _YYYY-MM-DD_HH-MM-SS (ISO 8601)
        :param enable: boolean representing the state of the toggle
        """
        self.file_timestamp = bool(enable)

    def set_progress_task_interval(self, time: float):
        """Set the acquisition progress task update rate."""
        self.acquisition_progress_task_interval = time

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
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}", {"start_lv_frames": True})

        iac_set(self.histogrammer, "acquisition/mode", "count frames")
        iac_set(self.histogrammer, "acquisition/output_frames", 20_000_000)
        iac_set(self.histogrammer, "acquisition/input_frames", self.preview_frames_per_hist)
        iac_set(self.histogrammer, "acquisition/run", True)

    def _stop_preview(self):
        """Stops the preview mode, returning the system to an idle state."""
        iac_set(self.histogrammer, "acquisition/run", False)
        # Reset histogram settings
        iac_set(self.histogrammer, "acquisition/input_frames", self.configuration.frames_per_timeframe)
        iac_set(self.histogrammer, "acquisition/output_frames", self.configuration.number_of_timeframes)
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}", {"stop_execute": True})

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
        # First, check if acquisition can work with data rate
        data_rate = self.configuration.calculate_estimated_data_rate()
        if data_rate >= 12.5:
            raise self.AcquisitionError(
                f"Estimated data rate of {data_rate:.2f} GB/s exceeds 100 Gb/s Ethernet limit. Please increase frames per histogram or reduce number of bins."
                )
            return

        self.is_acquiring = True
        self.acquisition_progress = 0

        if self.is_previewing:
            self.toggle_preview(False)
            self.is_previewing = False
            self.was_previewing = True

        # Check modes are compatible
        try:
            num_bins = iac_get(self.histogrammer, "config/hist_format/num_bins")
            num_bins = "histogram_" + str(num_bins)
            munir_mode = iac_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status")
            munir_mode = str(munir_mode[0].get("HexitecMhz", {}).get("mode", ""))
            logging.warning(f"Checking modes before acquisition: histogrammer num_bins={num_bins}, munir mode={munir_mode}")
            # munir_mode = iac_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status/HexitecMhz/mode")
        except Exception as error:
            logging.error(f"Error checking modes before acquisition: {error}")
            raise self.AcquisitionError(f"Error checking modes before acquisition: {error}")
        if num_bins != munir_mode:
            logging.warning(f"Histogrammer num_bins {num_bins} does not match munir mode {munir_mode}. Changing bin modes to match histogrammer.")
            self.configuration.change_bin_mode(num_bins)
            while iac_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status/HexitecMhz/mode") != num_bins:
                logging.warning(f"Waiting for odin data to reconfigure to new bin mode...")
                time.sleep(0.5)

        # Timestamp
        if self.file_timestamp:
            filename = iac_get(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name")
            stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = filename + "_" + stamp
            # self.file_name = filename
            iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", filename)

        # Configure how data should be sent
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/num_frames", self.configuration.number_of_timeframes)

        # Start listening for data
        iac_set(self.munir, "execute", {self.munir_subsystem: True})
        iac_set(self.histogrammer, "acquisition/run", True)

        # This task runs in the thread execution pool
        self.acquisition_progress_task_enable = True
        self.acquisition_progress_task()

    def _stop_acquisition(self):
        self.acquisition_progress_task_enable = False  # Stopping manually also must stop background
        self.is_acquiring = False

        # Back to software for the purpose of previewing
        iac_set(self.readout, "trigger/enable", False)

        iac_set(self.histogrammer, "acquisition/run", False)
        iac_set(self.munir, f"subsystems/{self.munir_subsystem}/stop_execute", False)

        if self.was_previewing:
            self.toggle_preview(True)

    @run_on_executor
    def acquisition_progress_task(self):
        while self.acquisition_progress_task_enable:
            munir_status = iac_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status")
            frames_received = munir_status[0].get("hdf", {}).get("frames_written", 0)
            frames_received += 1  # n-1 bug in histogrammer

            self.acquisition_progress = round((frames_received / self.configuration.number_of_timeframes) * 100, 2)

            if self.acquisition_progress >= 100:
                # Force a wait of ~1 frame's worth of time to ensure synchronicity
                wait = self.configuration.frames_per_timeframe / 1_000_000
                wait = 5 if wait > 5 else wait  # Upper limit on the wait
                time.sleep(wait)
                # Acquisition complete, disable this task and stop the acquisition
                self.acquisition_progress_task_enable = False
                self._stop_acquisition()

            time.sleep(self.acquisition_progress_task_interval)
        
        logging.debug("Stopping acquisition progress background task.")