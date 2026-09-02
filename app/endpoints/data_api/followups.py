"""
HTTP endpoints for FollowUp — the post-meeting message that chases the gaps a
meeting left open. The third corner of the prep / record / chase loop that
InterviewGuide and MeetingMinutes begin.

URL surface (mounted at /ati/data-api/v1):
    GET    /follow-ups/item/<unique_id>
    GET    /follow-ups/meeting/<meeting_minutes_id>          saved follow-ups for a meeting
    GET    /follow-ups/table/<meeting_minutes_id>            the per-indicator gap table
    POST   /follow-ups                                       (action: create_follow_up)

The gap table is a READ over the graph, not a stored artifact: one row per
success indicator the meeting touched, with its evidence and every open ask
against it. A saved FollowUp stores the markdown that was generated FROM that
table, so the record of what was sent survives the graph moving underneath it.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.followup.create import create_follow_up
from app.database.queries.followup.read import (
    build_follow_up_table,
    follow_ups_for_meeting,
    get_follow_up,
)
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class FollowUpsAPI(MethodView):
    def get(self, unique_id=None, meeting_minutes_id=None, table_meeting_id=None):
        try:
            if unique_id is not None:
                return make_response(status="success", data=get_follow_up(unique_id)), 200
            if meeting_minutes_id is not None:
                return make_response(
                    status="success",
                    data={"follow_ups": follow_ups_for_meeting(meeting_minutes_id)},
                ), 200
            if table_meeting_id is not None:
                return make_response(
                    status="success",
                    data={"rows": build_follow_up_table(table_meeting_id)},
                ), 200
            return make_response(status="error", error="Unsupported follow-ups route."), 400
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

            if action == "create_follow_up":
                for field in ("subject", "meeting_minutes_id"):
                    if not data.get(field):
                        return make_response(
                            status="error", error=f"'{field}' is required."
                        ), 400
                created = create_follow_up(
                    subject=data["subject"],
                    meeting_minutes_id=data["meeting_minutes_id"],
                    body_markdown=data.get("body_markdown"),
                    status=data.get("status", "draft"),
                    community_name=data.get("community_name"),
                    campus_abbreviation=data.get("campus_abbreviation"),
                    interview_guide_id=data.get("interview_guide_id"),
                    addressed_to_ids=data.get("addressed_to_ids"),
                    covers_evidence_identifiers=data.get("covers_evidence_identifiers"),
                    includes_query_ids=data.get("includes_query_ids"),
                    includes_recommendation_ids=data.get("includes_recommendation_ids"),
                    includes_concern_ids=data.get("includes_concern_ids"),
                    created_by_id=data.get("created_by_id"),
                )
                return make_response(status="success", data=created), 201

            return make_response(status="error", error=f"Unknown action: {action}"), 400
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


follow_ups_view = FollowUpsAPI.as_view("follow_ups_api")

# Reads
data_api_endpoints.add_url_rule(
    "/follow-ups/item/<string:unique_id>", view_func=follow_ups_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/follow-ups/meeting/<string:meeting_minutes_id>", view_func=follow_ups_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/follow-ups/table/<string:table_meeting_id>", view_func=follow_ups_view, methods=["GET"],
)
# Writes
data_api_endpoints.add_url_rule("/follow-ups", view_func=follow_ups_view, methods=["POST"])
