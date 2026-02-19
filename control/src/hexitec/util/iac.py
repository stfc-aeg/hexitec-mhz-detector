import logging

from odin.adapters.adapter import ApiAdapterRequest
from hexitec.base.base_adapter import BaseAdapter, BaseError

from typing import Any, TypeVar

AnyAdapter = TypeVar("AnyAdapter", bound=BaseAdapter)

class IACError(BaseError):
    """Simple exception class to wrap lower-level exceptions."""


def iac_get(adapter: AnyAdapter, path: str, as_dict: bool = False) -> dict[str, Any] | Any:
    """Generic inter-adapter-communication get method for odin_control adapters.

    This method handles sending an HTTP style GET request to another adapter using the
    targets GET method implementation to request a value from its parameter tree.

    :param ApiAdapter adapter: Adapter object to target
    :param str path: Parameter tree path to target, must also include the parameter itself
    :param bool as_dict: Used to tell the function to return the response as a dict
    :return: Value of the parameter requested, or {param:value}
    :rtype: dict[str, Any] | Any
    """
    
    try:

        param = path.split('/')[-1]
        request = ApiAdapterRequest(None, accept="application/json")
        response = adapter.get(path, request)
    except Exception:
        raise IACError("Unknown error in IAC GET for for adapter %s, path %s",
                       adapter.name, path)

    if response.status_code != 200:
        raise IACError(f"IAC GET failed for adapter {adapter}, path {path}: {response.data}")
    return response.data if as_dict else response.data.get(param, "")

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

    # Create the request with the constructed data dictionary
    request = ApiAdapterRequest(data, content_type="application/vnd.odin-native")
    response = adapter.put(path, request)
    if response.status_code != 200:
        raise IACError(f"IAC SET failed for adapter {adapter}, path {path}: {response.data}")
    return response.data