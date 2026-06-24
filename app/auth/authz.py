"""Authorization from config/env — never from the graph, never from the cookie.

AUTH_ADMINS / AUTH_ALLOWED_USERS are comma-separated lists that may mix
emails and employee_ids: matching either grants the role. Keying by
employee_id lets entries survive the local->SSO login-id change.
"""
from .identity import Identity


def parse_admins(raw: str | None) -> frozenset[str]:
    if not raw:
        return frozenset()
    return frozenset(part.strip().casefold() for part in raw.split(',') if part.strip())


def _identity_keys(identity: Identity) -> set[str]:
    keys = {identity.email.casefold()}
    if identity.employee_id:
        keys.add(str(identity.employee_id).casefold())
    return keys


def is_admin(identity: Identity, admins: frozenset[str]) -> bool:
    return bool(_identity_keys(identity) & admins)


def is_allowed(identity: Identity, allowed: frozenset[str]) -> bool:
    """Empty allowlist means every active, authenticated account may log in."""
    if not allowed:
        return True
    return bool(_identity_keys(identity) & allowed)
