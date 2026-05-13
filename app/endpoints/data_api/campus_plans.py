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
from app.database.queries.committees.update import (
    add_prioritized_indicator,
    add_progress_update,
    assign_executive_sponsor_to_campus_plan,
    unassign_executive_sponsor_from_campus_plan,
    assign_group_lead_to_working_group_plan,
    unassign_group_lead_from_working_group_plan,
)
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

            if action == "add_prioritized_indicator":
                required = ["working_group_plan_identifier", "indicator_composite_key"]
                missing = [k for k in required if k not in data]
                if missing:
                    return (
                        make_response(
                            status="error",
                            error=f"Missing required fields: {missing}",
                        ),
                        400,
                    )

                add_prioritized_indicator(
                    data["working_group_plan_identifier"],
                    data["indicator_composite_key"],
                )
                return (
                    make_response(
                        status="success",
                        message="Indicator prioritized.",
                    ),
                    201,
                )

            if action == "add_progress_update":
                required = ["working_group_plan_identifier", "yse_identifier", "note"]
                missing = [k for k in required if k not in data]
                if missing:
                    return (
                        make_response(
                            status="error",
                            error=f"Missing required fields: {missing}",
                        ),
                        400,
                    )

                pu = add_progress_update(
                    working_group_plan_identifier=data["working_group_plan_identifier"],
                    yse_identifier=data["yse_identifier"],
                    note=data["note"],
                    trajectory=data.get("trajectory"),
                    author_unique_id=data.get("author_unique_id"),
                )
                return (
                    make_response(
                        status="success",
                        data={"unique_id": pu.unique_id},
                        message="Progress update logged.",
                    ),
                    201,
                )

            if action in ("assign_executive_sponsor", "unassign_executive_sponsor"):
                required = ["plan_identifier", "person_unique_id"]
                missing = [k for k in required if k not in data]
                if missing:
                    return (
                        make_response(status="error", error=f"Missing required fields: {missing}"),
                        400,
                    )
                fn = (assign_executive_sponsor_to_campus_plan
                      if action == "assign_executive_sponsor"
                      else unassign_executive_sponsor_from_campus_plan)
                fn(data["plan_identifier"], data["person_unique_id"])
                verb = "assigned" if action == "assign_executive_sponsor" else "unassigned"
                return make_response(status="success", message=f"Executive sponsor {verb}."), 200

            if action in ("assign_group_lead", "unassign_group_lead"):
                required = ["working_group_plan_identifier", "person_unique_id"]
                missing = [k for k in required if k not in data]
                if missing:
                    return (
                        make_response(status="error", error=f"Missing required fields: {missing}"),
                        400,
                    )
                fn = (assign_group_lead_to_working_group_plan
                      if action == "assign_group_lead"
                      else unassign_group_lead_from_working_group_plan)
                fn(data["working_group_plan_identifier"], data["person_unique_id"])
                verb = "assigned" if action == "assign_group_lead" else "unassigned"
                return make_response(status="success", message=f"Group lead {verb}."), 200

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
