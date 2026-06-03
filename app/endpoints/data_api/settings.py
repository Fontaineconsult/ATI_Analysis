"""
Read-only settings endpoint.

Surfaces the display vocabularies defined in app/data_config.py so the frontend can
fetch them at runtime instead of hardcoding its own copies. data_config.py stays the
single source of truth — edit a vocabulary there (and restart Flask) and the UI follows.

This endpoint is deliberately GET-only: it is not CRUD. The structural maps in
data_config that drive dispatch logic are not exposed (see PUBLIC_VOCABULARIES).

URL surface (mounted at /ati/data-api/v1):
    GET /settings   ->  { status, data: { <category>: <vocabulary>, ... } }
"""
from flask.views import MethodView

from app.data_config import PUBLIC_VOCABULARIES

from . import data_api_endpoints
from .util.response import make_response


class SettingsAPI(MethodView):
    def get(self):
        return make_response(status="success", data=PUBLIC_VOCABULARIES), 200


settings_view = SettingsAPI.as_view("settings_api")
data_api_endpoints.add_url_rule("/settings", view_func=settings_view, methods=["GET"])
