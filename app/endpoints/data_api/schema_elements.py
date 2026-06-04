"""
HTTP endpoints for SchemaElement — stable handles for type-level elements of our own schema
(a node label, a relationship type, a field). The anchor the meta-layer points AT.

URL surface (mounted at /ati/data-api/v1):

    GET    /schema-elements                 list
    GET    /schema-elements/<handle>        one (incl. `shaped_by` backref)
    POST   /schema-elements                 create (element_kind + handle required)
    PUT    /schema-elements                 action-dispatch: update
    DELETE /schema-elements                 delete (handle in body)
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.schema_elements.create import create_schema_element
from app.database.queries.schema_elements.read import get_all_schema_elements, get_schema_element
from app.database.queries.schema_elements.update import update_schema_element
from app.database.queries.schema_elements.delete import delete_schema_element
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


class SchemaElementsAPI(MethodView):
    def get(self, handle=None):
        try:
            if handle:
                return make_response(status="success", data=get_schema_element(handle)), 200
            return make_response(status="success", data={"items": get_all_schema_elements()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "element_kind", "handle")
            element = create_schema_element(data["element_kind"], data)
            return make_response(
                status="success",
                data={"item": element.serialize()},
                message="Schema element created.",
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
            action = data.get("action", "update")
            if action == "update":
                _require(data, "handle")
                item = update_schema_element(data["handle"], data)
                return make_response(status="success", data={"item": item}, message="Schema element updated."), 200
            return make_response(status="error", error=f"Unknown action: {action}"), 400
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
            _require(data, "handle")
            delete_schema_element(data["handle"])
            return make_response(status="success", data={"deleted": data["handle"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


schema_elements_view = SchemaElementsAPI.as_view("schema_elements_api")
data_api_endpoints.add_url_rule(
    "/schema-elements", view_func=schema_elements_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/schema-elements/<path:handle>", view_func=schema_elements_view, methods=["GET"]
)
