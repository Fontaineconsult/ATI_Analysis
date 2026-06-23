import logging
import sys
from flask import jsonify

_logger = logging.getLogger("ati.api")

# Our custom exceptions log themselves on construction (see
# errors/custom_exceptions.py), so re-logging them here would just duplicate the
# record. This set lets make_response act purely as a BACKSTOP: it logs only when
# an endpoint caught some *other* exception (e.g. a raw KeyError/TypeError) and
# turned it into an error response without wrapping it in a custom type — which
# would otherwise be a 500 with nothing in the log. Matched by class name to keep
# this leaf util import-cycle free.
_SELF_LOGGING_EXCEPTIONS = {
    "NotFoundError", "ValidationError", "CrudError", "ApiError", "DatabaseError",
}


def make_response(status, data=None, error=None, message=None):
    """
    Constructs a standardized JSON response.

    :param status: "success" or "error"
    :param data: The payload for successful responses
    :param error: Error message for failed responses
    :param message: Additional message for the response
    :return: Flask Response object
    """
    # Backstop logging: catch any unexpected exception an endpoint turned into an
    # error response without it being one of the self-logging custom types.
    if status == "error":
        exc = sys.exc_info()[1]
        if exc is not None and type(exc).__name__ not in _SELF_LOGGING_EXCEPTIONS:
            _logger.error("unhandled exception in error response: %s", error or exc, exc_info=True)

    response = {
        "status": status,
        "data": data,
        "error": error,
        "message": message

    }
    return jsonify(response)
