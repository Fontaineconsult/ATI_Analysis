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


def require_admin():
    """Return None for an admin (or with auth off), else a 401/403 JSON response.

    Called by an endpoint, not registered on the blueprint: most of the data API
    is open to any logged-in user, and only a few views (server configuration,
    such as GET /services) are admin-only. Admins come from AUTH_ADMINS, never
    from the graph or the cookie.
    """
    if not current_app.config.get('AUTH_ENFORCED', False):
        return None
    identity = current_identity()
    if identity is None:
        return require_login()
    from .authz import is_admin
    if not is_admin(identity, current_app.config.get('AUTH_ADMINS', frozenset())):
        return jsonify({
            'status': 'error',
            'data': None,
            'message': None,
            'error': 'admin_required',
        }), 403
    return None
