from odin_control.adapters.adapter import ApiAdapter
from .controller import HexitecController, HexitecError


class HexitecAdapter(ApiAdapter):
    """HEXITEC Adapter class inheriting base adapter functionality."""

    controller_cls = HexitecController
    error_cls = HexitecError