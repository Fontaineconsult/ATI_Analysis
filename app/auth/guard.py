"""Blueprint-level route protection.

Registered via data_api_endpoints.before_request(require_login) in
create_app() — that is the circular-import-safe spot; this module imports only
Flask and session_helpers and is safe to import from anywhere.
"""
from flask import current_app, jsonify, request

from .session_helpers import current_identity


def require_login():
    """Return None to let the request through, or a 401 JSON response.

    AUTH_ENFORCED is the global kill-switch: off (the dev default) makes this
    guard a no-op end to end.
    """
    if not current_app.config.get('AUTH_ENFORCED', False):
        return None
    if request.method == 'OPTIONS':
        # CORS preflights carry no cookies by design; the real request is guarded.
        return None
    if current_identity() is None:
        return jsonify({
            'status': 'error',
            'data': None,
            'message': None,
            'error': 'authentication_required',
        }), 401
    return None
