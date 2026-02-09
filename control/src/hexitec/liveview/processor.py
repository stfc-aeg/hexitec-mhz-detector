import numpy as np
import cv2
import blosc
import base64
import zmq
from multiprocessing import Process, Queue, Pipe
import logging
from tornado.escape import json_decode
from odin_data.control.ipc_channel import IpcChannel
import matplotlib.pyplot as plt

class HistogramLiveViewProcessor:
    """Process 3D histogram data received over ZMQ and render 2D visualizations."""
    
    def __init__(self, endpoint, occupancy_threshold, dimensions=(80, 80, 1024), colour='bone', energy_range=None):
        """Initialize the HistogramLiveDataProcessor.
        
        Args:
            endpoint: ZMQ endpoint string
            dimensions: Tuple of (width, height, energy_bins)
            colour: OpenCV colormap name
            energy_range: Dict with 'min' and 'max' keys for energy bin range
        """
        self.endpoint = endpoint
        self.orig_dims = dimensions
        self.colour = colour
        self.last_valid_image = {}
        self.region = None  # Array of region corners normalised to 0-1
        self.occupancy = -1
        self.occupancy_threshold = occupancy_threshold

        self.num_bins = dimensions[2]

        self.max_pix_val = 2**32 * self.num_bins

        # Energy bin selection range
        self.energy_range = energy_range or {
            'min': 0,
            'max': self.num_bins - 1
        }
        
        # Value range for clipping and display
        self.value_range = {
            'min': 0.0,
            'max': self.max_pix_val
        }

        # Log available colormaps
        available_colormaps = []
        for name in ['AUTUMN', 'BONE', 'JET', 'WINTER', 'RAINBOW', 'OCEAN', 'SUMMER', 
                    'SPRING', 'COOL', 'HSV', 'PINK', 'HOT', 'PARULA', 'MAGMA', 'INFERNO', 
                    'PLASMA', 'VIRIDIS', 'CIVIDIS', 'TWILIGHT', 'TWILIGHT_SHIFTED', 'TURBO']:
            if hasattr(cv2, f'COLORMAP_{name}'):
                available_colormaps.append(name.lower())
        
        logging.debug(f"Available OpenCV colormaps: {available_colormaps}")

        logging.getLogger('matplotlib.font_manager').disabled = True
        logging.getLogger('PIL.PngImagePlugin').disabled=True

        self.colormap_dict = {}
        for name in available_colormaps:
            self.colormap_dict[name] = getattr(cv2, f'COLORMAP_{name.upper()}')
        
        # Setup multiprocessing communication
        self.image_queue = Queue(maxsize=1)
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

    def process_frame(self, msg):
        """Process a single data frame."""
        try:
            header = json_decode(msg[0])
            dtype = header.get('dtype', 'uint32')
            
            # Decompress if needed
            if len(msg[1]) != 80*80*self.orig_dims[-1]*4:
                data = np.frombuffer(msg[1], dtype=dtype)
            else:
                data = np.frombuffer(msg[1], dtype=dtype)
                
            # Reshape to 3D array
            data_3d = data.reshape(self.orig_dims)
            
            # Sum selected energy bins for 2D display
            summed_data = np.sum(data_3d[:, :, 
                                    self.energy_range['min']:self.energy_range['max'] + 1], 
                            axis=2)
            
            # Clipping and rescaling
            low = self.value_range['min']
            high = self.value_range['max']

            if high > low:
                # Clip to range and scale back over full range of vals
                clipped = np.clip(summed_data, low, high)
                scaled = (clipped - low) / (high - low) * 65535.0
                # 8-bit for display
                normalised_data = (scaled / 65535.0 * 255.0).astype(np.uint8)
            else:
                normalised_data = np.zeros_like(summed_data, dtype=np.uint8)

            # Apply colormap to 2D image
            colour_data = cv2.applyColorMap(normalised_data, self.get_colour_map())

            # Encode 2D image
            flags = [cv2.IMWRITE_JPEG_QUALITY, 85]  # Faster JPEG encoding
            _, buffer_2d = cv2.imencode('.jpg', colour_data, flags)

            # Get region/full image if no region
            region_data = self.extract_region(data_3d)
            # Histogram also respects energy range
            spectrum = np.sum(
                region_data[:, :, self.energy_range['min']:self.energy_range['max'] + 1],
                axis=(0, 1)
            )
            
            # Create histogram image
            min_e = self.energy_range['min']
            max_e = self.energy_range['max']
            energy_axis = np.arange(min_e, max_e + 1)

            fig, ax = plt.subplots(figsize=(8, 3), dpi=100)
            ax.plot(energy_axis, spectrum, color='blue', linewidth=1)

            ax.set_xlim(min_e, max_e)
            ax.set_yscale('log')
            ax.yaxis.set_visible(False)
            ax.tick_params(axis='x', labelsize=12)

            for spine in ['top', 'left', 'right']:
                ax.spines[spine].set_visible(False)

            fig.subplots_adjust(left=0.02, right=0.98, top=0.95, bottom=0.3)
            
            # Render to image
            fig.canvas.draw()
            histData = np.frombuffer(fig.canvas.renderer.buffer_rgba(), dtype=np.uint8)
            width, height = fig.canvas.get_width_height()
            histData = histData.reshape((height, width, 4))
            histData = cv2.cvtColor(histData, cv2.COLOR_RGBA2BGR)
            plt.close(fig)
            
            # Encode histogram image
            _, buffer_hist = cv2.imencode('.jpg', histData, flags)
            
            # Queue both images
            while not self.image_queue.empty():
                self.image_queue.get()
            self.image_queue.put({
                'counts': np.array(buffer_2d).tobytes(),
                'histogram': np.array(buffer_hist).tobytes()
            })

            # Calculate occupancy
            if self.occupancy_threshold is not None:
                total_pixels = summed_data.size
                above = np.count_nonzero(summed_data > self.occupancy_threshold)
                percent = (above/total_pixels) * 100.0
                self.occupancy = percent

                # Send occupancy back
                try:
                    self.pipe_child.send({"occupancy": self.occupancy})
                except:
                    logging.warning(f"Could not sent occupancy through pipe child")
            
        except Exception as e:
            logging.error(f"Error processing frame: {str(e)}")

    def get_colour_map(self):
        """Get OpenCV colormap from string name."""
        colour_name = self.colour.lower()
        if colour_name in self.colormap_dict:
            return self.colormap_dict[colour_name]
        logging.warning(f"Colormap '{self.colour}' not found, falling back to bone")
        return cv2.COLORMAP_BONE
    
    def extract_region(self, data_3d):
        """Return a spatial ROI of the 3d dataset based on the given region.
        :return data: shape is (roi_x, roi_y, energy_bins)
        """
        # Default to full image
        if self.region is None:
            return data_3d
        
        x_norm, y_norm = self.region
        x_min_n, x_max_n = x_norm
        y_min_n, y_max_n = y_norm
        x_size, y_size, _ = data_3d.shape  # e.g. 80x80x1024

        x_min = int(np.floor(x_min_n * x_size))
        x_max = int(np.ceil(x_max_n * x_size))
        y_min = int(np.floor(y_min_n * y_size))
        y_max = int(np.ceil(y_max_n * y_size))

        # Ensure it's within array bounds
        x_min = max(0, min(x_min, x_size - 1))
        x_max = max(1, min(x_max, x_size))
        y_min = max(0, min(y_min, y_size - 1))
        y_max = max(1, min(y_max, y_size))

        return data_3d[x_min:x_max, y_min:y_max, :]


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
