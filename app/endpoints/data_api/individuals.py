import json
import traceback
from tarfile import data_filter

from flask import request
from flask.views import MethodView

from . import data_api_endpoints
from app.database.queries.individuals.read import get_all_persons, get_person_by_employee_id
from app.database.queries.individuals.update import update_person_by_employee_id  # Import the update function
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError
from ...database.queries.individuals.create import add_person


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

                return make_response(status='success', data={'persons': json.loads(all_persons[0][0])}), 200

            # Fetch person by employee_id
            person = get_person_by_employee_id(employee_id)
            return make_response(status='success', data={'person': person.serialize()}), 200

        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=str(e)), 500

    def post(self):
        """
        Handle POST requests to add a new individual.
        """
        try:
            # Parse the incoming request data
            data = request.get_json()
            if not data:
                raise ValidationError("Request body must be JSON.")

            if data['action'] == 'add_person':

                # Call the add_person function to create a new person
                new_person = add_person(data)

                return make_response(status="success", data={'person': new_person.serialize()}), 201

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500


    def put(self):
        """
        Handle PUT requests to update an individual's information.
        """
        try:
            # Parse the incoming request data
            data = request.get_json()
            print(data)
            if data['action'] == 'update_person_by_employee_id':
                # Ensure 'employee_id' is provided in the request data
                employee_id = data.get('employee_id')
                if not employee_id:
                    raise ValidationError("Missing 'employee_id' in the request body.")

                # Call the update function to update the person and their working groups
                updated_person = update_person_by_employee_id(data)

                return make_response(status="success", data={'person': updated_person.serialize()}), 200

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def delete(self):
        """
        Placeholder for DELETE requests.
        """
        return make_response(status="error", error="Not Implemented"), 405


# Register the view with the blueprint
individuals_view = IndividualsAPI.as_view('individuals_view')
data_api_endpoints.add_url_rule('/individuals', view_func=individuals_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
