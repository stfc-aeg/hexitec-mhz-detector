"""A class to manage the configuration of the acquisition process, such as num_bins and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError
import logging
from hexitec.util.iac import iac_get, iac_set

class AcquisitionConfigurationError(Exception):
    """Custom exception for acquisition configuration errors."""
    pass

class Configuration():
    def __init__(self, adapters):
        self.bin_mode = "histogram_1024"
        self.munir = adapters["munir"]
        self.munir_odindata_controller = self.munir.controller.munir_managers['hexitec_mhz'].odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = adapters["histogram"]
        self.readout = adapters["readout"]
        self.liveview = adapters["liveview"]

        self.device = "software"
        self.trigger_mode = "burst"
        self.frames_per_timeframe = 1
        self.number_of_timeframes = 1

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
                           {'allowed_values': ["software", "hardware"]}),
                'trigger_mode': (lambda: self.trigger_mode, self.change_trigger_mode, 
                                 {'allowed_values': ["burst", "step_scan", "continuous"]}),
                'frames_per_timeframe': (lambda: self.frames_per_timeframe, self.set_frames_per_timeframe,
                                         {'min': 1}),
                'number_of_timeframes': (lambda: self.number_of_timeframes, self.set_number_of_timeframes,
                                         {'min': 1}),
                'toggle_acquisition_histogramming': (lambda: None, self.toggle_acquisition_histogramming)
            },
            'baseline': {
                'toggle': (lambda: self.baseline_settings['enabled'], self.toggle_baseline)
            }
        })

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
        if self.munir.execute_flags['hexitec_mhz']:
            was_executing = True
            iac_set(self.munir, 'execute/hexitec_mhz', False)

        # Disable histogrammer
        iac_set(self.histogrammer, "acquisition/run", False)

        # Change via histogrammer
        iac_set(self.histogrammer, "config/hist_format/num_bins", int(hist_value))

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
            iac_set(self.munir, 'execute/hexitec_mhz', True)

    def set_device(self, device: str):
        """Set the trigger device, which may be software or hardware
        :param device: string representing the trigger device, either 'software' or 'hardware'
        """
        self.device = device

    def change_trigger_mode(self, mode: str):
        """Set the trigger mode, used for hardware triggering.
        :param mode: string representing the trigger mode, either 'burst', 'step_scan', or 'continuous'
        """
        self.trigger_mode = mode

    def set_frames_per_timeframe(self, frames: int):
        """Set the number of frames per timeframe/histogram.
        This value is used in the same way no matter the mode, except in continuous mode where it is not used.
        :param frames: positive integer representing the number of frames per timeframe
        """
        if frames < 1:
            raise AcquisitionConfigurationError("Frames per timeframe must be a positive integer.")
        self.frames_per_timeframe = frames

    def set_number_of_timeframes(self, timeframes: int):
        """Set the number of timeframes to be acquired.
        How this is interpreted depends on the mode:
            - Software: number of timeframes before no new ones are sent out
            - Hardware/burst: number of timeframes to be captured per trigger
        This value is not used in continuous mode. In step scan mode it is 1 (value not changed).
        :param timeframes: positive integer representing the number of timeframes
        """
        if timeframes < 1:
            raise AcquisitionConfigurationError("Number of timeframes must be a positive integer.")
        self.number_of_timeframes = timeframes

    def toggle_acquisition_histogramming(self, value: bool):
        """Start or stop dataflow for an acquisition.
        :param value: boolean deciding whether to start (True) or stop (False) acquisition dataflow
        """
        if value:
            self.running_histogrammer = True
            self._start_histogramming()
        else:
            self.running_histogrammer = False
            self._stop_histogramming()

    def _start_histogramming(self):
        """Start and configure the histogrammer depending on the device and mode.
        With software triggering, the Alveo module is used with the given parameters.
        For hardware triggering, the interpretation of the values depends on the mode:
        Burst: # timeframes is timeframes per trigger, frames per timeframe is as expected
        Step_Scan: # timeframes is always one, frames per timeframe is as expected
        Continuous: # timeframes and frames per timeframe are unused, relies entirely on trigger
        """
        match (self.device, self.trigger_mode):
            case ("software", _):
                iac_set(self.histogrammer, "acquisition/input_frames", self.frames_per_timeframe)
                iac_set(self.histogrammer, "acquisition/output_frames", self.number_of_timeframes)
                iac_set(self.histogrammer, "acquisition/run", True)
            case ("hardware", "burst"):
                pass
            case ("hardware", "step_scan"):
                self.number_of_timeframes = 1
                pass
            case ("hardware", "continuous"):
                pass

    def _stop_histogramming(self):
        """Stop the histogrammer."""
        iac_set(self.histogrammer, "acquisition/run", False)

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

            iac_set(self.histogrammer, "config/baseline/mask", "FIXED")
            iac_set(self.histogrammer, "config/clustering/mode", "AUTO")
            iac_set(self.histogrammer, "config/clustering/auto_trig_mode", 'AUTOTRIG_1IN4')
        else:
            self.baseline_settings['enabled'] = False

            iac_set(self.histogrammer, "config/baseline/mask", self.baseline_settings['prev_mask'])
            iac_set(self.histogrammer, "config/clustering/mode", self.baseline_settings['prev_cluster_mode'])
            iac_set(self.histogrammer, "config/clustering/auto_trig_mode", self.baseline_settings['prev_auto_trig'])
