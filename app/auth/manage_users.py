#!/usr/bin/env python
"""Server-side admin CLI for local auth accounts (the SQLite sidecar store).

Accounts are keyed by EMAIL, which is both the login id AND the link to a graph
Person node. By policy, `add` REQUIRES a matching Person (looked up by email) —
unless you pass --allow-no-person to create a person-less account (e.g. a
sysadmin). It reuses app.auth.store, so it writes the same DB/schema/hashing the
app uses.

Run it on the server with the app's venv, from the site root:

    cd C:\\www\\ati
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py add jane@sfsu.edu --name "Jane Doe" --employee-id 912345678
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py add admin@sfsu.edu --name "Site Admin" --allow-no-person
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py list
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py passwd jane@sfsu.edu
    venv314\\Scripts\\python.exe app\\auth\\manage_users.py deactivate jane@sfsu.edu

Which database file is edited:
  The store reads AUTH_DB_PATH, else defaults to app/auth_users.sqlite3. This
  script resolves it the same way and PRINTS the path on every run so you can
  confirm you're editing the file the app actually uses.

Passwords:
  Omit --password to be prompted securely (hidden input, with confirmation).
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


def _load_app_env() -> None:
    """Resolve env (especially AUTH_DB_PATH) the SAME way the running app does,
    by loading app/.env.<FLASK_ENV>. Without this the CLI falls back to the
    store's DEFAULT path and edits a DIFFERENT sqlite file than the app reads —
    e.g. prod sets AUTH_DB_PATH=C:\\www\\ati\\data\\... in .env.production, but the
    bare tool would write C:\\www\\ati\\app\\auth_users.sqlite3. A var already set
    in the shell wins (override=False), matching the app's own resolution order.
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    env_name = os.environ.get('FLASK_ENV', 'development')
    env_file = Path(_SITE_ROOT) / 'app' / f'.env.{env_name}'
    if env_file.exists():
        load_dotenv(env_file)


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


def _require_linked_person(email):
    """Look `email` up against graph Person nodes. Returns the Person on a unique
    match; otherwise prints a clear message and exits non-zero. Bootstraps the
    graph layer lazily — only the `add` path (without --allow-no-person) needs Neo4j."""
    try:
        import app.endpoints.data_api  # noqa: F401 — warm up to dodge the circular-import trap
        from app.database.graph_schema import set_connection
        set_connection()
        from app.database.queries.individuals.read import get_person_by_email
        from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
    except Exception as exc:
        print(f"ERROR: could not load the graph layer to verify the Person: {exc}")
        print("If this account intentionally has no Person, re-run with --allow-no-person.")
        raise SystemExit(1)
    try:
        return get_person_by_email(email)
    except NotFoundError as exc:
        print(f"ERROR: {exc}")
        print("Every account must link to a Person by email. Add/fix the Person first,")
        print("or, for a person-less account (e.g. a sysadmin), re-run with --allow-no-person.")
        raise SystemExit(1)
    except Exception as exc:
        print(f"ERROR: could not reach the graph database to verify the Person: {exc}")
        print("Re-run with --allow-no-person to create the account without the check.")
        raise SystemExit(1)


def cmd_add(args) -> int:
    if args.allow_no_person:
        print("  (--allow-no-person) skipping the graph Person check.")
    else:
        person = _require_linked_person(args.email)
        print(f"  Linked to Person: {person.name} (employee_id {person.employee_id or '-'})")
    password = args.password or _prompt_password()
    try:
        store.create_user(
            email=args.email,
            password=password,
            display_name=args.name,
            employee_id=args.employee_id,
        )
    except sqlite3.IntegrityError:
        print(f"ERROR: an account with email '{args.email}' already exists "
              f"(emails are case-insensitive). Use 'passwd' to reset it.")
        return 1
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1
    print(f"Created account '{args.email}' ({args.name}).")
    return 0


def cmd_list(_args) -> int:
    users = store.list_users()
    if not users:
        print("(no accounts yet)")
        return 0
    print(f"{'email':<32} {'display name':<26} {'emp id':<12} active")
    print('-' * 80)
    for u in users:
        print(f"{u['email']:<32} {u['display_name']:<26} "
              f"{(u['employee_id'] or ''):<12} {'yes' if u['active'] else 'NO'}")
    return 0


def cmd_passwd(args) -> int:
    password = args.password or _prompt_password()
    try:
        store.set_password(args.email, password)
    except LookupError:
        print(f"ERROR: no account with email '{args.email}'.")
        return 1
    print(f"Password updated for '{args.email}'.")
    return 0


def _set_active(email: str, active: bool) -> int:
    try:
        store.set_active(email, active)
    except LookupError:
        print(f"ERROR: no account with email '{email}'.")
        return 1
    print(f"'{email}' is now {'active' if active else 'INACTIVE (login blocked)'}.")
    return 0


def cmd_reset(args) -> int:
    print(f"This WIPES every account in: {store._db_path()}")
    if not args.yes:
        if input("Type DELETE to confirm: ").strip() != 'DELETE':
            print("Aborted — nothing changed.")
            return 1
    store.reset_db()
    print("Account database reset to the current (email) schema. It is now empty.")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog='manage_users.py',
        description='Manage local auth accounts (SQLite, keyed by email).',
    )
    sub = parser.add_subparsers(dest='command', required=True)

    p_add = sub.add_parser('add', help='create a new account (requires a matching graph Person)')
    p_add.add_argument('email', help='login email (also the link to the graph Person)')
    p_add.add_argument('--name', required=True, help='display name (required)')
    p_add.add_argument('--employee-id', default=None, help='optional employee id')
    p_add.add_argument('--password', default=None, help='(omit to be prompted securely)')
    p_add.add_argument('--allow-no-person', action='store_true',
                       help='create even if no graph Person has this email (e.g. a sysadmin)')

    sub.add_parser('list', help='list all accounts')

    p_pw = sub.add_parser('passwd', help='reset an account password')
    p_pw.add_argument('email')
    p_pw.add_argument('--password', default=None)

    p_on = sub.add_parser('activate', help='re-enable an account')
    p_on.add_argument('email')
    p_off = sub.add_parser('deactivate', help='disable an account (blocks login)')
    p_off.add_argument('email')

    p_reset = sub.add_parser('reset', help='WIPE all accounts and recreate the table (use once after the schema change)')
    p_reset.add_argument('--yes', action='store_true', help='skip the interactive confirmation')

    args = parser.parse_args(argv)

    # Resolve AUTH_DB_PATH exactly like the running app (load app/.env.<FLASK_ENV>),
    # then show which file we're touching — a path mismatch between this tool and
    # the app is the #1 source of "I added a user but login still fails".
    _load_app_env()
    print(f"auth DB: {store._db_path()}\n")

    return {
        'add': lambda: cmd_add(args),
        'list': lambda: cmd_list(args),
        'passwd': lambda: cmd_passwd(args),
        'activate': lambda: _set_active(args.email, True),
        'deactivate': lambda: _set_active(args.email, False),
        'reset': lambda: cmd_reset(args),
    }[args.command]()


if __name__ == '__main__':
    raise SystemExit(main())
