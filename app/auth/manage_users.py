#!/usr/bin/env python
"""Server-side admin CLI for local auth accounts (the SQLite sidecar store).

It reuses app.auth.store, so it writes the SAME database, schema, and password
hashing the running app uses — there is no duplicated logic to drift.

Run it on the server with the app's venv, from the site root:

    cd C:\\www\\ati
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py add jdoe --name "Jane Doe" --employee-id 912345678
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py list
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py passwd jdoe
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py deactivate jdoe

Which database file is edited:
  The store reads AUTH_DB_PATH, else defaults to app/auth_users.sqlite3. This
  script resolves it the same way and PRINTS the path on every run so you can
  confirm you're editing the file the app actually uses. If the app pool has
  AUTH_DB_PATH set (machine env var / FastCGI env), set the same value in your
  shell before running so both point at the same file.

Passwords:
  Omit --password to be prompted securely (hidden input, with confirmation).
  Passing --password puts the secret in your shell history — prefer the prompt.
"""
import argparse
import getpass
import os
import sqlite3
import sys
from pathlib import Path

# Make `app` importable regardless of the current working directory: the site
# root is this file's grandparent's parent (…/app/auth/manage_users.py).
_SITE_ROOT = str(Path(__file__).resolve().parents[2])
if _SITE_ROOT not in sys.path:
    sys.path.insert(0, _SITE_ROOT)

from app.auth import store  # noqa: E402


def _prompt_password() -> str:
    while True:
        pw = getpass.getpass('New password: ')
        if not pw:
            print('  Password cannot be empty.')
            continue
        if pw != getpass.getpass('Confirm password: '):
            print('  Passwords did not match — try again.')
            continue
        return pw


def cmd_add(args) -> int:
    password = args.password or _prompt_password()
    try:
        store.create_user(
            username=args.username,
            password=password,
            display_name=args.name,
            employee_id=args.employee_id,
        )
    except sqlite3.IntegrityError:
        print(f"ERROR: a user named '{args.username}' already exists "
              f"(usernames are case-insensitive). Use 'passwd' to reset it.")
        return 1
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1
    print(f"Created account '{args.username}' ({args.name}).")
    return 0


def cmd_list(_args) -> int:
    users = store.list_users()
    if not users:
        print("(no accounts yet)")
        return 0
    print(f"{'username':<24} {'display name':<28} {'emp id':<12} active")
    print('-' * 76)
    for u in users:
        print(f"{u['username']:<24} {u['display_name']:<28} "
              f"{(u['employee_id'] or ''):<12} {'yes' if u['active'] else 'NO'}")
    return 0


def cmd_passwd(args) -> int:
    password = args.password or _prompt_password()
    try:
        store.set_password(args.username, password)
    except LookupError:
        print(f"ERROR: no such user '{args.username}'.")
        return 1
    print(f"Password updated for '{args.username}'.")
    return 0


def _set_active(username: str, active: bool) -> int:
    try:
        store.set_active(username, active)
    except LookupError:
        print(f"ERROR: no such user '{username}'.")
        return 1
    print(f"'{username}' is now {'active' if active else 'INACTIVE (login blocked)'}.")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog='manage_users.py',
        description='Manage local auth accounts (SQLite store).',
    )
    sub = parser.add_subparsers(dest='command', required=True)

    p_add = sub.add_parser('add', help='create a new account')
    p_add.add_argument('username')
    p_add.add_argument('--name', required=True, help='display name (required)')
    p_add.add_argument('--employee-id', default=None, help='optional employee id')
    p_add.add_argument('--password', default=None,
                       help='(omit to be prompted securely)')

    sub.add_parser('list', help='list all accounts')

    p_pw = sub.add_parser('passwd', help='reset an account password')
    p_pw.add_argument('username')
    p_pw.add_argument('--password', default=None)

    p_on = sub.add_parser('activate', help='re-enable an account')
    p_on.add_argument('username')
    p_off = sub.add_parser('deactivate', help='disable an account (blocks login)')
    p_off.add_argument('username')

    args = parser.parse_args(argv)

    # Always show which file we're touching — the #1 source of "I added a user
    # but login still fails" is editing a different DB than the app reads.
    print(f"auth DB: {store._db_path()}\n")

    return {
        'add': lambda: cmd_add(args),
        'list': lambda: cmd_list(args),
        'passwd': lambda: cmd_passwd(args),
        'activate': lambda: _set_active(args.username, True),
        'deactivate': lambda: _set_active(args.username, False),
    }[args.command]()


if __name__ == '__main__':
    raise SystemExit(main())
