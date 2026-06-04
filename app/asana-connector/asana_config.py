"""
Asana connector configuration.

Reads credentials/targets from environment variables, loading the same
``app/.env.<FLASK_ENV>`` file the rest of the app uses (defaults to
``.env.development``). Nothing here imports the graph or Flask, so it is safe
to import from anywhere — including a Flask request handler.

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

# app/  (the directory that holds .env.development and this connector's parent)
_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_dotenv():
    """Best-effort load of app/.env.<FLASK_ENV>; never raises if unavailable."""
    try:
        from dotenv import load_dotenv
    except Exception:
        return
    env_name = os.environ.get("FLASK_ENV", "development")
    load_dotenv(os.path.join(_APP_DIR, f".env.{env_name}"))


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
    """Build an :class:`AsanaConfig` from the environment (loading .env first)."""
    _load_dotenv()
    return AsanaConfig(
        access_token=os.environ.get("ASANA_ACCESS_TOKEN"),
        workspace_gid=os.environ.get("ASANA_WORKSPACE_GID"),
        team_gid=os.environ.get("ASANA_TEAM_GID"),
        base_url=os.environ.get("ASANA_BASE_URL", DEFAULT_BASE_URL),
    )
