"""Provider registry — the SSO seam.

A provider is a module exposing `authenticate(email, password) -> Identity | None`
(for form-based providers). A future OIDC provider instead exposes
begin_login()/handle_callback() used by additional redirect routes; both paths
end in session_helpers.establish_session(identity), so nothing downstream
changes.
"""
from flask import current_app


def get_provider():
    name = current_app.config.get('AUTH_PROVIDER', 'local')
    if name == 'local':
        from . import local
        return local
    raise ValueError(f'unknown AUTH_PROVIDER: {name!r}')
