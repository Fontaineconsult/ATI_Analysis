"""
HTTP endpoints for FollowUp — the post-meeting message that chases the gaps a
meeting left open. The third corner of the prep / record / chase loop that
InterviewGuide and MeetingMinutes begin.

URL surface (mounted at /ati/data-api/v1):
    GET    /follow-ups/item/<unique_id>
    GET    /follow-ups/meeting/<meeting_minutes_id>          saved follow-ups for a meeting
    GET    /follow-ups/table/<meeting_minutes_id>            the per-indicator gap table
    GET    /follow-ups/replies/<unique_id>                   what came back from one chase
    GET    /follow-ups/board[?campus=<abbrev>]               every chase, next-contact first
    PUT    /follow-ups                                       (action: mark_sent / set_status /
                                                              update_follow_up / link_reply /
                                                              set_next_contact)
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
    follow_up_board,
    follow_ups_for_meeting,
    get_follow_up,
)
from app.database.queries.followup.reply import (
    link_reply_to_follow_up,
    replies_for_follow_up,
)
from app.database.queries.followup.update import (
    mark_follow_up_sent,
    set_follow_up_status,
    set_next_contact,
    update_follow_up,
)
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class FollowUpsAPI(MethodView):
    def get(self, unique_id=None, meeting_minutes_id=None, table_meeting_id=None,
            replies_follow_up_id=None, board=False):
        try:
            if board:
                return make_response(
                    status="success",
                    data={"follow_ups": follow_up_board(request.args.get("campus"))},
                ), 200
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
            if replies_follow_up_id is not None:
                return make_response(
                    status="success",
                    data=replies_for_follow_up(replies_follow_up_id),
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


    def put(self):
        try:
            data = request.get_json() or {}
            action = data.get("action")
            unique_id = data.get("unique_id")

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400
            if not unique_id:
                return make_response(status="error", error="'unique_id' is required."), 400

            if action == "mark_sent":
                # Deliberately explicit. An ask still open under a SENT
                # follow-up is a non-response; under a draft it is an
                # unfinished chase, and only the sender knows which.
                result = mark_follow_up_sent(unique_id, data.get("date_sent"))
                return make_response(status="success", data=result,
                                     message="Follow-up marked sent."), 200

            if action == "set_status":
                result = set_follow_up_status(unique_id, data.get("status"))
                return make_response(status="success", data=result,
                                     message="Status set."), 200

            if action == "update_follow_up":
                result = update_follow_up(
                    unique_id,
                    subject=data.get("subject"),
                    body_markdown=data.get("body_markdown"),
                    generated_at=data.get("generated_at"),
                )
                return make_response(status="success", data=result,
                                     message="Follow-up updated."), 200

            if action == "set_next_contact":
                # contact_date absent/null clears the reminder entirely.
                result = set_next_contact(
                    unique_id,
                    contact_date=data.get("contact_date"),
                    note=data.get("note"),
                    person_ids=data.get("person_ids"),
                )
                return make_response(status="success", data=result,
                                     message="Next contact set."), 200

            if action == "link_reply":
                if not data.get("message_unique_id"):
                    return make_response(
                        status="error", error="'message_unique_id' is required."
                    ), 400
                result = link_reply_to_follow_up(
                    data["message_unique_id"], unique_id,
                    data.get("from_person_unique_id"),
                )
                return make_response(status="success", data=result,
                                     message="Reply linked."), 200

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
data_api_endpoints.add_url_rule(
    "/follow-ups/replies/<string:replies_follow_up_id>", view_func=follow_ups_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/follow-ups/board", view_func=follow_ups_view, methods=["GET"],
    defaults={"board": True},
)
# Writes
data_api_endpoints.add_url_rule("/follow-ups", view_func=follow_ups_view, methods=["POST", "PUT"])
