"""
HTTP endpoints for the Asana plans sync and the plan Progress writes.

URL surface (mounted at /ati/data-api/v1):
    POST   /asana/refresh-plans          {campus_abbrev, year_name}
    GET    /asana/subtasks/<plan_uid>
    POST   /asana/subtasks/<plan_uid>    {name, notes?, due_on?, assignee_person_id?,
                                          year_name, campus_abbrev?}
    PUT    /asana/subtasks/<plan_uid>    {asana_gid, completed? and/or name?/notes?/due_on?
                                          and/or assignee_person_id? (null unassigns)
                                          and/or status?/resolution_note? (the app-side
                                          state tracker; 'Completed' completes in Asana)}

Refresh runs the two-way reconciliation for a campus + academic year. The
subtask GET serves a plan's first-order rows; POST and PUT are the app's
progress writes — Asana receives the write first, then the graph records
Asana's answer, so the row shows what Asana actually stored.

The connector lives in app/asana-connector/ (hyphenated, so not a normal
package) and is loaded by file path, mirroring the recipe in its README.
"""
import importlib.util
import os
import threading

from flask import current_app, request
from flask.views import MethodView

from app.database.queries.asana.read import get_plan_subtasks
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response

# importlib.util.module_from_spec + exec_module isn't re-entrant safe; one
# refresh at a time is also the right concurrency for an Asana push.
_load_lock = threading.Lock()
_connector_cache = {}


def _load_reconcile():
    with _load_lock:
        if "reconcile" not in _connector_cache:
            path = os.path.join(current_app.root_path, "asana-connector", "reconcile.py")
            spec = importlib.util.spec_from_file_location("ati_asana_reconcile", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            _connector_cache["reconcile"] = mod
        return _connector_cache["reconcile"]


class AsanaRefreshAPI(MethodView):
    def post(self):
        try:
            data = request.get_json() or {}
            missing = [k for k in ("campus_abbrev", "year_name") if not data.get(k)]
            if missing:
                return make_response(
                    status="error", error=f"Missing required fields: {missing}"
                ), 400

            reconcile = _load_reconcile()
            with _load_lock:
                summary = reconcile.refresh_plans(
                    data["campus_abbrev"], data["year_name"],
                    logger=lambda msg: current_app.logger.info("[asana] %s", msg),
                )
            return make_response(status="success", data=summary), 200

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except RuntimeError as e:
            # asana_config.require() raises RuntimeError on missing env config.
            return make_response(status="error", error=str(e)), 502
        except Exception as e:
            # AsanaError (loaded by path, so not importable here) and the rest.
            if type(e).__name__ == "AsanaError":
                return make_response(status="error", error=str(e)), 502
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


def _asana_error_response(e):
    """Shared error mapping for routes that call into the connector."""
    if isinstance(e, ValidationError) or isinstance(e, ValueError):
        return make_response(status="error", error=str(e)), 400
    if isinstance(e, NotFoundError):
        return make_response(status="error", error=str(e)), 404
    if isinstance(e, CrudError):
        return make_response(status="error", error=str(e)), 500
    if isinstance(e, RuntimeError) or type(e).__name__ == "AsanaError":
        # Missing env config, or the Asana API said no.
        return make_response(status="error", error=str(e)), 502
    return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


class AsanaSubtasksAPI(MethodView):
    def get(self, plan_uid):
        try:
            return make_response(status="success", data=get_plan_subtasks(plan_uid)), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500

    def post(self, plan_uid):
        """Add one progress subtask: created in Asana, recorded in the graph."""
        try:
            data = request.get_json() or {}
            if not (data.get("name") or "").strip():
                return make_response(status="error", error="'name' is required."), 400
            if not data.get("year_name"):
                return make_response(status="error", error="'year_name' is required."), 400

            reconcile = _load_reconcile()
            with _load_lock:
                created = reconcile.add_plan_subtask(
                    plan_uid, data["name"],
                    notes=data.get("notes"),
                    due_on=data.get("due_on"),
                    assignee_person_id=data.get("assignee_person_id"),
                    year_name=data["year_name"],
                    campus_abbrev=data.get("campus_abbrev"),
                    logger=lambda msg: current_app.logger.info("[asana] %s", msg),
                )
            return make_response(status="success", data=created), 201
        except Exception as e:
            return _asana_error_response(e)

    def put(self, plan_uid):
        """Change one subtask, in Asana first, then locally.

        `completed` toggles completion; `name` / `notes` / `due_on` edit the
        fields (absent = leave alone). A call may combine both kinds.
        """
        try:
            data = request.get_json() or {}
            if not data.get("asana_gid"):
                return make_response(status="error", error="'asana_gid' is required."), 400
            edit_fields = {k: data[k] for k in ("name", "notes", "due_on") if k in data}
            wants_assignee = "assignee_person_id" in data
            wants_status = "status" in data or "resolution_note" in data
            if "completed" not in data and not edit_fields \
                    and not wants_assignee and not wants_status:
                return make_response(
                    status="error",
                    error="Pass 'completed', 'assignee_person_id', 'status', "
                          "'resolution_note', and/or one of name / notes / due_on.",
                ), 400

            log = lambda msg: current_app.logger.info("[asana] %s", msg)  # noqa: E731
            reconcile = _load_reconcile()
            with _load_lock:
                updated = None
                if edit_fields:
                    updated = reconcile.update_plan_subtask(
                        plan_uid, data["asana_gid"], logger=log, **edit_fields,
                    )
                if wants_assignee:
                    # Present-and-null means unassign.
                    updated = reconcile.set_plan_subtask_assignee(
                        plan_uid, data["asana_gid"], data.get("assignee_person_id"),
                        logger=log,
                    )
                if wants_status:
                    updated = reconcile.set_plan_subtask_status(
                        plan_uid, data["asana_gid"],
                        status=data.get("status"),
                        resolution_note=data.get("resolution_note"),
                        logger=log,
                    )
                if "completed" in data:
                    updated = reconcile.set_plan_subtask_completed(
                        plan_uid, data["asana_gid"], bool(data["completed"]),
                        logger=log,
                    )
            return make_response(status="success", data=updated), 200
        except Exception as e:
            return _asana_error_response(e)


data_api_endpoints.add_url_rule(
    "/asana/refresh-plans",
    view_func=AsanaRefreshAPI.as_view("asana_refresh_api"),
    methods=["POST"],
)
data_api_endpoints.add_url_rule(
    "/asana/subtasks/<string:plan_uid>",
    view_func=AsanaSubtasksAPI.as_view("asana_subtasks_api"),
    methods=["GET", "POST", "PUT"],
)
