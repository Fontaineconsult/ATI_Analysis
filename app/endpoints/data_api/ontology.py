"""
HTTP endpoint for the assembled ontology (read-only).

Feeds the frontend ontology browser the same structure the MCP server exposes — the
node types / fields / field values / relationship types of the schema, joined to their
UniversalDescriptor prose and the Principles that shape them, plus a drift + coverage
health report. Both come straight from the shared engine
(app/database/queries/ontology/read.py), so the browser, the MCP tools, and any script
agree on one ontology.

URL surface (mounted at /ati/data-api/v1):
    GET /ontology          the full assembled ontology
    GET /ontology/health   description coverage + drift (undescribed elements, orphan
                           descriptors, ungrounded / inert principles)
"""
from flask.views import MethodView

from app.database.queries.ontology.read import assemble_ontology, ontology_health

from . import data_api_endpoints
from .util.response import make_response


class OntologyAPI(MethodView):
    def get(self, view=None):
        try:
            if view == "health":
                return make_response(status="success", data=ontology_health()), 200
            return make_response(status="success", data=assemble_ontology()), 200
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


ontology_view = OntologyAPI.as_view("ontology_api")
data_api_endpoints.add_url_rule("/ontology", view_func=ontology_view, methods=["GET"])
data_api_endpoints.add_url_rule("/ontology/health", view_func=ontology_view,
                                defaults={"view": "health"}, methods=["GET"])
