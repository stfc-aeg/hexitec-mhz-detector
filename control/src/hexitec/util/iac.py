from odin_control.adapters.adapter import ApiAdapter, ApiAdapterRequest
from odin_control.adapters.base_controller import BaseController, BaseError

from typing import Any, TypeVar

AnyAdapter = TypeVar("AnyAdapter", bound=ApiAdapter)
AnyController = TypeVar("AnyController", bound=BaseController)

class IACError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""

    def __str__(self) -> str:
        if len(self.args) == 1:
            return str(self.args[0])
        if len(self.args) > 1:
            try:
                return str(self.args[0]) % tuple(self.args[1:])
            except Exception:
                return " ".join(str(arg) for arg in self.args)
        return super().__str__()

def _format_iac_response(response_data: Any) -> Any:
    if isinstance(response_data, dict) and 'error' in response_data:
        return response_data['error']
    return response_data

class ICCError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""

    def __str__(self) -> str:
        if len(self.args) == 1:
            return str(self.args[0])
        if len(self.args) > 1:
            try:
                return str(self.args[0]) % tuple(self.args[1:])
            except Exception:
                return " ".join(str(arg) for arg in self.args)
        return super().__str__()

def iac_get(adapter: AnyAdapter, path: str) -> dict[str, Any] | Any:
    """Generic inter-adapter-communication get method for odin_control adapters.

    This method handles sending an HTTP style GET request to another adapter using the
    targets GET method implementation to request a value from its parameter tree.

    :param ApiAdapter adapter: Adapter object to target
    :param str path: Parameter tree path to target, must also include the parameter itself
    :return: Value of the requested parameter or the section of tree requested.
    :rtype: dict[str, Any] | Any
    """
    # TODO: When proxy adapter uses controller, this method will be removed
    try:
        request = ApiAdapterRequest(None, accept="application/json")
        response = adapter.get(path, request)
    except Exception:
        raise ICCError("Unknown error in IAC GET for adapter %s, path %s",
                       adapter.name, path)

    if response.status_code != 200:
        raise ICCError(
            f"IAC GET failed for adapter {adapter.name}, path {path}: {_format_iac_response(response.data)}"
        )
    response_data = response.data
    if not isinstance(response_data, dict):
        raise ICCError(
            f"IAC GET returned an invalid response for adapter {adapter.name}, path {path}: "
            f"{response_data}"
        )
    # Convert the dictionaries keys to a set. If there is exactly one, 'value', return it
    if set(response_data) == {"value"}:
        return response_data["value"]
    return response_data

def iac_set(adapter: AnyAdapter, path: str, data: dict[str, Any]):
    """Generic inter-adapter-communication set method for odin_control adapters.

    This method handles sending an HTTP style PUT request to another adapter using the target's
    PUT method implementation to update its parameter tree values.

    :param adapter: Adapter object to target.
    :type adapter: Any Subclass of BaseAdapter
    :param path: Parameter tree path to target, to not include the parameter itself
    :type path: str
    :param data: Dictionary of parameter value(s) to write to the specified path.
    :type data: dict[str, Any]
    """
    # TODO: When proxy adapter uses controller, this method will be removed
    # Create the request with the constructed data dictionary
    request = ApiAdapterRequest(data, content_type="application/vnd.odin-native")
    response = adapter.put(path, request)
    if response.status_code != 200:
        raise IACError(
            f"IAC SET failed for adapter {adapter.name}, path {path}: {_format_iac_response(response.data)}"
        )
    return response.data

def icc_get(controller: AnyController, path: str) -> dict[str, Any] | Any:
    """Generic inter-adapter-controller get method for odin_control controllers.
    This method avoids the HTTP message construction and directly calls the controller's get method
    to ensure the ParameterTree is updated correctly, while avoiding unnecessary encoding/decoding.

    :param controller: Controller object to target.
    :type controller: Any Subclass of BaseController
    :param path: Parameter tree path to target, must also include the parameter itself
    :type path: str
    :return: Value of the requested parameter or the section of tree requested.
    :rtype: dict[str, Any] | Any
    """
    try:
        response_data = controller.get(path)
    except Exception as e:
        raise ICCError(
            f"ICC GET failed for controller {controller}, path {path}: {e}"
        )

    if not isinstance(response_data, dict):
        raise ICCError(
            f"ICC GET returned an invalid response for controller {controller}, path {path}: "
            f"{response_data}"
        )
    # Convert the dictionaries keys to a set. If there is exactly one, 'value', return it
    if set(response_data) == {"value"}:
        return response_data["value"]
    return response_data

def icc_set(controller: AnyController, path: str, data: dict[str: Any]):
    """Generic inter-adapter-controller set method for odin_control controllers.
    This method avoids the HTTP message construction and directly calls the controller's set method
    to ensure the ParameterTree is updated correctly, while avoiding unnecessary encoding/decoding.
    
    :param controller: Controller object to target.
    :type controller: Any Subclass of BaseController
    :param path: Parameter tree path to target, to not include the parameter itself
    :type path: str
    :param data: Dictionary of parameter value(s) to write to the specified path.
    :type data: dict[str, Any]
    """
    try:
        controller.set(path, data)
    except Exception as e:
        raise ICCError(
            f"ICC SET failed for controller {controller}, path {path}: {e}"
        )