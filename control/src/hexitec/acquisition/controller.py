import logging
from hexitec.base.base_controller import BaseController, BaseError

class AcquisitionError(BaseError):
    """Exception raised for errors in the AcquisitionController."""
    pass

class AcquisitionController(BaseController):
    """Controller for 3D histogram live data visualization."""

    def __init__(self, options):
        """Initialise the AcquisitionController object."""

        self.options = options

    def initialize(self, adapters):
        """Initialise the acquisition controller with information about adapters currently loaded
        into the running application.
        :param adapters: dictionary of adapter instances keyed by name
        """
        self.adapters = adapters

        # hexitec, proxy, registerAccessor, munir, liveview, histogram
        if 'histogram' in self.adapters:
            self.histogrammer = self.adapters['histogram']
        else:
            raise AcquisitionError("Histogrammer adapter not found during AcquisitionController initialisation.")

        if 'munir' in self.adapters:
            self.munir = self.adapters['munir']
        else:
            raise AcquisitionError("Munir adapter not found during AcquisitionController initialisation.")

        if 'proxy' in self.adapters:
            self.proxy = self.adapters['proxy']
        else:
            raise AcquisitionError("Proxy adapter not found during AcquisitionController initialisation.")
        
        if 'hexitec' in self.adapters:
            self.hexitec = self.adapters['hexitec']
        else:
            raise AcquisitionError("Hexitec adapter not found during AcquisitionController initialisation.")

    def _start_preview(self):
        pass

    def _stop_preview(self):
        pass

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