"""Manage local auth accounts (the SQLite sidecar — NOT the graph).

Run from the project root:

    python -m app.database.tools.manage_auth_users create-user jdoe --display-name "Jane Doe" --employee-id 913678186
    python -m app.database.tools.manage_auth_users set-password jdoe
    python -m app.database.tools.manage_auth_users deactivate jdoe
    python -m app.database.tools.manage_auth_users activate jdoe
    python -m app.database.tools.manage_auth_users list

Passwords are prompted via getpass unless --password is given (avoid --password
on shared machines; it lands in shell history). The target database file comes
from the AUTH_DB_PATH environment variable (set it to the production path,
e.g. C:\\www\\ati\\data\\auth_users.sqlite3, when seeding the live store).

This tool touches only SQLite — no Neo4j connection required.
"""
import argparse
import getpass
import sqlite3
import sys

from app.auth import store


def _prompt_password() -> str:
    pw = getpass.getpass('Password: ')
    confirm = getpass.getpass('Confirm password: ')
    if pw != confirm:
        sys.exit('Passwords do not match.')
    if not pw:
        sys.exit('Password may not be empty.')
    return pw


def cmd_create_user(args):
    password = args.password or _prompt_password()
    try:
        store.create_user(args.username, password, args.display_name, args.employee_id)
    except sqlite3.IntegrityError:
        sys.exit(f'User {args.username!r} already exists.')
    print(f'Created user {args.username!r} ({args.display_name}).')


def cmd_set_password(args):
    password = args.password or _prompt_password()
    try:
        store.set_password(args.username, password)
    except LookupError as exc:
        sys.exit(str(exc))
    print(f'Password updated for {args.username!r}.')


def cmd_set_active(args, active: bool):
    try:
        store.set_active(args.username, active)
    except LookupError as exc:
        sys.exit(str(exc))
    print(f'{"Activated" if active else "Deactivated"} {args.username!r}.')


def cmd_list(_args):
    users = store.list_users()
    if not users:
        print(f'No users in {store._db_path()}')
        return
    print(f'Users in {store._db_path()}:')
    for u in users:
        flag = 'active' if u['active'] else 'INACTIVE'
        emp = u['employee_id'] or '-'
        print(f"  {u['username']:<24} {u['display_name']:<30} employee_id={emp:<12} [{flag}]")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)

    p_create = sub.add_parser('create-user', help='Create a new local account')
    p_create.add_argument('username')
    p_create.add_argument('--display-name', required=True)
    p_create.add_argument('--employee-id', default=None,
                          help='Links the account to the graph Person for attribution')
    p_create.add_argument('--password', default=None, help='Omit to be prompted securely')
    p_create.set_defaults(func=cmd_create_user)

    p_pw = sub.add_parser('set-password', help='Reset a password')
    p_pw.add_argument('username')
    p_pw.add_argument('--password', default=None, help='Omit to be prompted securely')
    p_pw.set_defaults(func=cmd_set_password)

    p_deact = sub.add_parser('deactivate', help='Disable login for an account')
    p_deact.add_argument('username')
    p_deact.set_defaults(func=lambda a: cmd_set_active(a, False))

    p_act = sub.add_parser('activate', help='Re-enable login for an account')
    p_act.add_argument('username')
    p_act.set_defaults(func=lambda a: cmd_set_active(a, True))

    p_list = sub.add_parser('list', help='List all accounts')
    p_list.set_defaults(func=cmd_list)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
