import traceback

from flask import request
from flask.views import MethodView

from . import data_api_endpoints
from app.database.queries.governance.read import get_all_governance_items
from app.database.queries.governance.create import create_governance_item
from app.database.queries.governance.update import (
    update_governance_item,
    attach_document_to_governance,
    detach_document_from_governance,
    attach_webpage_to_governance,
    detach_webpage_from_governance,
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
        "documents": documents,
        "webpages": webpages,
    }


_ATTACH_DISPATCH = {
    "attach_document": (attach_document_to_governance, "document_unique_id"),
    "detach_document": (detach_document_from_governance, "document_unique_id"),
    "attach_webpage": (attach_webpage_to_governance, "webpage_unique_id"),
    "detach_webpage": (detach_webpage_from_governance, "webpage_unique_id"),
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


governance_view = GovernanceAPI.as_view('governance_view')
data_api_endpoints.add_url_rule(
    '/governance', view_func=governance_view, methods=['GET', 'POST', 'PUT', 'DELETE']
)
