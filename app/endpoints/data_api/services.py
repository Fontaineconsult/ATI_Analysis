"""
Read-only, admin-only view of app/services: what is registered and whether each
service can run on this server.

Checked fresh on every request (path lookups only; nothing is run). An incomplete
configuration is reported as a problem on that service, never as an error, so this
endpoint answers 200 whatever state the services are in.

URL surface (mounted at /ati/data-api/v1):
    GET /services  ->  { status, data: { checked_at, services: [...] } }
"""
from flask.views import MethodView

from app.auth.guard import require_admin

from . import data_api_endpoints
from .util.response import make_response


class ServicesAPI(MethodView):
    def get(self):
        denied = require_admin()
        if denied is not None:
            return denied
        try:
            from app.services.registry import describe_services
            data = describe_services()
        except Exception as e:  # noqa: BLE001 - report it; never 500 on configuration
            data = {"checked_at": None, "services": [],
                    "problem": f"Could not read the service registry: {e}"}
        return make_response(status="success", data=data), 200


services_view = ServicesAPI.as_view("services_api")
data_api_endpoints.add_url_rule("/services", view_func=services_view, methods=["GET"])
