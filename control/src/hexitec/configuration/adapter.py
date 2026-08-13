import logging
from hexitec.base.base_adapter import BaseAdapter
from odin.adapters.adapter import ApiAdapterResponse, wants_metadata
from hexitec.configuration.controller import ConfigurationController, ConfigurationError

class ConfigurationAdapter(BaseAdapter):
    """Adapter for the configuration mapping.
    This adapter takes a mapping of keys to parameters to use JSON files to configure settings.
    """
    controller_cls = ConfigurationController
    error_cls = ConfigurationError
