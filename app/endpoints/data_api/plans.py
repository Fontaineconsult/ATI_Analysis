"""
HTTP endpoints for the plans domain — the canonical URL surface.

URL surface (mounted at /ati/data-api/v1):
    GET /plans/board?campus=<abbrev>&year=<YYYY-YYYY>   the board read
    GET /plans/tasks?campus=<abbrev>&year=<YYYY-YYYY>   every subtask across plans
    GET/POST/PUT/DELETE /plans                          plan CRUD
    GET/POST/PUT/DELETE /accomplishments                accomplishment CRUD

The CRUD routes serve the SAME MethodView classes that have always handled
plans and accomplishments (ImplementationPlanAPI and
ImplementationAccomplishmentAPI): registering them here makes /plans and
/accomplishments the canonical addresses, and the legacy
/implementations/plans and /implementations/accomplishments rules become
backward-compatible shims. Moving the class bodies out of implementation.py
is a later, purely mechanical slice.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.plans.read import (
    accomplishments_board,
    plans_board,
    tasks_board,
)
from app.endpoints.data_api.errors.custom_exceptions import ValidationError

from . import data_api_endpoints
from .implementation import ImplementationAccomplishmentAPI, ImplementationPlanAPI
from .util.response import make_response


class PlansBoardAPI(MethodView):
    def get(self):
        try:
            campus = request.args.get("campus")
            year = request.args.get("year")
            return make_response(
                status="success",
                data={"plans": plans_board(campus, year)},
            ), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


class PlansTasksAPI(MethodView):
    def get(self):
        try:
            campus = request.args.get("campus")
            year = request.args.get("year")
            return make_response(
                status="success",
                data={"tasks": tasks_board(campus, year)},
            ), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


data_api_endpoints.add_url_rule(
    "/plans/board",
    view_func=PlansBoardAPI.as_view("plans_board_api"),
    methods=["GET"],
)
class AccomplishmentsBoardAPI(MethodView):
    def get(self):
        try:
            return make_response(
                status="success",
                data={"accomplishments": accomplishments_board()},
            ), 200
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


data_api_endpoints.add_url_rule(
    "/plans/tasks",
    view_func=PlansTasksAPI.as_view("plans_tasks_api"),
    methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/accomplishments/board",
    view_func=AccomplishmentsBoardAPI.as_view("accomplishments_board_api"),
    methods=["GET"],
)

# Canonical CRUD addresses, served by the long-standing view classes. The
# /implementations/... rules registered in implementation.py stay as shims.
data_api_endpoints.add_url_rule(
    "/plans",
    view_func=ImplementationPlanAPI.as_view("plans_crud_api"),
    methods=["GET", "POST", "PUT", "DELETE"],
)
data_api_endpoints.add_url_rule(
    "/accomplishments",
    view_func=ImplementationAccomplishmentAPI.as_view("accomplishments_crud_api"),
    methods=["GET", "POST", "PUT", "DELETE"],
)
