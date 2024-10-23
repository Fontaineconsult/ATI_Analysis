from flask import jsonify
import json

def make_response(status, data=None, error=None):
    """
    Constructs a standardized JSON response.

    :param status: "success" or "error"
    :param data: The payload for successful responses
    :param error: Error message for failed responses
    :return: Flask Response object
    """
    response = {
        "status": status,
        "data": data,
        "error": error,

    }
    return jsonify(response)
