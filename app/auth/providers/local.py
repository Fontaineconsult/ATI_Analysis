"""Local-account provider: verifies against the SQLite sidecar store by email."""
from ..identity import Identity
from .. import store


def authenticate(email: str, password: str) -> Identity | None:
    row = store.verify_user(email, password)
    if row is None:
        return None
    return Identity(
        email=row['email'],
        display_name=row['display_name'],
        employee_id=row['employee_id'],
        provider='local',
    )
