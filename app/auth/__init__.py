"""
Authentication package — identity lives OUTSIDE the graph database.

Local username/password accounts (SQLite sidecar) today; the provider
abstraction in auth/providers/ is the seam where campus SSO (OIDC/Shibboleth)
slots in later without touching session handling, route protection, or the
/me contract.

This package must stay import-independent of app.endpoints.data_api — pulling
anything from there triggers its eager endpoint-module loading and the
circular-import trap documented in CLAUDE.md.
"""
from flask import Blueprint

auth_endpoints = Blueprint('auth', __name__)

from . import routes  # noqa: E402,F401  — registers URL rules on the blueprint
