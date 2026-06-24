"""Session establishment/teardown — the single place the session shape is known.

The session stores a plain dict of the Identity fields. Authorization flags
(is_admin, allowlist) are deliberately NOT stored here: they are evaluated per
request from config, so revoking access never requires users to re-login.
"""
from dataclasses import asdict

from flask import session

from .identity import Identity

SESSION_KEY = 'user'


def establish_session(identity: Identity) -> None:
    session.clear()
    session[SESSION_KEY] = asdict(identity)
    session.permanent = True


def clear_session() -> None:
    session.clear()


def current_identity() -> Identity | None:
    data = session.get(SESSION_KEY)
    if not data:
        return None
    try:
        return Identity(
            email=data['email'],
            display_name=data['display_name'],
            employee_id=data.get('employee_id'),
            provider=data.get('provider', 'local'),
        )
    except (KeyError, TypeError):
        # Malformed/stale cookie (e.g. from an older session shape) — treat as anonymous.
        return None
