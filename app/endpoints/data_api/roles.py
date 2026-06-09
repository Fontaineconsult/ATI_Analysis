"""
HTTP endpoint for the seeded Role nodes (read-only).

Roles are the capacities people provide — what a person *does* (the verb), seeded from
the AMM role-categories (app/database/tools/seed_roles.py). This endpoint feeds the
Person "Roles" editor and the implementation "Participants" control with role options.
People *hold* roles (with position-description tracking) and *participate* in work in
their roles — those edges are managed on the individuals / implementation endpoints,
not here. No CRUD beyond GET (roles are seeded, not user-created).

URL surface (mounted at /ati/data-api/v1):
    GET /roles            list (each with its capacity description)
    GET /roles/<handle>   one role
"""
from flask.views import MethodView

from app.database.queries.roles.read import get_all_roles, get_role
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

from . import data_api_endpoints
from .util.response import make_response


class RolesAPI(MethodView):
    def get(self, handle=None):
        try:
            if handle:
                return make_response(status="success", data=get_role(handle)), 200
            return make_response(status="success", data={"items": get_all_roles()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


roles_view = RolesAPI.as_view("roles_api")
data_api_endpoints.add_url_rule("/roles", view_func=roles_view, methods=["GET"])
data_api_endpoints.add_url_rule("/roles/<path:handle>", view_func=roles_view, methods=["GET"])
