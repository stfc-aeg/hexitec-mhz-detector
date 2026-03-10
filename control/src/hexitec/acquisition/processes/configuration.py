"""A class to manage the configuration of the acquisition process, such as num_bins and similar functions."""
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

class AcquisitionConfigurationError(Exception):
    """Custom exception for acquisition configuration errors."""
    pass

class Configuration():
    def __init__(self, munir, histogrammer, readout):
        self.bin_mode = "histogram_1024"
        self.munir_hexitec = munir
        self.munir_odindata_controller = self.munir_hexitec.odin_data_instances[0]  # Only anticipate one odin data instance for now
        self.histogrammer = histogrammer
        self.readout = readout

        self.device = "software"
        self.trigger_mode = "burst"
        self.frames_per_timeframe = 1
        self.number_of_timeframes = 1


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
                                         {'min': 1})
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
            self.munir.set_execute('hexitec_mhz', False)

        # Disable histogrammer
        self.histogrammer.setRun(False)

        # Change via histogrammer
        self.histogrammer.setHistFormat(setting=hist_mode, value=hist_value)

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
        self.liveview.set_num_bins(depth, self.liveview.processors[0])  # Only anticipate one endpoint

        # Restart liveviewing
        self.histogrammer.setRun(True)

        if was_executing:
            self.munir.set_execute('hexitec_mhz', True)

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
    