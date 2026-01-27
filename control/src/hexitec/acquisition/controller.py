import logging
from hexitec.base.base_controller import BaseController, BaseError
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from typing import TypedDict, cast
from histogrammer.adapter import HistogramAdapter, HistogramController
from hexitec.liveview.adapter import HistogramLiveViewAdapter, HistogramLiveViewController
from munir.adapter import MunirAdapter, MunirFpController, MunirController
from odin.adapters.proxy import ProxyAdapter
from hexitec.adapter import HexitecAdapter, HexitecController

class Adapters(TypedDict):
    histogram: HistogramAdapter
    liveview: HistogramLiveViewAdapter
    munir: MunirAdapter
    proxy: ProxyAdapter
    hexitec: HexitecAdapter

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

        self.param_tree = ParameterTree({
            'bin_mode': (lambda: self.bin_mode, self.change_bin_mode, 
                         {'allowed_values':
                            ["histogram_1024","histogram_128","histogram_2048","histogram_256","histogram_4096","histogram_512"]
                        })
        })

    def initialize(self, adapters: Adapters):
        """Initialise the acquisition controller with information about adapters currently loaded
        into the running application.
        :param adapters: dictionary of adapter instances keyed by name
        """
        self.adapters = adapters
        
        # Verify all required adapters are present
        required_adapters = ['histogram', 'liveview', 'munir', 'proxy', 'hexitec']
        missing = [name for name in required_adapters if name not in adapters]
        if missing:
            raise AcquisitionError(f"Missing required adapters: {', '.join(missing)}")
        
        # Cast and store adapter controllers
        self.histogrammer = cast(HistogramController, adapters['histogram'].controller)
        self.liveview = cast(HistogramLiveViewController, adapters['liveview'].controller)
        self.munir = cast(MunirFpController, adapters['munir'].controller)
        self.proxy = cast(ProxyAdapter, adapters['proxy'])
        self.hexitec = cast(HexitecController, adapters['hexitec'].controller)
        
        # Verify munir subsystem exists
        if self.munir_subsystem not in self.munir.munir_managers:
            raise AcquisitionError(
                f"Could not find munir subsystem '{self.munir_subsystem}' in available managers: "
                f"{list(self.munir.munir_managers.keys())}"
            )
        self.munir_hexitec = self.munir.munir_managers[self.munir_subsystem]

        # Connect histogrammer and setup UDP
        self.histogrammer.setConnect(True)
        self.histogrammer.setupUDP()

    def _start_preview(self):
        pass

    def _stop_preview(self):
        pass

    def change_bin_mode(self, bin_mode: str):
        """Change the number of bins used by the sensor.
        This function stops data operation, configures parameters in the histogrammer, odin-data, and the liveview, and then restarts liveview.
        :param bin_mode: string representing the operating mode, typically a number of bins. See allowed values metadata
        """
        munir_odindata_controller = self.munir_hexitec.odin_data_instances[0]

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

        not_cfg={
            'HexitecMhz': {
                'mode': 'histogram_2048'
            }, 
            'hdf': {
                'dataset': {
                    'dummy': {
                            'datatype': 'uint32', 
                            'dims': [80, 80, 2048], 
                            'compression': 'none'
                        }
                    }, 
                'file': {
                    'path': '/tmp/'
                }
            }
        }

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
        response = munir_odindata_controller.set_config(cfg)
        logging.warning(f"Odin-data config response: {response}")

        # Change in liveview
        self.liveview.set_num_bins(depth, self.liveview.processors[0])  # Only anticipate one endpoint

        # Restart liveviewing
        self.histogrammer.setRun(True)

        if was_executing:
            self.munir.set_execute('hexitec_mhz', True)

    def _start_acquisition(self):
        # Check histogrammer details are sensible
        # Configure odin data with histogrammer details
        # Tell odin data to start acquisition
        # Start histogrammer to send data
        # Need some awaiting of acquisition end signal?
        pass

    def _stop_acquisition(self):
        # Tell histogrammer to stop
        # Tell odin data to stop
        # Restart preview? Perhaps should not turn on automatically, could be optional
        pass

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
