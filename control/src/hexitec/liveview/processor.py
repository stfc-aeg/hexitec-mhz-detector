import numpy as np
import cv2
import blosc
import base64
import zmq
from multiprocessing import Process, Queue, Pipe
import logging
from tornado.escape import json_decode
from odin_data.control.ipc_channel import IpcChannel

class HistogramLiveViewProcessor:
    """Process 3D histogram data received over ZMQ and render 2D visualizations."""
    
    def __init__(self, endpoint, dimensions=(80, 80, 1024), size_x=640, size_y=640, colour='bone', energy_range=None):
        """Initialize the HistogramLiveDataProcessor.
        
        Args:
            endpoint: ZMQ endpoint string
            dimensions: Tuple of (width, height, energy_bins)
            size_x: Display width in pixels
            size_y: Display height in pixels 
            colour: OpenCV colormap name
            energy_range: Dict with 'min' and 'max' keys for energy bin range
        """
        self.endpoint = endpoint
        self.orig_dims = dimensions
        self.size_x = size_x
        self.size_y = size_y
        self.colour = colour
        self.last_valid_image = None
        self.regions = {}  # Dictionary to store multiple regions
        self.last_histograms = {}  # Store last valid histograms for each region
        self.scale_factor = 1.0  # Add this line
        
        # Energy bin selection range
        self.energy_range = energy_range or {
            'min': 0,
            'max': dimensions[2] - 1
        }
        
        # Value range for clipping and display
        self.value_range = {
            'min': 0,
            'max': 65535
        }

        # Log available colormaps
        available_colormaps = []
        for name in ['AUTUMN', 'BONE', 'JET', 'WINTER', 'RAINBOW', 'OCEAN', 'SUMMER', 
                    'SPRING', 'COOL', 'HSV', 'PINK', 'HOT', 'PARULA', 'MAGMA', 'INFERNO', 
                    'PLASMA', 'VIRIDIS', 'CIVIDIS', 'TWILIGHT', 'TWILIGHT_SHIFTED', 'TURBO']:
            if hasattr(cv2, f'COLORMAP_{name}'):
                available_colormaps.append(name.lower())
        
        logging.debug(f"Available OpenCV colormaps: {available_colormaps}")

        self.colormap_dict = {}
        for name in available_colormaps:
            self.colormap_dict[name] = getattr(cv2, f'COLORMAP_{name.upper()}')
        
        # Setup multiprocessing communication
        self.image_queue = Queue(maxsize=1)
        self.hist_queue = Queue(maxsize=1)
        self.pipe_parent, self.pipe_child = Pipe(duplex=True)
        
        # Start processing in background
        self.process = Process(target=self.process_data, args=(self,))
        self.process.start()
        
        logging.debug("Initialized HistogramLiveDataProcessor on %s", endpoint)


    @staticmethod
    def process_data(processor):
        """Background process for data handling."""
        # Setup ZMQ connection
        channel = IpcChannel(IpcChannel.CHANNEL_TYPE_SUB, processor.endpoint)
        channel.connect()
        channel.subscribe()
        
        while True:
            # Check for parameter updates
            if processor.pipe_child.poll():
                params = processor.pipe_child.recv()
                for param, value in params.items():
                    setattr(processor, param, value)
                    
            # Check for new data
            if channel.poll(10):
                try:
                    # Empty socket to get latest frame
                    while True:
                        try:
                            msg = channel.socket.recv_multipart(flags=zmq.NOBLOCK)
                        except zmq.Again:
                            break
                    # Process the last received frame
                    processor.process_frame(msg)
                except zmq.Again:
                    continue

    def set_region(self, region, region_id=None):
        """Set a region for histogram calculation."""
        if region_id is None:
            region_id = len(self.regions) + 1
        self.regions[region_id] = region
        self.update_params({"regions": self.regions})

    def remove_region(self, region_id):
        """Remove a region."""
        if region_id in self.regions:
            del self.regions[region_id]
            if region_id in self.last_histograms:
                del self.last_histograms[region_id]
            self.update_params({"regions": self.regions})

    def calculate_histogram(self, data_3d, region):
        """Calculate histogram from 3D data energy bins for selected region."""
        try:
            # Extract region coordinates
            [[x1, x2], [y1, y2]] = region
            x_min, x_max = int(x1), int(x2)
            y_min, y_max = int(y1), int(y2)
            
            # Validate coordinates
            if x_min >= x_max or y_min >= y_max:
                return None
                
            # Ensure coordinates are within bounds
            x_min = max(0, min(x_min, data_3d.shape[1]-1))
            x_max = max(0, min(x_max, data_3d.shape[1]-1))
            y_min = max(0, min(y_min, data_3d.shape[0]-1))
            y_max = max(0, min(y_max, data_3d.shape[0]-1))
            
            # Check if region has valid size
            if x_max <= x_min or y_max <= y_min:
                return None
                
            # Extract region data - keeping all energy bins
            region_data = data_3d[y_min:y_max+1, x_min:x_max+1, :]
            
            # Sum over spatial dimensions to get total spectrum
            spectrum = np.sum(region_data, axis=(0,1))
            
            # Create bin edges (0 to energy_bins)
            bin_edges = np.arange(data_3d.shape[2] + 1)
            
            return {
                'counts': spectrum.tolist(),
                'bins': bin_edges.tolist(),
                'mean': float(np.mean(spectrum)),
                'std': float(np.std(spectrum)) if spectrum.size > 1 else 0.0,
                'min': float(np.min(spectrum)),
                'max': float(np.max(spectrum)),
                'region': {
                    'x': [x_min, x_max],
                    'y': [y_min, y_max],
                    'width': x_max - x_min + 1,
                    'height': y_max - y_min + 1
                }
            }
        except Exception as e:
            logging.error(f"Error calculating histogram: {str(e)}")
            return None

    def process_frame(self, msg):
        """Process a single data frame."""
        try:
            header = json_decode(msg[0])
            dtype = header.get('dtype', 'uint32')
            
            # Decompress if needed
            if len(msg[1]) != 26214400:
                data = np.frombuffer(blosc.decompress(msg[1]), dtype=dtype)
            else:
                data = np.frombuffer(msg[1], dtype=dtype)
                
            # Reshape to 3D array
            data_3d = data.reshape(self.orig_dims)
            
                        # Sum selected energy bins
            summed_data = np.sum(data_3d[:, :, 
                                     self.energy_range['min']:self.energy_range['max'] + 1], 
                              axis=2)

            # Apply value range clipping
            clipped_data = np.clip(summed_data, 
                                self.value_range['min'], 
                                self.value_range['max'])
            
            # Calculate histograms if regions exist
            histograms = {}
            for region_id, region in self.regions.items():
                try:
                    hist_data = self.calculate_histogram(data_3d, region)
                    if hist_data is not None:
                        histograms[region_id] = hist_data
                        self.last_histograms[region_id] = hist_data
                    elif region_id in self.last_histograms:
                        histograms[region_id] = self.last_histograms[region_id]
                except Exception as e:
                    logging.error(f"Error calculating histogram for region {region_id}: {str(e)}")
                    if region_id in self.last_histograms:
                        histograms[region_id] = self.last_histograms[region_id]

            # Find data range if not set
            if self.value_range['min'] == self.value_range['max']:
                data_min = np.min(summed_data)
                data_max = np.max(summed_data)
                if data_min != data_max:
                    self.value_range['min'] = float(data_min)
                    self.value_range['max'] = float(data_max)
            
            # Normalize to 0-255 for display
            if self.value_range['max'] > self.value_range['min']:
                normalized_data = ((clipped_data - self.value_range['min']) / 
                                 (self.value_range['max'] - self.value_range['min']) * 255)
                normalized_data = np.clip(normalized_data, 0, 255).astype(np.uint8)
            else:
                normalized_data = np.zeros_like(clipped_data, dtype=np.uint8)

            # Apply colormap
            colour_data = cv2.applyColorMap(normalized_data, self.get_colour_map())

            # Encode for transmission
            flags = [
                cv2.IMWRITE_JPEG_QUALITY, 95,  # Maximum JPEG quality
                cv2.IMWRITE_JPEG_OPTIMIZE, 1,    # Enable JPEG optimization
                cv2.IMWRITE_JPEG_PROGRESSIVE, 1  # Enable progressive JPEG
            ]

            _, buffer = cv2.imencode('.jpg', colour_data, flags)
            encoded_data = base64.b64encode(buffer).decode('utf-8')
            
            # Update image queue
            while not self.image_queue.empty():
                self.image_queue.get()
            self.image_queue.put({
                'image': encoded_data,
                'histograms': histograms
            })
            
        except Exception as e:
            logging.error(f"Error processing frame: {str(e)}")

    def get_colour_map(self):
        """Get OpenCV colormap from string name."""
        colour_name = self.colour.lower()
        if colour_name in self.colormap_dict:
            return self.colormap_dict[colour_name]
        logging.warning(f"Colormap '{self.colour}' not found, falling back to bone")
        return cv2.COLORMAP_BONE

    def get_image(self):
        """Get latest processed image and histograms if available."""
        if not self.image_queue.empty():
            data = self.image_queue.get()
            self.last_valid_image = data
        return self.last_valid_image

    def set_value_range(self, min_val, max_val):
        """Set the value range for clipping and display."""
        self.value_range['min'] = float(min_val)
        self.value_range['max'] = float(max_val)

    def update_params(self, params):
        """Update processing parameters through pipe."""
        self.pipe_parent.send(params)