import logging
from hexitec.base.base_adapter import BaseAdapter
from odin.adapters.adapter import ApiAdapterResponse, wants_metadata
from hexitec.acquisition.controller import AcquisitionController

class AcquisitionError(Exception):
    """Custom exception class for acquisition-related errors."""
    pass

class AcquisitionAdapter(BaseAdapter):
    """Adapter for the acquisition process.
    This adapter interfaces between the other processes so as to orchestrate acquisitions.
    """
    controller_cls = AcquisitionController
    error_cls = AcquisitionError
