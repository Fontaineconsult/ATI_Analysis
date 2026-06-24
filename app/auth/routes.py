"""Auth endpoints: POST /login, POST /logout, GET /me.

Mounted at /ati/auth/v1 by create_app(). The response envelope
({status, data, error, message}) is built inline here — importing the data_api
helpers would trigger that package's eager endpoint loading (circular trap).
"""
from flask import current_app, jsonify, request

from . import auth_endpoints
from .authz import is_admin, is_allowed
from .identity import Identity
from .providers import get_provider
from .session_helpers import clear_session, current_identity, establish_session


def _envelope(data=None, error=None, message=None, status_code=200):
    status = 'success' if error is None else 'error'
    return jsonify({
        'status': status,
        'data': data,
        'message': message,
        'error': error,
    }), status_code


def _linked_person(email):
    """Resolve the graph Person linked by email for attribution display. Lazy +
    guarded: auth must keep working when Neo4j is down or the person is missing
    (e.g. a bypass/system account that intentionally has no linked Person)."""
    if not email:
        return None
    try:
        from app.database.queries.individuals.read import get_person_by_email
        person = get_person_by_email(email)
        return person.serialize() if person is not None else None
    except Exception:
        return None


def _user_payload(identity: Identity) -> dict:
    return {
        'email': identity.email,
        'provider': identity.provider,
        'display_name': identity.display_name,
        'employee_id': identity.employee_id,
        'is_admin': is_admin(identity, current_app.config.get('AUTH_ADMINS', frozenset())),
        'person': _linked_person(identity.email),
    }


@auth_endpoints.route('/login', methods=['POST'])
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip()
    password = payload.get('password') or ''
    if not email or not password:
        return _envelope(error='email and password are required', status_code=400)

    identity = get_provider().authenticate(email, password)
    if identity is None or not is_allowed(identity, current_app.config.get('AUTH_ALLOWED_USERS', frozenset())):
        # One message for unknown user / bad password / inactive / not allowlisted.
        return _envelope(error='invalid_credentials', status_code=401)

    establish_session(identity)
    return _envelope(data={'user': _user_payload(identity)})


@auth_endpoints.route('/logout', methods=['POST'])
def logout():
    clear_session()
    return _envelope(data=None, message='logged out')


@auth_endpoints.route('/me', methods=['GET'])
def me():
    enforced = bool(current_app.config.get('AUTH_ENFORCED', False))
    identity = current_identity()
    if identity is None:
        if not enforced:
            # Kill-switch off: 200 so the frontend can tell "auth disabled"
            # apart from "not logged in".
            return _envelope(data={'enforced': False, 'user': None})
        return _envelope(error='authentication_required', status_code=401)
    return _envelope(data={'enforced': enforced, 'user': _user_payload(identity)})
