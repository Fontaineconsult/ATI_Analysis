"""
Minimal Asana REST client built on ``requests`` (already a project dependency).

Covers exactly what the plans sync needs: identity check, project creation,
section creation, task creation, and placing a task in a section. Handles the
Asana ``{"data": ...}`` envelope, 429 rate-limit back-off (honouring
``Retry-After``), pagination, and turns API errors into :class:`AsanaError`.

Docs: https://developers.asana.com/reference/rest-api-reference
"""
import time

import requests

from asana_config import DEFAULT_BASE_URL


class AsanaError(RuntimeError):
    """An Asana API call returned a non-2xx response."""

    def __init__(self, status_code, message, payload=None):
        super().__init__(f"Asana API {status_code}: {message}")
        self.status_code = status_code
        self.payload = payload


class AsanaClient:
    def __init__(self, access_token, base_url=DEFAULT_BASE_URL, *,
                 session=None, timeout=30, max_retries=5):
        if not access_token:
            raise ValueError("AsanaClient requires an access token.")
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = session or requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        })

    # ---- low-level -------------------------------------------------------
    def _request(self, method, path, *, params=None, json_body=None):
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        for attempt in range(self.max_retries + 1):
            resp = self.session.request(
                method, url, params=params, json=json_body, timeout=self.timeout,
            )
            if resp.status_code == 429 and attempt < self.max_retries:
                # Honour Retry-After; fall back to a gentle linear back-off.
                wait = float(resp.headers.get("Retry-After") or (attempt + 1))
                time.sleep(wait)
                continue
            if resp.status_code >= 400:
                raise AsanaError(resp.status_code, _error_message(resp),
                                 payload=_safe_json(resp))
            if not resp.content:
                return {}
            return resp.json()
        # Exhausted retries on 429.
        raise AsanaError(429, "rate limited after retries")

    def _data(self, *args, **kwargs):
        """Return the ``data`` member of a single-object response."""
        return self._request(*args, **kwargs).get("data")

    # ---- identity / lookup ----------------------------------------------
    def me(self):
        """GET /users/me — cheap call to validate the token. Returns user dict."""
        return self._data("GET", "/users/me")

    def list_workspaces(self):
        return self._paginate("/workspaces", opt_fields="name")

    def find_project_by_name(self, name, workspace, team=None):
        """Return the first project in the workspace/team whose name matches, or None."""
        params = {"workspace": workspace, "opt_fields": "name,permalink_url"}
        if team:
            params["team"] = team
        for proj in self._paginate("/projects", **params):
            if proj.get("name") == name:
                return proj
        return None

    def get_project(self, project_gid):
        return self._data("GET", f"/projects/{project_gid}",
                          params={"opt_fields": "name,permalink_url,gid"})

    def list_sections(self, project_gid):
        return self._paginate(f"/projects/{project_gid}/sections", opt_fields="name")

    # ---- creation --------------------------------------------------------
    def create_project(self, name, workspace, *, team=None, notes=None,
                       public=False, default_view="board"):
        data = {"name": name, "workspace": workspace, "public": public}
        if team:
            data["team"] = team
        if notes is not None:
            data["notes"] = notes
        if default_view:
            data["default_view"] = default_view
        return self._data(
            "POST", "/projects",
            params={"opt_fields": "name,permalink_url,gid"},
            json_body={"data": data},
        )

    def create_section(self, project_gid, name):
        return self._data(
            "POST", f"/projects/{project_gid}/sections",
            json_body={"data": {"name": name}},
        )

    def create_task(self, name, project_gid, *, notes=None, completed=False,
                    custom_fields=None):
        data = {"name": name, "projects": [project_gid]}
        if notes is not None:
            data["notes"] = notes
        if completed:
            data["completed"] = True
        if custom_fields:
            # {field_gid: value} — text string, enum option gid, or list of
            # option gids for multi_enum.
            data["custom_fields"] = custom_fields
        return self._data(
            "POST", "/tasks",
            params={"opt_fields": "name,permalink_url,gid,completed"},
            json_body={"data": data},
        )

    def add_task_to_section(self, section_gid, task_gid):
        """Move an existing task into a section (removes it from other sections)."""
        return self._request(
            "POST", f"/sections/{section_gid}/addTask",
            json_body={"data": {"task": task_gid}},
        )

    # ---- reconciliation --------------------------------------------------
    def get_task(self, task_gid):
        """GET /tasks/{gid} — raises AsanaError(404) if it no longer exists."""
        return self._data(
            "GET", f"/tasks/{task_gid}",
            params={"opt_fields": "name,permalink_url,gid,completed"},
        )

    def update_task(self, task_gid, *, name=None, notes=None, custom_fields=None):
        """PUT /tasks/{gid} — update only the fields given (None = leave alone)."""
        data = {}
        if name is not None:
            data["name"] = name
        if notes is not None:
            data["notes"] = notes
        if custom_fields:
            data["custom_fields"] = custom_fields
        if not data:
            return None
        return self._data(
            "PUT", f"/tasks/{task_gid}",
            params={"opt_fields": "name,permalink_url,gid,completed"},
            json_body={"data": data},
        )

    # ---- custom fields ----------------------------------------------------
    def get_project_custom_field_settings(self, project_gid):
        """The project's custom fields (Asana list-view columns), with options."""
        return list(self._paginate(
            f"/projects/{project_gid}/custom_field_settings",
            opt_fields="custom_field.name,custom_field.resource_subtype,"
                       "custom_field.enum_options.name,"
                       "custom_field.enum_options.enabled",
        ))

    def create_enum_option(self, custom_field_gid, name):
        """Add an option to an enum/multi_enum custom field; returns the option."""
        return self._data(
            "POST", f"/custom_fields/{custom_field_gid}/enum_options",
            json_body={"data": {"name": name}},
        )

    def list_subtasks(self, task_gid):
        """All subtasks of a task, with the fields the graph mirror stores."""
        return list(self._paginate(
            f"/tasks/{task_gid}/subtasks",
            opt_fields="name,completed,completed_at,due_on,assignee.name,permalink_url",
        ))

    # ---- helpers ---------------------------------------------------------
    def _paginate(self, path, **params):
        """Yield every record across pages for a collection endpoint."""
        params = {k: v for k, v in params.items() if v is not None}
        params.setdefault("limit", 100)
        offset = None
        while True:
            page_params = dict(params)
            if offset:
                page_params["offset"] = offset
            resp = self._request("GET", path, params=page_params)
            for item in resp.get("data", []) or []:
                yield item
            offset = (resp.get("next_page") or {}).get("offset")
            if not offset:
                return


def _safe_json(resp):
    try:
        return resp.json()
    except Exception:
        return None


def _error_message(resp):
    body = _safe_json(resp)
    if isinstance(body, dict) and body.get("errors"):
        return "; ".join(e.get("message", "") for e in body["errors"]) or resp.reason
    return resp.text[:300] or resp.reason
