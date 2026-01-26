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

        # hexitec, proxy, registerAccessor, munir, liveview, histogram
        # cast these in typing to force typing to accept the narrow XYController vs BaseController
        if 'histogram' in self.adapters:
            self.histogrammer = cast(HistogramController, self.adapters['histogram'].controller)
        else:
            raise AcquisitionError("Histogrammer adapter not found during AcquisitionController initialisation.")
        
        if 'liveview' in self.adapters:
            self.liveview = cast(HistogramLiveViewController, self.adapters['liveview'].controller)
        else:
            raise AcquisitionError("Liveview adapter not found during AcquisitionController initialisation.")

        if 'munir' in self.adapters:
            self.munir = cast(MunirFpController, self.adapters['munir'].controller)
            if self.munir_subsystem in self.munir.munir_managers.keys():
                self.munir_hexitec = self.munir.munir_managers[self.munir_subsystem]  # This subsystem name is known and has 1 endpoint
            else:
                raise AcquisitionError(f"Could not find munir subsystem {self.munir_subsystem} as expected. Please check configuration.")
        else:
            raise AcquisitionError("Munir adapter not found during AcquisitionController initialisation.")

        if 'proxy' in self.adapters:
            self.proxy: ProxyAdapter = self.adapters['proxy']
        else:
            raise AcquisitionError("Proxy adapter not found during AcquisitionController initialisation.")
        
        if 'hexitec' in self.adapters:
            self.hexitec = cast(HexitecController, self.adapters['hexitec'].controller)
        else:
            raise AcquisitionError("Hexitec adapter not found during AcquisitionController initialisation.")

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
        was_executing = False

        # Done this way for futureproofing, e.g. mapped modes might be 'histogram_1024_map' and need different handling
        match bin_mode:
            case 'histogram_128', 'histogram_256', 'histogram_512', 'histogram_1024', 'histogram_2048', 'histogram_4096':
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
        self.histogrammer.setHistFormat(hist_mode, hist_value)

        # Change in odin data
        cfg = {
        "params": {
            "HexitecMhz": {
                "mode": bin_mode
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
        }}
        munir_odindata_controller._send_receive('cmd', 'config', params=cfg)

        # Change in liveview
        self.liveview.set_num_bins(depth, self.liveview.processors[0])  # Only anticipate one endpoint
        self.liveview.processors[0]

        # Restart liveviewing
        self.histogrammer.setRun(True)

        if was_executing:
            self.munir.set_execute('hexitec_mhz', True)

        # Stop odin-data
        # Stop liveview via histogrammer
        # Change via histogrammer
        # Change in odin-data (filewriter and mhz plugins)
        # Change in liveview (and make sure that changes dimensions/energy_range)
        # Restart liveview and then odin-data

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

    def cleanup(self):
        """Clean up controller resources."""
        logging.debug("Cleaning up AcquisitionController")


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