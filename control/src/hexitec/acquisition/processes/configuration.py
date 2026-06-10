"""A class to manage the configuration of the acquisition process, such as num_bins and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import iac_get, iac_set
class Configuration():
    def __init__(self, adapters, munir_subsystem, AcquisitionError):
        self.munir_subsystem = munir_subsystem

        self.bin_mode = "histogram_1024"
        self.munir = adapters["munir"]
        self.munir_odindata_controller = self.munir.controller.munir_managers[self.munir_subsystem].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"]
        self.readout = adapters["readout"]
        self.liveview = adapters["liveview"]

        self.AcquisitionError = AcquisitionError

        self.device_options = ["software", "hardware"]

        # Get system to a known state on start
        # iac_get are safe here as this is part of acquisition adapter's initialize
        using_hardware = iac_get(self.readout, "trigger/enable")
        self.device = "hardware" if using_hardware else "software"

        self.trigger_mode = iac_get(self.readout, "trigger/mode")

        self.frames_per_timeframe = int(iac_get(self.histogrammer, "acquisition/input_frames"))
        self.number_of_timeframes = int(iac_get(self.histogrammer, "acquisition/output_frames"))
        self.timeframes_per_trigger = int(iac_get(self.readout, "trigger/frame_limits/hist_in_trigger"))

        self.data_rate = self.calculate_estimated_data_rate()

        # There is no true 'on/off' setting for this, but a set of commands that do about the same
        self.baseline_settings = {
            'enabled': False,
            'prev_mask': None,
            'prev_auto_trig': None,
            'prev_cluster_mode': None
        }

        self.running_histogrammer = False

        self.tree = ParameterTree({
            'bin_mode': (lambda: self.bin_mode, self.change_bin_mode, 
                         {'allowed_values':
                            ["histogram_1024","histogram_128","histogram_2048","histogram_256","histogram_4096","histogram_512"]
                        }),
            'trigger': {
                'device': (lambda: self.device, self.set_device,
                           {'allowed_values': self.device_options}),
                'trigger_mode': (lambda: self.trigger_mode, self.change_trigger_mode, 
                                 {'allowed_values': ["burst mode", "step scan", "continuous mode"]}),
                'frames_per_timeframe': (lambda: self.frames_per_timeframe, self.set_frames_per_timeframe,
                                         {'min': 1}),
                'number_of_timeframes': (lambda: self.number_of_timeframes, self.set_number_of_timeframes,
                                         {'min': 1}),
                'timeframes_per_trigger': (lambda: self.timeframes_per_trigger, self.set_timeframes_per_trigger,
                                           {'min': 1}),
                'configure_histogramming': (lambda: None, self._configure_histogramming)
            },
            'baseline': {
                'toggle': (lambda: self.baseline_settings['enabled'], self.toggle_baseline)
            },
            'estimated_data_rate': (lambda: self.data_rate, None)
        })

    def _register_state(self, state):
        """Get a reference to the state class."""
        self.state = state

    def change_bin_mode(self, bin_mode: str):
        """Change the number of bins used by the sensor.
        This function stops data operation, configures parameters in the histogrammer, odin-data, and the liveview, and then restarts liveview.
        :param bin_mode: string representing the operating mode, typically a number of bins. See allowed values metadata
        """
        was_executing = False

        # Done this way for futureproofing, e.g. mapped modes might be 'histogram_1024_map' and need different handling
        match bin_mode:
            case ('histogram_128' | 'histogram_256' | 'histogram_512' | 'histogram_1024' | 'histogram_2048' | 'histogram_4096'):
                self.bin_mode = bin_mode
                hist_value = bin_mode.split('_')[-1]
                depth = int(hist_value)
                hist_mode="numBins"
            case _:
                depth=1024
                hist_mode="numBins"
                hist_value='1024'

        # Stop odin-data
        if self.munir.controller.execute_flags[self.munir_subsystem]:
            was_executing = True
            iac_set(self.munir, f'execute/{self.munir_subsystem}', False)

        # Disable histogrammer
        iac_set(self.histogrammer, "acquisition/run", False)

        # Change via histogrammer
        iac_set(self.histogrammer, "config/hist_format/num_bins", hist_value)

        # Change in odin data
        cfg = {
            "HexitecMhz": {
                "mode": self.bin_mode
            },
            "hdf":{
                "dataset": {
                        "dummy": {
                            "datatype": "uint32",
                            "dims": [80, 80, depth],
                            "compression": "none"
                        }
                    },
                    "write": False,
                }
        }
        response = self.munir_odindata_controller.set_config(cfg)

        # Change in liveview
        iac_set(self.liveview, "histview/mhz/image/num_bins", depth)

        # Restart liveview if it was running
        if was_executing:
            iac_set(self.histogrammer, "acquisition/run", True)
            iac_set(self.munir, f'execute/{self.munir_subsystem}', True)

        self.calculate_estimated_data_rate()

    def set_device(self, device: str):
        """Set the trigger device, which may be software or hardware
        :param device: string representing the trigger device, either 'software' or 'hardware'
        """
        device = device.lower()
        if device in self.device_options:
            if device == "software":
                iac_set(self.readout, "trigger/enable", False)
                iac_set(self.histogrammer, "acquisition/mode", "count frames")
            elif device == "hardware":
               iac_set(self.readout, "trigger/enable", True)
               iac_set(self.histogrammer, "acquisition/mode", "continuous")

        self.device = device

    def change_trigger_mode(self, mode: str):
        """Set the trigger mode, used for hardware triggering.
        :param mode: string representing the trigger mode, either 'burst mode', 'step scan', or 'continuous mode'
        """
        self.trigger_mode = mode
        iac_set(self.readout, "trigger/mode", mode)

    def set_frames_per_timeframe(self, frames: int):
        """Set the number of frames per timeframe/histogram.
        This value is used in the same way no matter the mode, except in continuous mode where it is not used.
        :param frames: positive integer representing the number of frames per timeframe
        """
        if frames < 1:
            raise self.AcquisitionError("Frames per timeframe must be a positive integer.")

        # The min frames per timeframe is based on the bin mode, and at what point 
        # this is less efficient than raw data. This is roughly 350 at 128 bins, 700 at 256, etc.
        match self.bin_mode:
            case 'histogram_128':
                min_frames_per_timeframe = 350
            case 'histogram_256':
                min_frames_per_timeframe = 700
            case 'histogram_512':
                 min_frames_per_timeframe = 1400
            case 'histogram_1024':
                min_frames_per_timeframe = 2800
            case 'histogram_2048':
                min_frames_per_timeframe = 5600
            case 'histogram_4096':
                min_frames_per_timeframe = 11200
        if frames < min_frames_per_timeframe:
            raise self.AcquisitionError(f"Frames per timeframe must be at least {min_frames_per_timeframe}.")

        try:
            # Software, internal timeframe generator
            iac_set(self.histogrammer, "acquisition/input_frames", frames)
            # Hardware, on trigger received
            iac_set(self.readout, "trigger/frame_limits/frame_in_hist", frames)
            self.frames_per_timeframe = frames
        except Exception as err:
            logging.warning(f"Could not set frames per timeframe: {err}")

        self.calculate_estimated_data_rate()

        # Bin Mode	Histograms / sec	Min frames per TF
        # 128	        2930	            341
        # 256	        1465	            683
        # 512	        732	                1365
        # 1024	        366	                2731
        # 2048	        183	                5461
        # 4096	        92                  10923

    def set_number_of_timeframes(self, timeframes: int):
        """Set the number of timeframes to be acquired.
        Not all the values set will be used each time, depending on hardware/software mode.
        :param timeframes: integer representing timeframes to be captured duing acquisition
        """
        try:
            # Frame target for acquisition
            iac_set(self.munir, f"subsystems/{self.munir_subsystem}/args/num_frames", timeframes)
            # Software, internal timeframe generator. Not used in this way for 
            iac_set(self.histogrammer, "acquisition/output_frames", timeframes)
            self.number_of_timeframes = timeframes
        except Exception as err:
            logging.warning(f"Could not set number of timeframes: {err}")

    def set_timeframes_per_trigger(self, timeframes: int):
        """Set the number of timeframes per trigger.
        This is only used in burst mode with hardware capturing.
        :param timeframes: integer representing the number of timeframes per trigger
        """
        try:
            # Hardware
            iac_set(self.readout, "trigger/frame_limits/hist_in_trigger", timeframes)
            self.timeframes_per_trigger = timeframes
        except Exception as err:
            logging.warning(f"Could not set timeframes per trigger: {err}")

    def calculate_estimated_data_rate(self):
        """Calculate the estimated data rate based on the current configuration."""
        bin_mode = self.bin_mode
        num_bins = bin_mode.split('_')[-1]
        # Data rate is hists/second * size per hist / 1_000_000_000 for GB/s
        # hists_per_second is 1M (frames per second) divided by frames per hist
        hists_per_second = 1_000_000 // self.frames_per_timeframe
        data_rate = hists_per_second * (80*80*int(num_bins)*4) / 1_000_000_000
        self.data_rate = data_rate
        return self.data_rate

    def toggle_baseline(self, value: bool):
        """Toggle the baseline correction on or off through a set of commands for the same result.
        clustermode is set to auto, baseline mask is set to fixed, then auto trig mode set to 1 in 2/4
        The user should be warned that this may lead to frame dropping due to auto trig mode
        :param value: boolean deciding whether to enable (True) or disable (False) baseline correction
        """
        if value:
            self.baseline_settings['enabled'] = True
            self.baseline_settings['prev_mask'] = iac_get(self.histogrammer, "config/baseline/mask")
            self.baseline_settings['prev_auto_trig'] = iac_get(self.histogrammer, "config/clustering/auto_trig_mode")
            self.baseline_settings['prev_cluster_mode'] = iac_get(self.histogrammer, "config/clustering/mode")

            iac_set(self.histogrammer, "config/baseline/mask", "fixed")
            iac_set(self.histogrammer, "config/clustering/mode", "auto")
            iac_set(self.histogrammer, "config/clustering/auto_trig_mode", 'autotrig 1in2')
        else:
            self.baseline_settings['enabled'] = False

            iac_set(self.histogrammer, "config/baseline/mask", self.baseline_settings['prev_mask'])
            iac_set(self.histogrammer, "config/clustering/mode", self.baseline_settings['prev_cluster_mode'])
            iac_set(self.histogrammer, "config/clustering/auto_trig_mode", self.baseline_settings['prev_auto_trig'])
