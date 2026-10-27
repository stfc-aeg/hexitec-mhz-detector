"""A class to manage the state of the acquisition process, such as previewing, acquisition, and similar functions."""
from odin_control.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import icc_get, icc_set
import time
from datetime import datetime

from tornado.concurrent import run_on_executor
from concurrent import futures

class State():

    executor = futures.ThreadPoolExecutor(max_workers=1)

    def __init__(self, adapters, munir_subsystem, AcquisitionError, default_filepath, default_filename):
        self.munir_subsystem = munir_subsystem

        self.munir = adapters["munir"].controller
        self.munir_odindata_controller = self.munir.munir_managers[self.munir_subsystem].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"].controller
        self.readout = adapters["readout"].controller
        self.liveview = adapters["liveview"].controller

        self.AcquisitionError = AcquisitionError

        # Are we in 'preview' mode - i.e. liveview without data capture
        self.is_previewing = False
        self.was_previewing = False
        self.preview_frames_per_hist = 1000000
        self.is_acquiring = False

        self.freerun = False

        self.acquisition_progress_task_enable = False
        self.acquisition_progress_task_interval = 0.5
        self.acquisition_progress = 0.0

        self.enable_single_frame_preview = False
        self.single_frame_preview_progress_enable = False
        self.single_frame_preview_frame_count = 0
        self.single_frame_preview_generation = 0

        # File settings (as convenience functions for munir)
        self.file_name = default_filename
        self.file_path = default_filepath
        self.file_timestamp = False

        self.tree = ParameterTree({
            'preview': {
                'toggle': (lambda: self.is_previewing, self.toggle_preview),
                'frames_per_hist': (lambda: self.preview_frames_per_hist, self.set_preview_frames_per_hist),
                'single_frame': (lambda: self.enable_single_frame_preview, self.toggle_single_frame_preview)
            },
            'acquisition': {
                'toggle': (lambda: self.is_acquiring, self.toggle_acquisition),
                'freerun': (lambda: self.freerun, self.toggle_freerun),
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
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", filename)
        self.file_name = filename

    def set_file_path(self, filepath: str):
        """Set the path that the file is to be saved to through munir arguments.
        :param filepath: string representing the filepath
        """
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_path", filepath)
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

    def toggle_freerun(self, toggle):
        """Enable or disable 'freerun' acquisition: acquisition runs until stopped manually."""
        self.freerun = bool(toggle)

    def toggle_preview(self, toggle):
        if self.is_acquiring and toggle:
            logging.warning("Cannot enable preview mode while acquiring. Please stop acquisition first.")
            return

        self.is_previewing = bool(toggle)
        if self.is_previewing:
            self._start_preview()
        else:
            self._stop_preview()

    def toggle_single_frame_preview(self, enable):
        """Enable or disable single-frame-preview mode. Disabled is normal start/stop preview mode.
        :param enable: boolean for enable (true) or disable (false).
        """
        self.enable_single_frame_preview = bool(enable)

    def _start_preview(self):
        """Starts 'preview mode', which runs the histogrammer through software and saves no data."""
        target = 1 if self.enable_single_frame_preview else 0
        # hist_target = 1 if self.enable_single_frame_preview else -1
        preview_generation = None

        if self.enable_single_frame_preview:
            self.single_frame_preview_generation += 1
            preview_generation = self.single_frame_preview_generation
            self.single_frame_preview_frame_count = icc_get(
                self.liveview, "histview/mhz/image/frame_count"
            )

        icc_set(self.munir, f'subsystems/{self.munir_subsystem}/args/num_frames', target)
        self.munir_odindata_controller.create_acquisition(self.file_name, self.file_path, target)
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}", {"start_lv_frames": True})

        icc_set(self.liveview, "histview/mhz/image/frames_per_histogram", self.preview_frames_per_hist)

        icc_set(self.histogrammer, "acquisition/mode", "software")
        icc_set(self.histogrammer, "acquisition/num_histograms", target)
        icc_set(self.histogrammer, "acquisition/frames_per_histogram", self.preview_frames_per_hist)
        icc_set(self.histogrammer, "acquisition/run", True)

        # Function to wait for the frame to be written, then stop the preview
        if self.enable_single_frame_preview:
            self.single_frame_preview_progress_enable = True
            self._stop_single_frame_preview(
                preview_generation, self.single_frame_preview_frame_count
            )

    def _stop_preview(self, expected_generation=None):
        """Stops the preview mode, returning the system to an idle state."""
        if expected_generation is not None and expected_generation != self.single_frame_preview_generation:
            return

        self.single_frame_preview_generation += 1
        self.is_previewing = False
        self.single_frame_preview_progress_enable = False
        icc_set(self.histogrammer, "acquisition/run", False)
        # Reset settings
        icc_set(self.liveview, "histview/mhz/image/frames_per_histogram", -1)
        icc_set(self.histogrammer, "acquisition/frames_per_histogram", self.configuration.frames_per_timeframe)
        icc_set(self.histogrammer, "acquisition/num_histograms", self.configuration.number_of_timeframes)
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}", {"stop_execute": True})

    def set_preview_frames_per_hist(self, frames):
        """Set the number of frames per histogram for preview mode.
        The setting is applied immediately only while previewing. When previewing starts this
        value is used."""
        self.preview_frames_per_hist = int(frames)
        if self.is_previewing:
            icc_set(self.histogrammer, "acquisition/frames_per_histogram", self.preview_frames_per_hist)

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

        if self.freerun:
            frame_target = -1
        else:
            frame_target = self.configuration.number_of_timeframes * self.configuration.number_of_files

        # If multiple files are enabled in configuration, this will be more than 1. Otherwise, 1.
        number_of_files = self.configuration.number_of_files

        self.is_acquiring = True
        self.acquisition_progress = 0

        if self.is_previewing:
            self.toggle_preview(False)
            self.is_previewing = False
            self.was_previewing = True

        # Check modes are compatible
        try:
            num_bins = icc_get(self.histogrammer, "config/hist_format/num_bins")
            num_bins = "histogram_" + str(num_bins)
            munir_mode = icc_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status")
            munir_mode = str(munir_mode[0].get("HexitecMhz", {}).get("mode", ""))
            logging.warning(f"Checking modes before acquisition: histogrammer num_bins={num_bins}, munir mode={munir_mode}")
            # munir_mode = icc_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status/HexitecMhz/mode")
        except Exception as error:
            logging.error(f"Error checking modes before acquisition: {error}")
            raise self.AcquisitionError(f"Error checking modes before acquisition: {error}")
        if num_bins != munir_mode:
            logging.warning(f"Histogrammer num_bins {num_bins} does not match munir mode {munir_mode}. Changing bin modes to match histogrammer.")
            self.configuration.change_bin_mode(num_bins)
            while icc_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status/HexitecMhz/mode") != num_bins:
                logging.warning(f"Waiting for odin data to reconfigure to new bin mode...")
                time.sleep(0.5)

        # Timestamp
        if self.file_timestamp:
            # Filename is set in munir in set_file_name but local ref is used here
            # Pulling name from munir can cause timestamp to be added multiple times if the
            # name is not changed between acquisitions.
            filename = self.file_name
            stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = filename + "_" + stamp
            # self.file_name = filename
            icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/file_name", filename)

        # For liveview occupancy
        icc_set(self.liveview, "histview/mhz/image/frames_per_histogram", self.configuration.frames_per_timeframe)

        # Multiple file acquisition logic goes here

        # Configure how data should be sent
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}/args/num_frames", frame_target)

        # Start listening for data
        icc_set(self.munir, "execute", {self.munir_subsystem: True})
        icc_set(self.histogrammer, "acquisition/run", True)

        # This task runs in the thread execution pool
        self.acquisition_progress_task_enable = True
        self.acquisition_progress_task()

    def _stop_acquisition(self):
        self.acquisition_progress_task_enable = False  # Stopping manually also must stop background
        self.is_acquiring = False

        # Back to software for the purpose of previewing
        icc_set(self.readout, "trigger/enable", False)

        icc_set(self.liveview, "histview/mhz/image/frames_per_histogram", -1)

        icc_set(self.histogrammer, "acquisition/run", False)
        icc_set(self.munir, f"subsystems/{self.munir_subsystem}/stop_execute", False)

        if self.was_previewing:
            self.toggle_preview(True)

    @run_on_executor
    def acquisition_progress_task(self):
        while self.acquisition_progress_task_enable:
            munir_status = icc_get(self.munir, f"subsystems/{self.munir_subsystem}/frame_procs/status")
            frames_received = munir_status[0].get("hdf", {}).get("frames_written", 0)

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

    @run_on_executor
    def _stop_single_frame_preview(self, preview_generation, starting_frame_count):
        """Wait for the histogrammer and liveview to process a single-frame preview."""
        while (
            self.is_previewing
            and self.single_frame_preview_progress_enable
            and preview_generation == self.single_frame_preview_generation
        ):
            histogrammer_running = icc_get(self.histogrammer, "acquisition/run")
            if not histogrammer_running:
                frame_count = icc_get(
                    self.liveview, "histview/mhz/image/frame_count"
                )
                if frame_count > starting_frame_count:
                    logging.debug("Liveview processed single-frame preview, stopping preview mode.")
                    self._stop_preview(expected_generation=preview_generation)
                    return

            time.sleep(self.acquisition_progress_task_interval)