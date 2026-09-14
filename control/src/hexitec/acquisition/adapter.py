import logging
from odin_control.adapters.adapter import ApiAdapter
from hexitec.acquisition.controller import AcquisitionController, AcquisitionError

class AcquisitionAdapter(ApiAdapter):
    """Adapter for the acquisition process.
    This adapter interfaces between the other processes so as to orchestrate acquisitions.
    """
    controller_cls = AcquisitionController
    error_cls = AcquisitionError
