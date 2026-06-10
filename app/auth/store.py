"""SQLite user store for local accounts.

Deliberately stdlib-only (sqlite3 + werkzeug hashing — both already
dependencies). Connections are short-lived and the database runs in WAL mode,
which is safe across the multiple FastCGI worker processes IIS may spawn.

The file location comes from AUTH_DB_PATH (web.config appSetting in
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
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
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


def create_user(username: str, password: str, display_name: str, employee_id: str | None = None) -> None:
    """Raises sqlite3.IntegrityError if the username already exists."""
    if not username or not password or not display_name:
        raise ValueError('username, password, and display_name are required')
    with _connect() as conn:
        conn.execute(
            'INSERT INTO users (username, password_hash, display_name, employee_id) VALUES (?, ?, ?, ?)',
            (username, generate_password_hash(password), display_name, employee_id),
        )


def verify_user(username: str, password: str) -> dict | None:
    """Return the user row as a dict on success; None for unknown username,
    wrong password, or an inactive account (indistinguishable to callers)."""
    with _connect() as conn:
        row = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
    if row is None or not row['active']:
        return None
    if not check_password_hash(row['password_hash'], password):
        return None
    return dict(row)


def set_password(username: str, password: str) -> None:
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE username = ?",
            (generate_password_hash(password), username),
        )
        if cur.rowcount == 0:
            raise LookupError(f'no such user: {username}')


def set_active(username: str, active: bool) -> None:
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE users SET active = ?, updated_at = datetime('now') WHERE username = ?",
            (1 if active else 0, username),
        )
        if cur.rowcount == 0:
            raise LookupError(f'no such user: {username}')


def list_users() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            'SELECT username, display_name, employee_id, active, created_at, updated_at FROM users ORDER BY username'
        ).fetchall()
    return [dict(r) for r in rows]
