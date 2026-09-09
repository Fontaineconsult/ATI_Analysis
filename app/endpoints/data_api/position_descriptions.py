"""
HTTP endpoint for PositionDescription nodes.

A PositionDescription is the record of a person's job: it holds the PD document(s)
(linked Document nodes) and notes about the position. Creation goes through
add_position_description in queries/individuals/create.py, which enforces the
required describes_position_of anchor to a Person. The person anchor is immutable
after creation; superseded PDs are marked depreciated, not re-anchored.

URL surface (mounted at /ati/data-api/v1):
    GET    /position-descriptions?employee_id=<id>   list a person's records, current first
    GET    /position-descriptions/<unique_id>        one record (with documents + notes)
    POST   /position-descriptions                    {action: add_position_description, ...} -> 201
    PUT    /position-descriptions/<unique_id>        {action: update_position_description, ...}
    DELETE /position-descriptions/<unique_id>        delete the record (linked docs/notes survive)
"""
import traceback

from flask import request
from flask.views import MethodView

from . import data_api_endpoints
from .util.response import make_response
from app.database.queries.individuals.create import add_position_description
from app.database.queries.individuals.read import (
    get_position_description,
    get_position_descriptions_for_person,
)
from app.database.queries.individuals.update import update_position_description
from app.database.queries.individuals.delete import delete_position_description
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError


class PositionDescriptionsAPI(MethodView):
    def get(self, unique_id=None):
        try:
            if unique_id:
                pd = get_position_description(unique_id)
                return make_response(status='success', data={'position_description': pd.serialize()}), 200

            employee_id = request.args.get('employee_id')
            if not employee_id:
                raise ValidationError("employee_id query parameter is required.")
            items = get_position_descriptions_for_person(employee_id)
            return make_response(status='success', data={'items': items}), 200

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=str(e)), 500

    def post(self):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Request body must be JSON.")

            if data.get('action') == 'add_position_description':
                pd = add_position_description(data)
                return make_response(status='success', data={'position_description': pd.serialize()}), 201

            raise ValidationError(f"Unknown action: {data.get('action')!r}")

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def put(self, unique_id):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Request body must be JSON.")

            if data.get('action') == 'update_position_description':
                pd = update_position_description(unique_id, data)
                return make_response(status='success', data={'position_description': pd.serialize()}), 200

            raise ValidationError(f"Unknown action: {data.get('action')!r}")

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def delete(self, unique_id):
        try:
            delete_position_description(unique_id)
            return make_response(status='success', data={'deleted': unique_id}), 200
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=str(e)), 500


position_descriptions_view = PositionDescriptionsAPI.as_view('position_descriptions_api')
data_api_endpoints.add_url_rule('/position-descriptions', view_func=position_descriptions_view,
                                methods=['GET', 'POST'])
data_api_endpoints.add_url_rule('/position-descriptions/<unique_id>', view_func=position_descriptions_view,
                                methods=['GET', 'PUT', 'DELETE'])
