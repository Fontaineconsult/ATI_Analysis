"""SQLite user store for local accounts.

Deliberately stdlib-only (sqlite3 + werkzeug hashing — both already
dependencies). Connections are short-lived and the database runs in WAL mode,
which is safe across the multiple FastCGI worker processes IIS may spawn.

Accounts are keyed by EMAIL — the login identifier AND the link to a graph
Person node. This module stays graph-agnostic on purpose: enforcing that a
Person with that email exists is the caller's policy (see
app/auth/manage_users.py), so the store keeps zero Neo4j dependency.

The file location comes from AUTH_DB_PATH (machine env var / FastCGI env in
production, e.g. C:\\www\\ati\\data\\auth_users.sqlite3 — the directory must be
writable by the app-pool identity for WAL side files). The dev default lives
in-repo and is gitignored.
"""
import os
import sqlite3
from pathlib import Path

from werkzeug.security import check_password_hash, generate_password_hash

_DEV_DEFAULT = Path(__file__).resolve().parent.parent / 'auth_users.sqlite3'

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    employee_id   TEXT,
    display_name  TEXT NOT NULL,
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def _db_path() -> str:
    return os.environ.get('AUTH_DB_PATH') or str(_DEV_DEFAULT)


def _connect() -> sqlite3.Connection:
    path = _db_path()
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = None
    try:
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        # sqlite opens the file lazily — an unwritable path often only
        # surfaces at this first statement.
        conn.execute('PRAGMA journal_mode=WAL')
    except sqlite3.OperationalError as exc:
        if conn is not None:
            conn.close()
        # ASCII-only message: prod log files / consoles are often cp1252.
        raise sqlite3.OperationalError(
            f'{exc} (auth store: {path!r} -- check AUTH_DB_PATH and that the '
            f'process identity has Modify on the containing directory; on IIS: '
            f'icacls <dir> /grant "IIS AppPool\\<pool>:(OI)(CI)M" /T)'
        ) from exc
    conn.execute(_SCHEMA)
    return conn


def init_db() -> None:
    with _connect():
        pass


def reset_db() -> None:
    """DROP the users table and recreate it with the CURRENT schema — wipes ALL
    accounts. Needed to replace the store after a schema change: CREATE TABLE IF
    NOT EXISTS never alters an existing table in place, so a drop is required.
    Operates on the resolved AUTH_DB_PATH file, so it can't target the wrong DB."""
    with _connect() as conn:
        conn.execute('DROP TABLE IF EXISTS users')
        conn.execute(_SCHEMA)


def create_user(email: str, password: str, display_name: str, employee_id: str | None = None) -> None:
    """Create a local account keyed by email.

    Raises sqlite3.IntegrityError if the email already exists. Does NOT verify a
    linked graph Person — that policy lives in the caller (manage_users), so the
    store stays Neo4j-free.
    """
    if not email or not password or not display_name:
        raise ValueError('email, password, and display_name are required')
    with _connect() as conn:
        conn.execute(
            'INSERT INTO users (email, password_hash, display_name, employee_id) VALUES (?, ?, ?, ?)',
            (email, generate_password_hash(password), display_name, employee_id),
        )


def verify_user(email: str, password: str) -> dict | None:
    """Return the user row as a dict on success; None for unknown email,
    wrong password, or an inactive account (indistinguishable to callers)."""
    with _connect() as conn:
        row = conn.execute(
            'SELECT * FROM users WHERE email = ?', (email,)
        ).fetchone()
    if row is None or not row['active']:
        return None
    if not check_password_hash(row['password_hash'], password):
        return None
    return dict(row)


def set_password(email: str, password: str) -> None:
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE email = ?",
            (generate_password_hash(password), email),
        )
        if cur.rowcount == 0:
            raise LookupError(f'no such account: {email}')


def set_active(email: str, active: bool) -> None:
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE users SET active = ?, updated_at = datetime('now') WHERE email = ?",
            (1 if active else 0, email),
        )
        if cur.rowcount == 0:
            raise LookupError(f'no such account: {email}')


def list_users() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            'SELECT email, display_name, employee_id, active, created_at, updated_at FROM users ORDER BY email'
        ).fetchall()
    return [dict(r) for r in rows]
