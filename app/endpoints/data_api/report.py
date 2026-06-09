from flask import request
from flask.views import MethodView

from app.database.queries.compound_queries.get_indicator_report import (
    get_indicator_report,
    get_goal_report,
)
from . import data_api_endpoints
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import (
    ApiError,
    NotFoundError,
    ValidationError,
)


class IndicatorReportAPI(MethodView):
    """The dedicated single-indicator report payload behind the dashboard "View" report.

    GET /report/indicator?composite_key=1.12-web&year=2024-2025&campus=sfsu

    Composite keys carry a dot and a dash (e.g. "1.12-web"); they're passed as a query
    param rather than a path segment to keep the route encoding-clean.
    """

    def get(self):
        composite_key = request.args.get("composite_key")
        year = request.args.get("year")
        campus = request.args.get("campus", None)

        if not composite_key or not year:
            return make_response(
                status="error",
                error="Missing required query params 'composite_key' and 'year'.",
            ), 400

        try:
            data = get_indicator_report(composite_key, year, campus_abbreviation=campus)
            return make_response(status="success", data=data), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except ApiError as e:
            return make_response(status="error", error="Failed to build report", data=str(e)), 500


class GoalReportAPI(MethodView):
    """The full report for every indicator in one goal (within a working group) at a
    year/campus — the goal an indicator belongs to, in one fetch. The dashboard caches the
    goal, then serves each indicator's "View" report out of it, so goal siblings load instantly.

    GET /report/goal?goal=5&working_group=web&year=2024-2025&campus=sfsu

    working_group is the composite-key suffix code: web | pro | ins.
    """

    def get(self):
        goal = request.args.get("goal")
        working_group = request.args.get("working_group")
        year = request.args.get("year")
        campus = request.args.get("campus", None)

        if not goal or not working_group or not year:
            return make_response(
                status="error",
                error="Missing required query params 'goal', 'working_group' and 'year'.",
            ), 400

        try:
            data = get_goal_report(goal, working_group, year, campus_abbreviation=campus)
            return make_response(status="success", data=data), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except ApiError as e:
            return make_response(status="error", error="Failed to build goal report", data=str(e)), 500


report_view = IndicatorReportAPI.as_view("indicator_report_api")
goal_report_view = GoalReportAPI.as_view("goal_report_api")

data_api_endpoints.add_url_rule(
    "/report/indicator",
    view_func=report_view,
    methods=["GET"],
)

data_api_endpoints.add_url_rule(
    "/report/goal",
    view_func=goal_report_view,
    methods=["GET"],
)
