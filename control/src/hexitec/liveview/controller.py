import logging
from functools import partial
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from hexitec.base.base_controller import BaseController
from .processor import HistogramLiveViewProcessor

class HistogramLiveViewError(Exception):
    """Simple exception class for HistogramLiveView errors."""
    pass

class HistogramLiveViewController(BaseController):
    """Controller for 3D histogram live data visualization."""
    
    def __init__(self, options):
        """Initialize the controller.
        
        Args:
            options: Dictionary of configuration options
        """       
        logging.debug("Initializing HistogramLiveViewController")

        # Get endpoints from config
        # Theoretically can have multiple endpoints but they will have same dimensions/bins
        # No use case for multiple endpoints currently so this can be revisited
        endpoints = [
            item.strip() for item in options.get('histogram_endpoint', '').split(",")
        ]
        self.names = [
            item.strip() for item in options.get('endpoint_name', '').split(",")
        ]

        # Parse dimensions
        dimensions = list(map(int, options.get('data_dimensions', '80x80x1024').split('x')))

        # Last part of dimensions is energy_bins
        num_bins = dimensions[2]

        # Default energy bin range is full range
        energy_range = {
            'min': 0,
            'max': num_bins - 1
        }
        
        self.tree = {
            '_image': {},
            "histview": {}
        }
        self.processors = []

        # Create processor for each endpoint
        for i, endpoint in enumerate(endpoints):
            processor = HistogramLiveViewProcessor(
                endpoint,
                dimensions=dimensions,
                energy_range=energy_range
            )
            self.processors.append(processor)

            # Build parameter tree branch
            name = self.names[i]
            self.tree['histview'][name] = {
                "name": (lambda: name, None),
                "endpoint": (lambda p=processor: p.endpoint, None),
                "image": {
                    # "data": (lambda p=processor: p.get_image()['image'] if p.get_image() else None, None),
                    # "histograms": (lambda p=processor: p.get_image()['histograms'] if p.get_image() else None, None),
                    "regions": (
                        lambda p=processor: p.regions,
                        partial(self.set_regions, processor=processor)
                    ),
                    "value_range": (
                        lambda p=processor: [p.value_range['min'], p.value_range['max']],
                        partial(self.set_value_range, processor=processor)
                    ),
                    "size_x": (lambda p=processor: p.size_x,
                             partial(self.set_size_x, processor=processor)),
                    "size_y": (lambda p=processor: p.size_y,
                             partial(self.set_size_y, processor=processor)),
                    "colour": (lambda p=processor: p.colour,
                             partial(self.set_colour, processor=processor),
                             {'allowed_values': [colour for colour in processor.colormap_dict.keys()]}),
                    "scale": (lambda p=processor: p.scale_factor,
                            partial(self.set_scale, processor=processor)),
                    "energy_range": (
                        lambda p=processor: [p.energy_range['min'], p.energy_range['max']],
                        partial(self.set_energy_range, processor=processor)
                    ),
                    "num_bins": (lambda p=processor: p.num_bins,
                                 partial(self.set_num_bins, processor=processor))
                }
            }
            self.tree['_image'].update({
                name: {
                    'image': (lambda: None, None),
                    'histograms': (lambda: None, None)
                }
            })

        self.param_tree = ParameterTree(self.tree)

    def initialize(self, adapters):
        """Initialize the controller with adapters."""
        self.adapters = adapters
        logging.debug("Initialized HistogramLiveViewController with %d adapters", len(adapters))

    def get_image_from_processor_name(self, name):
        """Return the image (data/histograms) object from the named processor."""
        if name in self.names:
            index = self.names.index(name)
            processor = self.processors[index]
            return processor.get_image()

    def cleanup(self):
        """Clean up controller resources."""
        logging.debug("Cleaning up HistogramLiveViewController")
        for processor in self.processors:
            if processor.process.is_alive():
                processor.process.terminate()
                processor.process.join()

    def get(self, path, with_metadata=False):
        """Get parameter data from controller."""
        try:
            return self.param_tree.get(path, with_metadata)
        except ParameterTreeError as error:
            logging.error("Error getting parameter: %s", error)
            raise HistogramLiveViewError(str(error))

    def set(self, path, data):
        """Set parameter data in controller."""
        try:
            self.param_tree.set(path, data)
        except ParameterTreeError as error:
            logging.error("Error setting parameter: %s", error)
            raise HistogramLiveViewError(str(error))

    def update_processor(self, processor, params):
        """Send parameter updates to processor."""
        processor.update_params(params)

    def set_regions(self, value, processor):
        """Set regions for histograms."""
        if isinstance(value, dict):
            processor.regions = value
            self.update_processor(processor, {"regions": value})
        else:
            # Handle single region addition
            region_id = len(processor.regions) + 1
            processor.set_region(value, region_id)

    def set_value_range(self, value, processor):
        """Set value range for clipping and display."""
        if isinstance(value, list) and len(value) == 2:
            processor.set_value_range(value[0], value[1])
            self.update_processor(processor, {"value_range": processor.value_range})

    def set_size_x(self, value, processor):
        """Set display width."""
        processor.size_x = int(value)
        self.update_processor(processor, {"size_x": processor.size_x})

    def set_size_y(self, value, processor):
        """Set display height."""
        processor.size_y = int(value)
        self.update_processor(processor, {"size_y": processor.size_y})

    def set_colour(self, value, processor):
        """Set colormap."""
        processor.colour = str(value)
        self.update_processor(processor, {"colour": processor.colour})

    def set_scale(self, value, processor):
        """Set scale factor."""
        processor.scale_factor = float(value)
        self.update_processor(processor, {"scale_factor": processor.scale_factor})

    def set_energy_range(self, value, processor):
        """Set energy bin range."""
        processor.energy_range['min'] = int(value[0])
        processor.energy_range['max'] = int(value[1])
        self.update_processor(processor, {"energy_range": processor.energy_range})

    def set_num_bins(self, value, processor):
        """Set number of energy bins."""
        value = int(value)
        update = {}
        processor.num_bins = value

        # Also update the dataset dimensions
        processor.orig_dims = (80,80,value)
        update = {
            'num_bins': processor.num_bins,
            'orig_dims': processor.orig_dims
        }        

        # Check this hasn't invalidated the energy range
        if processor.num_bins <= processor.energy_range['max']:
            processor.energy_range['max'] = processor.num_bins - 1
            update["energy_range"] = processor.energy_range  # Update whole thing just in case

        self.update_processor(processor, update)