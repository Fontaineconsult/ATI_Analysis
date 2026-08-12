import traceback

from flask import request
from flask.views import MethodView
from neomodel import db

from . import data_api_endpoints
from app.database.queries.governance.read import (
    get_all_governance_items,
    get_governance_link_targets,
    get_governance_for_indicator,
)
from app.database.queries.governance.create import create_governance_item
from app.database.queries.governance.update import (
    update_governance_item,
    attach_document_to_governance,
    detach_document_from_governance,
    attach_webpage_to_governance,
    detach_webpage_from_governance,
    attach_goal_to_governance,
    detach_goal_from_governance,
    attach_indicator_to_governance,
    detach_indicator_from_governance,
    update_governance_drives_indicator,
)
from app.database.queries.governance.delete import delete_governance_item
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _serialize_governance_node(governance_type, node):
    """Project a neomodel governance node into a JSON-friendly dict that
    matches the shape returned by get_all_governance_items()."""
    def _iso(d):
        return d.isoformat() if d is not None else None

    documents = []
    if hasattr(node, "source_documents"):
        for d in node.source_documents.all():
            documents.append({
                "unique_id": d.unique_id,
                "name": getattr(d, "name", None),
                "uri_path": getattr(d, "uri_path", None),
                "file_path": getattr(d, "file_path", None),
            })

    webpages = []
    if hasattr(node, "source_webpages"):
        for w in node.source_webpages.all():
            webpages.append({
                "unique_id": w.unique_id,
                "name": getattr(w, "name", None),
                "url": getattr(w, "url", None),
            })

    # Indicator-framework links. Kept shape-compatible with the `goals` /
    # `success_indicators` keys projected by get_all_governance_items(), because the
    # detail panel renders whichever of the two it happens to be holding.
    goals = []
    if hasattr(node, "informed_goals"):
        attached_goals = node.informed_goals.all()
        # One lookup for every attached goal's working group, rather than walking
        # every ATIWorkingGroup's goal list per goal.
        wg_by_goal = {}
        if attached_goals:
            rows, _ = db.cypher_query(
                """
                MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(g:Goal)
                WHERE g.unique_id IN $goal_ids
                RETURN g.unique_id AS goal_id, wg.name AS wg_name
                """,
                {"goal_ids": [g.unique_id for g in attached_goals]},
            )
            wg_by_goal = {goal_id: wg_name for goal_id, wg_name in rows}
        for g in attached_goals:
            goals.append({
                "unique_id": g.unique_id,
                "name": getattr(g, "name", None),
                "goal_number": getattr(g, "goal_number", None),
                "goal": getattr(g, "goal", None),
                "removed": bool(getattr(g, "removed", False)),
                "working_group": wg_by_goal.get(g.unique_id),
            })

    success_indicators = []
    if hasattr(node, "driven_success_indicators"):
        for si in node.driven_success_indicators.all():
            rel = node.driven_success_indicators.relationship(si)
            success_indicators.append({
                "unique_id": si.unique_id,
                "composite_key": getattr(si, "composite_key", None),
                "success_indicator": getattr(si, "success_indicator", None),
                "removed": bool(getattr(si, "removed", False)),
                "provision": getattr(rel, "provision", None) if rel else None,
                "quote": getattr(rel, "quote", None) if rel else None,
                "note": getattr(rel, "note", None) if rel else None,
                "added_date": _iso(getattr(rel, "added_date", None)) if rel else None,
            })

    return {
        "type": governance_type,
        "unique_id": node.unique_id,
        "title": getattr(node, "title", None),
        "description": getattr(node, "description", None),
        "effective_date": _iso(getattr(node, "effective_date", None)),
        "last_updated": _iso(getattr(node, "last_updated", None)),
        "authored_date": _iso(getattr(node, "authored_date", None)),
        "relevant_sections": getattr(node, "relevant_sections", None),
        "legislative_authority": getattr(node, "legislative_authority", None),
        "ruling": getattr(node, "ruling", None),
        "source_institution": getattr(node, "source_institution", None),
        "raw_text": getattr(node, "raw_text", None),
        "raw_text_captured": _iso(getattr(node, "raw_text_captured", None)),
        "documents": documents,
        "webpages": webpages,
        "goals": goals,
        "success_indicators": success_indicators,
    }


# Single-target attach/detach: (fn, payload key holding the target's unique_id).
_ATTACH_DISPATCH = {
    "attach_document": (attach_document_to_governance, "document_unique_id"),
    "detach_document": (detach_document_from_governance, "document_unique_id"),
    "attach_webpage": (attach_webpage_to_governance, "webpage_unique_id"),
    "detach_webpage": (detach_webpage_from_governance, "webpage_unique_id"),
    # informs -> Goal. Property-free, so it fits the simple dispatch.
    "attach_goal": (attach_goal_to_governance, "goal_unique_id"),
    "detach_goal": (detach_goal_from_governance, "goal_unique_id"),
    # drives -> SuccessIndicator, detach half only; the attach/update halves carry
    # DrivesRel qualifiers and are dispatched separately below.
    "detach_indicator": (detach_indicator_from_governance, "indicator_unique_id"),
}

# drives -> SuccessIndicator, attach/update halves. These take the citation
# (provision / quote / note) alongside the target id, so they need the request
# body rather than a single extracted key.
_DRIVES_DISPATCH = {
    "attach_indicator": attach_indicator_to_governance,
    "update_indicator_citation": update_governance_drives_indicator,
}


class GovernanceAPI(MethodView):
    def get(self):
        try:
            items = get_all_governance_items()
            return make_response(status="success", data={"items": items}), 200
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            governance_type = data.get("type")
            if not governance_type:
                raise ValidationError("'type' is required.")
            node = create_governance_item(governance_type, data)
            return make_response(
                status="success",
                data={"item": _serialize_governance_node(governance_type, node)},
            ), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except CrudError as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def put(self):
        try:
            data = request.get_json() or {}
            governance_type = data.get("type")
            if not governance_type:
                raise ValidationError("'type' is required.")

            # Attach/detach dispatch: takes governance_unique_id + target id.
            action = data.get("action")
            if action in _ATTACH_DISPATCH:
                fn, target_key = _ATTACH_DISPATCH[action]
                governance_unique_id = data.get("governance_unique_id")
                target_unique_id = data.get(target_key)
                if not governance_unique_id:
                    raise ValidationError("'governance_unique_id' is required.")
                if not target_unique_id:
                    raise ValidationError(f"'{target_key}' is required.")
                node = fn(governance_type, governance_unique_id, target_unique_id)
                return make_response(
                    status="success",
                    data={"item": _serialize_governance_node(governance_type, node)},
                ), 200

            # drives -> SuccessIndicator: same shape plus the DrivesRel citation,
            # which is passed through as the whole body so present-but-empty (clear)
            # stays distinguishable from absent (leave alone).
            if action in _DRIVES_DISPATCH:
                governance_unique_id = data.get("governance_unique_id")
                indicator_unique_id = data.get("indicator_unique_id")
                if not governance_unique_id:
                    raise ValidationError("'governance_unique_id' is required.")
                if not indicator_unique_id:
                    raise ValidationError("'indicator_unique_id' is required.")
                node = _DRIVES_DISPATCH[action](
                    governance_type, governance_unique_id, indicator_unique_id, data
                )
                return make_response(
                    status="success",
                    data={"item": _serialize_governance_node(governance_type, node)},
                ), 200

            # Generic field update path.
            unique_id = data.get("unique_id")
            if not unique_id:
                raise ValidationError("'unique_id' is required.")
            node = update_governance_item(governance_type, unique_id, data)
            return make_response(
                status="success",
                data={"item": _serialize_governance_node(governance_type, node)},
            ), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            governance_type = data.get("type")
            unique_id = data.get("unique_id")
            if not governance_type:
                raise ValidationError("'type' is required.")
            if not unique_id:
                raise ValidationError("'unique_id' is required.")
            delete_governance_item(governance_type, unique_id)
            return make_response(status="success", data={"deleted": unique_id}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500


class GovernanceLinkTargetsAPI(MethodView):
    """The candidate pool for the two governance -> indicator-framework edges.

    Its own route rather than a query param on /governance because it returns
    framework reference data (goals + indicators), not governance items — and the
    frontend fetches it once for the picker, independent of which instrument is
    selected.
    """

    def get(self):
        try:
            return make_response(status="success", data=get_governance_link_targets()), 200
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500


governance_view = GovernanceAPI.as_view('governance_view')
data_api_endpoints.add_url_rule(
    '/governance', view_func=governance_view, methods=['GET', 'POST', 'PUT', 'DELETE']
)

class GovernanceForIndicatorAPI(MethodView):
    """The authority behind one indicator, for the dashboard's indicator view.

    The inverse reading direction of /governance. Writes still go through the
    /governance PUT actions — it is the same edge, only authored from the other end,
    so there is no second write path to keep in step.
    """

    def get(self, composite_key):
        try:
            # ?candidates=1 opts into the picker pool (~93% of the payload). The panel
            # starts collapsed and asks for it only on first expand.
            include_candidates = request.args.get("candidates") in ("1", "true", "yes")
            return make_response(
                status="success",
                data=get_governance_for_indicator(composite_key, include_candidates),
            ), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500


governance_link_targets_view = GovernanceLinkTargetsAPI.as_view('governance_link_targets_view')
data_api_endpoints.add_url_rule(
    '/governance/link-targets', view_func=governance_link_targets_view, methods=['GET']
)

governance_for_indicator_view = GovernanceForIndicatorAPI.as_view('governance_for_indicator_view')
data_api_endpoints.add_url_rule(
    '/governance/for-indicator/<path:composite_key>',
    view_func=governance_for_indicator_view, methods=['GET']
)
