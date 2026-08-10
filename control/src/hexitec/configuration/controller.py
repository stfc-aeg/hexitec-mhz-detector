import logging
from hexitec.base.base_controller import BaseController, BaseError
from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from pathlib import Path
import json
from hexitec.util.iac import iac_set, iac_get

class ConfigurationError(BaseError):
    """Exception raised for errors in the ConfigurationController."""
    pass

class ConfigurationController(BaseController):
    """Class to handle configuration profiles for an odin control instance.
    
    Read JSON profiles from a given directory. Apply those based on a mapping provided by
    a controlling adapter elsewhere in the application."""

    def __init__(self, options):
        self.options = options

        self.profile_filepath = self.options.get('profile_filepath', 'web/config/profiles')
        self.available_profiles = []
        self.profile = ""
        self.edit_mode = False

        # Mapping can be stored as a JSON file and read in as configuration instead of being coded
        # This avoids the mapping being saved as a system artefact if that is undesirable
        default_mapping = self.options.get('default_map_filepath', '')
        if default_mapping:
            self.set_mapping(default_mapping)

        self.default_profile = self.options.get('default_profile', 'default')

    def _build_tree(self):
        """Build the parameter tree for the class."""
        tree = {
            'available_profiles': (lambda: self.available_profiles, self._update_profiles),
            'current_profile': (lambda: self.profile, self.set_profile),
            'create_profile': (lambda: None, self.create_profile),
            'profiles_filepath': (lambda: self.profile_filepath, self.set_profile_filepath),
            'edit_current_config': (lambda: self.edit_mode, self.toggle_editing),
            'set_mapping': (lambda: None, self.set_mapping)
        }

        self.param_tree = ParameterTree(tree)

    def initialize(self, adapters):
        """Initialize the adapter with a dictionary of other adapters.
        This function also updates the available profiles and builds the ParameterTree.
        :param adapters: dictionary of adapter instances keyed by name
        """
        self.adapters = adapters
        self._update_profiles()
        self._build_tree()

        # Set the profile to the default profile
        self.set_profile(self.default_profile)

    def cleanup(self):
        """Clean up controller resources."""
        logging.debug("Cleaning up HistogramLiveViewController")
        for processor in self.processors:
            if processor.process.is_alive():
                processor.process.terminate()
                processor.process.join()

    def get(self, path: str, with_metadata=False):
        """Get parameter data from controller."""
        try:
            return self.param_tree.get(path, with_metadata)
        except ParameterTreeError as error:
            logging.error("Error getting parameter: %s", error)
            raise ConfigurationError(str(error))

    def set(self, path: str, data: dict):
        """Set parameter data in controller."""
        try:
            self.param_tree.set(path, data)
        except ParameterTreeError as error:
            logging.error("Error setting parameter: %s", error)
            raise ConfigurationError(str(error))

    def _read_json(self, path):
        """Verify and read a path."""
        path = Path(path)

        if not path.exists():
            logging.warning(f"Given path not found: {path}")
            return
        
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        
        if not isinstance(data, dict):
            raise ConfigurationError(f"File {path} must contain a JSON object.")

        return data

    def toggle_editing(self, toggle: bool):
        """Enable or disable the edit_mode flag."""
        self.edit_mode = bool(toggle)

    def set_profile_filepath(self, filepath: str):
        """Set the filepath to read profiles from, and update the available profiles."""
        self.profile_filepath = filepath

    def set_mapping(self, mapping: dict | str):
        """Set the local mapping: use dictionary or read from the given filepath."""
        if isinstance(mapping, dict):
            self.mapping = mapping
        elif isinstance(mapping, str):
            data = self._read_json(mapping)
            self.mapping = data if data else self.mapping
        else:
            logging.warning(f"Mapping is not a valid type. Should be a dictionary or filepath string.")

    def set_profile(self, profile: str):
        """Set the configuration profile for the system.
        :param profile: string of profile name
        """
        if profile not in self.available_profiles:
            raise ConfigurationError(f"Profile '{profile}' not found in available profiles.")

        self.profile = profile

        profile_dir = Path(self.profile_filepath)
        profile_path = profile_dir / f"{profile}.json"

        data = self._read_json(profile_path)

        # Local function to write out the details based on the mapping paths
        def _write_value(key, value):
            """Write the profile value to the given path in the mapping dictionary."""
            # If the value doesn't exist, don't do anything with it
            if value is None:
                return
            
            # Break up path into adapter and the rest
            full = self.mapping[key]
            adapter, rest = full.split('/', 1) if '/' in full else (full, '')
            path, param_name = rest.rsplit('/', 1) if '/' in rest else ('', rest if rest else key)
            # This gives you adapter, path is optional, and paramname will be key if there is none
            
            try:
                data = {param_name: value}
                iac_set(adapter=self.adapters.get(adapter), path=path, data=data)
            except Exception as e:
                logging.error(f"Failed to set value in config profile: {e}")
        
        for key, value in data.items():
            _write_value(key, value)

    def _update_profiles(self, val=None):
        """Read the profiles directory and fetch the names of all .json files within.
        These names become the available_profiles for selection, as paramtree metadata is static.
        """
        profiles_dir = Path(self.profile_filepath)

        if not profiles_dir.exists():
            self.available_profiles = []
            return

        self.available_profiles = sorted(
            path.stem for path in profiles_dir.glob("*.json") if path.is_file()
        )

    def create_profile(self, name: str):
        """Create a profile file with the given name using the current settings."""

        def _read_value(key):
            # Handle path
            full = self.mapping[key]
            adapter, rest = full.split('/', 1) if '/' in full else (full, '')

            try:
                return iac_get(adapter=self.adapters.get(adapter), path=rest)
            except Exception as e:
                logging.error(f"Failed to read value for config profile: {e}")
        
        # Get values and populate file-to-write
        to_write = {}
        for key in self.mapping.keys():
            to_write[key] = _read_value(key)
        
        # Name cannot be empty, if it is, overwrite it with 'custom_config'
        if not name:
           name = "custom_config"

        # Write the values out to JSON using the same configured profile path used for reads
        filename = f"{name}.json"
        profile_dir = Path(self.profile_filepath)
        filepath = profile_dir / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with filepath.open('w', encoding='utf-8') as file:
            json.dump(to_write, file, indent=4)

        self._update_profiles()
