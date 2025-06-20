from odin.adapters.parameter_tree import ParameterTree, ParameterTreeError

from base.base_controller import BaseController, BaseError

class HexitechError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""
    pass