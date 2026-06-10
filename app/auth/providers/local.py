"""Local-account provider: verifies against the SQLite sidecar store."""
from ..identity import Identity
from .. import store


def authenticate(username: str, password: str) -> Identity | None:
    row = store.verify_user(username, password)
    if row is None:
        return None
    return Identity(
        username=row['username'],
        display_name=row['display_name'],
        employee_id=row['employee_id'],
        provider='local',
    )
