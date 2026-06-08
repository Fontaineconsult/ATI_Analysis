"""
HTTP endpoint for the seven W3C AMM Dimension nodes (read-only).

Dimensions are a fixed, seeded controlled set (app/database/tools/seed_dimensions.py)
used to classify the four doing-implementations (Process/Project/Procedure/Service)
via classified_under. This endpoint feeds the Implementation Details multi-select with
the seven options plus their AMM definitions (for tooltips). No CRUD beyond GET — the
seven are seeded, not user-created.

URL surface (mounted at /ati/data-api/v1):
    GET /dimensions            list (the seven, each with its AMM description)
    GET /dimensions/<handle>   one dimension
"""
from flask.views import MethodView

from app.database.queries.dimensions.read import get_all_dimensions, get_dimension
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

from . import data_api_endpoints
from .util.response import make_response


class DimensionsAPI(MethodView):
    def get(self, handle=None):
        try:
            if handle:
                return make_response(status="success", data=get_dimension(handle)), 200
            return make_response(status="success", data={"items": get_all_dimensions()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


dimensions_view = DimensionsAPI.as_view("dimensions_api")
data_api_endpoints.add_url_rule("/dimensions", view_func=dimensions_view, methods=["GET"])
data_api_endpoints.add_url_rule("/dimensions/<path:handle>", view_func=dimensions_view, methods=["GET"])
