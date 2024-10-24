from flask import request
from flask.views import MethodView

from . import data_api_endpoints
from app.database.queries.individuals.read import get_all_persons, get_person_by_employee_id
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


class IndividualsAPI(MethodView):
    def get(self):
        """
        Handle GET requests to fetch all persons or a specific person by employee_id.
        """
        try:
            # Retrieve the 'employee_id' from the query string
            employee_id = request.args.get('employee_id')

            # If no employee_id is provided, fetch all persons
            if not employee_id:
                all_persons = get_all_persons()
                serialized = [person.serialize() for person in all_persons]
                return make_response(status='success', data={'persons': serialized}), 200

            # Fetch person by employee_id
            person = get_person_by_employee_id(employee_id)
            return make_response(status='success', data={'person': person.serialize()}), 200

        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except Exception as e:
            return make_response(status='error', error=str(e)), 500

    def post(self):
        """
        Placeholder for POST requests.
        """
        return make_response(status="error", error="Not Implemented"), 405

    def put(self):
        """
        Placeholder for PUT requests.
        """
        return make_response(status="error", error="Not Implemented"), 405

    def delete(self):
        """
        Placeholder for DELETE requests.
        """
        return make_response(status="error", error="Not Implemented"), 405


# Register the view with the blueprint
individuals_view = IndividualsAPI.as_view('individuals_view')
data_api_endpoints.add_url_rule('/individuals', view_func=individuals_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
