"""
HTTP endpoints for the Asana plans sync.

URL surface (mounted at /ati/data-api/v1):
    POST   /asana/refresh-plans          {campus_abbrev, year_name}
    GET    /asana/subtasks/<plan_uid>

POST runs the two-way reconciliation (push plans -> Asana, pull subtasks
<- Asana) for the given campus + academic year. GET serves a plan's mirrored
subtasks to the detail panel.

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


class AsanaSubtasksAPI(MethodView):
    def get(self, plan_uid):
        try:
            return make_response(status="success", data=get_plan_subtasks(plan_uid)), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


data_api_endpoints.add_url_rule(
    "/asana/refresh-plans",
    view_func=AsanaRefreshAPI.as_view("asana_refresh_api"),
    methods=["POST"],
)
data_api_endpoints.add_url_rule(
    "/asana/subtasks/<string:plan_uid>",
    view_func=AsanaSubtasksAPI.as_view("asana_subtasks_api"),
    methods=["GET"],
)
