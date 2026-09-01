"""
HTTP endpoints for the central Documentation view.

URL surface (mounted at /ati/data-api/v1):

    GET /documentation                      every Document/Webpage/Note/Message/Metric
                                            with references, derived signals and a summary
        ?types=documents,webpages              restrict to some types (default: all five)
        ?include_text=true                     include raw_text / content (default: off)
    GET /documentation/<doc_type>/<unique_id>  one node, always with full text

This is a NEW route rather than an extension of documents.py, which is 495 lines
of action-dispatch serving a different contract: `GET /documents/<type>` returns a
bare array of serialize() dicts and has live callers. This one returns
{items, summary, meta}. Giving one URL two response shapes is how the two dead
routes in documents.py came about.

READ-ONLY BY DESIGN. There is deliberately no POST, PUT or DELETE here. The
Documentation view curates and reconciles records; creating, deleting and
re-pointing documentation stay with the surfaces that own the parent context
(the implementation explorer, the governance panel). Editing a node's own fields
is specified in the plan but is not part of this pass.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.documentation.read import (
    DOC_TYPES,
    get_documentation_collection,
    get_documentation_detail,
)
from app.endpoints.data_api.errors.custom_exceptions import (
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


def _truthy(value) -> bool:
    return str(value).lower() in ("true", "1", "yes")


def _parse_types(raw):
    """?types=documents,webpages -> ['documents', 'webpages']; blank -> None (all)."""
    if not raw:
        return None
    wanted = [t.strip() for t in raw.split(",") if t.strip()]
    return wanted or None


class DocumentationAPI(MethodView):
    def get(self, doc_type=None, unique_id=None):
        try:
            if doc_type and unique_id:
                item = get_documentation_detail(doc_type, unique_id)
                if item is None:
                    raise NotFoundError(
                        f"No {doc_type[:-1]} found with unique_id '{unique_id}'."
                    )
                return make_response(status="success", data=item), 200

            payload = get_documentation_collection(
                doc_types=_parse_types(request.args.get("types")),
                include_text=_truthy(request.args.get("include_text")),
            )
            # An empty collection is a valid answer, not a 404.
            return make_response(status="success", data=payload), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


documentation_view = DocumentationAPI.as_view("documentation_api")

data_api_endpoints.add_url_rule(
    "/documentation", view_func=documentation_view, methods=["GET"]
)
data_api_endpoints.add_url_rule(
    "/documentation/<string:doc_type>/<string:unique_id>",
    view_func=documentation_view, methods=["GET"],
)

# Exported for the tests, so a new type added to the read layer can't silently
# fall out of the documented URL surface above.
SUPPORTED_TYPES = DOC_TYPES
