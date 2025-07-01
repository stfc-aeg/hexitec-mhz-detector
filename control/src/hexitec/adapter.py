from .base.base_adapter import BaseAdapter
from .controller import HexitecController, HexitecError


class HexitecAdapter(BaseAdapter):
    """HEXITEC Adapter class inheriting base adapter functionality."""

    controller_cls = HexitecController
    error_cls = HexitecError