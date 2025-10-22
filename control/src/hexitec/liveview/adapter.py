import logging
from hexitec.base.base_adapter import BaseAdapter
from hexitec.liveview.controller import HistogramLiveViewController

class HistogramError(Exception):
    """Custom exception class for histogram-related errors."""
    pass

class HistogramLiveViewAdapter(BaseAdapter):
    """
    Adapter for the Histogram Live Data visualization system.

    This adapter interfaces between the HTTP API and the HistogramLiveDataController,
    handling histogram data streams and visualization parameters.
    """
    controller_cls = HistogramLiveViewController
    error_cls = HistogramError
