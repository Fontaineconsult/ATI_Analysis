"""
HTTP endpoints for IntellectualSource — a non-legal grounding (theory / scholarship) that a
Principle can `derives_from` alongside Governance.

URL surface (mounted at /ati/data-api/v1):

    GET    /intellectual-sources                one list
    GET    /intellectual-sources/<unique_id>    one source
    POST   /intellectual-sources                create (name required)
    PUT    /intellectual-sources                update (unique_id + fields)
    DELETE /intellectual-sources                delete (unique_id in body)
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.intellectual_sources.create import create_intellectual_source
from app.database.queries.intellectual_sources.read import (
    get_all_intellectual_sources,
    get_intellectual_source,
)
from app.database.queries.intellectual_sources.update import update_intellectual_source
from app.database.queries.intellectual_sources.delete import delete_intellectual_source
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


def _require(data: dict, *keys):
    missing = [k for k in keys if data.get(k) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")


class IntellectualSourcesAPI(MethodView):
    def get(self, unique_id=None):
        try:
            if unique_id:
                return make_response(status="success", data=get_intellectual_source(unique_id)), 200
            return make_response(status="success", data={"items": get_all_intellectual_sources()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "name")
            source = create_intellectual_source(data)
            return make_response(
                status="success",
                data={"item": source.serialize()},
                message="Intellectual source created.",
            ), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def put(self):
        try:
            data = request.get_json() or {}
            _require(data, "unique_id")
            item = update_intellectual_source(data["unique_id"], data)
            return make_response(status="success", data={"item": item}, message="Intellectual source updated."), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            _require(data, "unique_id")
            delete_intellectual_source(data["unique_id"])
            return make_response(status="success", data={"deleted": data["unique_id"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


intellectual_sources_view = IntellectualSourcesAPI.as_view("intellectual_sources_api")
data_api_endpoints.add_url_rule(
    "/intellectual-sources", view_func=intellectual_sources_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/intellectual-sources/<string:unique_id>", view_func=intellectual_sources_view, methods=["GET"]
)
