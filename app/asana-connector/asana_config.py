"""
Asana connector configuration.

Reads credentials/targets through the app's single config gateway
(``app/config_gateway.py``) — so they resolve from web.config in production and
``.env.<FLASK_ENV>`` in development, exactly like the rest of the app. Imports
only the gateway (stdlib + dotenv; no graph or Flask), so it stays safe to
import from anywhere — including a Flask request handler.

Environment variables
----------------------
ASANA_ACCESS_TOKEN   Personal Access Token (PAT) from https://app.asana.com/0/my-apps
ASANA_WORKSPACE_GID  Target workspace/organization gid (required to create a project)
ASANA_TEAM_GID       Target team gid. Required when the workspace is an
                     *organization*; omit for a plain workspace.
ASANA_BASE_URL       Optional override of the API base (default below).
"""
import os

DEFAULT_BASE_URL = "https://app.asana.com/api/1.0"

def _resolver():
    """Return a ``get(key, default=None)`` callable backed by the app's config
    gateway (web.config in prod, .env in dev). Falls back to plain os.environ if the
    gateway can't be imported (e.g. the connector run with the app package off
    sys.path)."""
    try:
        from app.config_gateway import config
        return config.get
    except Exception:
        return lambda key, default=None: os.environ.get(key, default)


class AsanaConfig:
    """Resolved connector settings. Construct via :func:`load_config`."""

    def __init__(self, access_token, workspace_gid=None, team_gid=None,
                 base_url=DEFAULT_BASE_URL):
        self.access_token = access_token
        self.workspace_gid = workspace_gid
        self.team_gid = team_gid
        self.base_url = base_url or DEFAULT_BASE_URL

    def require(self, *, need_workspace=True):
        """Raise a clear error if mandatory fields for a live push are missing."""
        missing = []
        if not self.access_token:
            missing.append("ASANA_ACCESS_TOKEN")
        if need_workspace and not self.workspace_gid:
            missing.append("ASANA_WORKSPACE_GID")
        if missing:
            raise RuntimeError(
                "Missing Asana configuration: " + ", ".join(missing)
                + ". Set them in app/.env.development (gitignored) or the "
                "environment. See app/asana-connector/README.md."
            )
        return self

    def __repr__(self):
        tok = "set" if self.access_token else "MISSING"
        return (f"AsanaConfig(token={tok}, workspace={self.workspace_gid!r}, "
                f"team={self.team_gid!r}, base_url={self.base_url!r})")


def load_config():
    """Build an :class:`AsanaConfig` from the config gateway (web.config / .env)."""
    get = _resolver()
    return AsanaConfig(
        access_token=get("ASANA_ACCESS_TOKEN"),
        workspace_gid=get("ASANA_WORKSPACE_GID"),
        team_gid=get("ASANA_TEAM_GID"),
        base_url=get("ASANA_BASE_URL", DEFAULT_BASE_URL),
    )
