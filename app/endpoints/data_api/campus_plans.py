"""
HTTP endpoints for CampusPlan.

URL surface (mounted at /ati/data-api/v1):
    GET    /campus-plans/<campus_abbrev>/<academic_year>
    POST   /campus-plans                                   (action-dispatch)

The read query lives in app.database.queries.committees.read since the
campus plan is a committee work product.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.committees.create import create_campus_plan
from app.database.queries.committees.read import fetch_campus_plan
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class CampusPlansAPI(MethodView):
    def get(self, campus_abbrev, academic_year):
        try:
            data = fetch_campus_plan(campus_abbrev, academic_year)
            return make_response(status="success", data=data), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            action = data.get("action")

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            if action == "create_campus_plan":
                required = ["campus_abbrev", "year_name"]
                missing = [k for k in required if k not in data]
                if missing:
                    return (
                        make_response(
                            status="error",
                            error=f"Missing required fields: {missing}",
                        ),
                        400,
                    )

                plan = create_campus_plan(data["campus_abbrev"], data["year_name"])
                return (
                    make_response(
                        status="success",
                        data={"plan_identifier": plan.plan_identifier},
                        message="CampusPlan created.",
                    ),
                    201,
                )

            return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


campus_plans_view = CampusPlansAPI.as_view("campus_plans_api")
data_api_endpoints.add_url_rule(
    "/campus-plans/<string:campus_abbrev>/<string:academic_year>",
    view_func=campus_plans_view,
    methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/campus-plans",
    view_func=campus_plans_view,
    methods=["POST"],
)
