import logging
from hexitec.base.base_adapter import BaseAdapter
from odin.adapters.adapter import ApiAdapterResponse, wants_metadata
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

    def get(self, path, request):
        """BaseAdapter get override to handle image processing."""
        try:
            levels = path.split('/')
            img_bytes = None
            # intercept structure: _image/<name>/<image/histograms>
            if levels[0] == '_image':
                bytes = self.controller.get_image_from_processor_name(levels[1])

                # logging.warning(f"bytes: {bytes}")

                if not bytes or not isinstance(bytes, dict):
                    return ApiAdapterResponse(b"", content_type="text/plain", status_code=200)

                if levels[-1] == 'image':
                    img_bytes = bytes['counts']
                elif levels[-1] == 'histogram':
                    logging.warning(img_bytes)
                    img_bytes = bytes['histogram']

                response=img_bytes
                content_type="image/jpg"
            
            else:
                response = self.controller.get(path, wants_metadata(request))
                content_type = "application/json"
            status_code = 200
        except self.error_cls as error:
            response = {"error":str(error)}
            content_type="application/json"
            status_code = 400
        
        return ApiAdapterResponse(response, content_type=content_type, status_code=status_code)

