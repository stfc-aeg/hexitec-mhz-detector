import logging
from odin_control.adapters.adapter import ApiAdapter
from hexitec.configuration.controller import ConfigurationController, ConfigurationError

class ConfigurationAdapter(ApiAdapter):
    """Adapter for the configuration mapping.
    This adapter takes a mapping of keys to parameters to use JSON files to configure settings.
    """
    controller_cls = ConfigurationController
    error_cls = ConfigurationError
