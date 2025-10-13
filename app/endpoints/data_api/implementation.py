from flask import request
from flask.views import MethodView
from app.database.queries.implementation.create import add_plan

from . import data_api_endpoints
from ...database.queries.implementation.delete import unassign_person_as_implementor
from ...database.queries.implementation.update import update_plan, assign_person_as_implementor, \
    assign_documentation_to_implementation
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import ApiError, ValidationError, CrudError, NotFoundError

class ImplementationAPI(MethodView):

    """
    GET /implementations
    -------------------
    Retrieve a specific implementation by type and title.

    Query Parameters:
        implementation_type (str, required): One of [Process, Project, Procedure,
                                            Service, Guidance, Tracking, InternalPolicy]
        title (str, required): Title of the implementation to retrieve

    Returns:
        200: {
            "status": "success",
            "data": {
                "unique_id": str,
                "title": str,
                "description": str,
                "type": str
            }
        }
        400: {"status": "error", "error": "Both 'implementation_type' and 'title' are required"}
        404: {"status": "error", "error": "No {type} found with title: {title}"}


    POST /implementations
    --------------------
    Create a new implementation node.

    Request Body:
        {
            "action": "add_implementation",
            "implementation_type": str,  # One of valid types
            "title": str,                # Required, unique within type
            "description": str            # Required
        }

    Returns:
        201: {"status": "success", "message": "{type} created successfully"}
        400: {"status": "error", "error": "Missing required fields..."}
        500: {"status": "error", "error": "Failed to create {type}"}


    PUT /implementations
    -------------------
    Perform various update operations on implementations.

    Actions:

    1. update_implementation - Update title/description
       {
           "action": "update_implementation",
           "implementation_type": str,
           "unique_id": str,           # Required
           "title": str,                # Optional
           "description": str           # Optional
       }
       Returns: 200 | 404

    2. assign_person_as_implementor - Link person to YSE
       {
           "action": "assign_person_as_implementor",
           "unique_id": str,            # Person UUID
           "year_success_evidence": str  # YSE identifier
       }
       Returns: 200 | 400 | 404

    3. unassign_person_as_implementor - Remove person-YSE link
       {
           "action": "unassign_person_as_implementor",
           "unique_id": str,
           "year_success_evidence": str
       }
       Returns: 200 | 400 | 404

    4. assign_documentation_to_implementation - Link docs to implementation
       {
           "action": "assign_documentation_to_implementation",
           "implementation_id": str,
           "implementation_type": str,
           "documentation_type": str,    # [document, webpage, message, note, metric]
           "documentation_id": str
       }
       Returns: 200 | 400 | 404


    DELETE /implementations
    ----------------------
    Not implemented (returns 405)
    """


    def get(self):
        """
        Handle GET requests to fetch implementation nodes.
        """
        try:
            from app.database.class_factory import implementation_classes

            # Check if requesting all implementations
            all_param = request.args.get('all')

            if all_param and all_param.lower() == 'true':
                from app.database.queries.implementation.read import get_all_implementations
                try:
                    implementations = get_all_implementations()
                    return make_response({"status": "success", "data": implementations}), 200
                except CrudError as e:
                    return make_response({"status": "error", "error": str(e)}), 500

            # Get query parameters
            implementation_type = request.args.get('implementation_type')
            title = request.args.get('title')

            # If only type provided, get all of that type
            if implementation_type and not title:
                from app.database.queries.implementation.read import get_all_implementations_by_type
                try:
                    implementations = get_all_implementations_by_type(implementation_type)
                    return make_response({"status": "success", "data": implementations}), 200
                except ValidationError as e:
                    return make_response({"status": "error", "error": str(e)}), 400
                except CrudError as e:
                    return make_response({"status": "error", "error": str(e)}), 500

            # Both type and title required for single implementation
            if not implementation_type or not title:
                return make_response({"status": "error", "error": "Both 'implementation_type' and 'title' are required for single implementation fetch"}), 400

            # Validate implementation type
            if implementation_type not in implementation_classes:
                return make_response({"status": "error", "error": f"Invalid implementation_type: {implementation_type}"}), 400

            # Get the implementation class and query for the node
            implementation_class = implementation_classes[implementation_type]

            try:
                implementation_node = implementation_class.nodes.get(title=title)

                # Serialize the node data
                node_data = {
                    "unique_id": implementation_node.unique_id,
                    "title": implementation_node.title,
                    "description": implementation_node.description,
                    "type": implementation_type
                }

                return make_response({"status": "success", "data": node_data}), 200

            except implementation_class.DoesNotExist:
                raise NotFoundError(f"No {implementation_type} found with title: {title}")

        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to fetch implementation: {str(e)}"}), 500

    def post(self):
        """
        Handle POST requests to create new implementation nodes.

        Example payload:
        {
            "action": "add_implementation",
            "implementation_type": "Process",  // Must be one of: Process, Project, Procedure, Service, Guidance, Tracking, InternalPolicy
            "title": "New Process Title",
            "description": "Description of the process"
        }
        """
        try:
            data = request.get_json()
            action = data.get('action')

            if not action:
                return make_response({"status": "error", "error": "Missing 'action' field in request."}), 400

            if action == "add_implementation":
                return self.handle_add_implementation(data)
            else:
                return make_response({"status": "error", "error": f"Unknown action '{action}' in request."}), 400

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": "Failed to process request"}), 500

    def handle_add_implementation(self, data):
        from app.database.queries.implementation.create import (
            add_process, add_guidance, add_project, add_procedure,
            add_service, add_tracking, add_internal_policy
        )
        from app.database.queries.evidence.update import assign_implementation_to_year_success_indicator
        from app.database.class_factory import implementation_types

        implementation_type = data.get('implementation_type')
        title = data.get('title')
        description = data.get('description')
        year_success_identifier = data.get('year_success_identifier')  # Get YSE identifier

        if not all([implementation_type, title, description]):
            raise ValidationError("Missing required fields: 'implementation_type', 'title', or 'description'")

        if implementation_type not in implementation_types:
            raise ValidationError(f"Invalid implementation_type: {implementation_type}")

        creation_functions = {
            "Process": add_process,
            "Project": add_project,
            "Procedure": add_procedure,
            "Service": add_service,
            "Guidance": add_guidance,
            "Tracking": add_tracking,
            "InternalPolicy": add_internal_policy
        }

        creation_function = creation_functions.get(implementation_type)
        if creation_function:
            success = creation_function(title=title, description=description)
            if success:
                # Auto-assign if YSE identifier provided
                if year_success_identifier:
                    try:
                        assign_implementation_to_year_success_indicator(
                            year_success_identifier,
                            implementation_type,
                            title
                        )
                        return make_response({"status": "success", "message": f"{implementation_type} created and assigned"}), 201
                    except Exception as e:
                        return make_response({"status": "partial_success", "message": f"{implementation_type} created but assignment failed: {str(e)}"}), 201

                return make_response({"status": "success", "message": f"{implementation_type} created successfully"}), 201
            else:
                return make_response({"status": "error", "error": f"Failed to create {implementation_type}"}), 500
        else:
            raise CrudError(f"No creation function found for implementation_type: {implementation_type}")

    def put(self):
        """
        Handle PUT requests for different actions based on the "action" key in the payload.

        Example payloads:

        For assigning a person as implementor:
        {
            "action": "assign_person_as_implementor",
            "unique_id": "person-unique-id",
            "year_success_evidence": "2023-2024-1.2-web"
        }

        For unassigning a person as implementor:
        {
            "action": "unassign_person_as_implementor",
            "unique_id": "person-unique-id",
            "year_success_evidence": "2023-2024-1.2-web"
        }

        For updating implementation details:
        {
            "action": "update_implementation",
            "implementation_type": "Process",
            "unique_id": "implementation-unique-id",
            "title": "Updated Title",
            "description": "Updated Description"
        }
        """
        try:
            data = request.get_json()
            action = data.get('action')
            if not action:
                return make_response({"status": "error", "error": "Missing 'action' field in request."}), 400

            if action == "assign_person_as_implementor":
                return self.handle_assign_person_as_implementor(data)
            elif action == "unassign_person_as_implementor":
                return self.handle_unassign_person_as_implementor(data)
            elif action == "assign_documentation_to_implementation":
                return self.handle_assign_documentation_to_implementation(data)
            elif action == "update_implementation":
                return self.handle_update_implementation(data)
            elif action == "assign_implementation_to_yse":
                return self.handle_assign_implementation_to_yse(data)
            else:
                return make_response({"status": "error", "error": f"Unknown action '{action}' in request."}), 400

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": "Failed to process request"}), 500

    def handle_assign_implementation_to_yse(self, data):
        from app.database.queries.evidence.update import assign_implementation_to_year_success_indicator

        required = ['year_success_identifier', 'implementation_type', 'implementation_title']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")

        assign_implementation_to_year_success_indicator(
            data['year_success_identifier'],
            data['implementation_type'],
            data['implementation_title']
        )
        return make_response({"status": "success", "message": "Implementation assigned to YSE"}), 200

    def handle_update_implementation(self, data):
        """
        Handle updating implementation title and description.
        """
        from app.database.class_factory import implementation_classes

        implementation_type = data.get('implementation_type')
        unique_id = data.get('unique_id')
        title = data.get('title')
        description = data.get('description')

        if not implementation_type or not unique_id:
            raise ValidationError("Missing required fields: 'implementation_type' and 'unique_id'")

        if not title and not description:
            raise ValidationError("At least one field to update is required: 'title' or 'description'")

        if implementation_type not in implementation_classes:
            raise ValidationError(f"Invalid implementation_type: {implementation_type}")

        try:
            implementation_class = implementation_classes[implementation_type]
            implementation_node = implementation_class.nodes.get(unique_id=unique_id)

            if title:
                implementation_node.title = title
            if description:
                implementation_node.description = description

            implementation_node.save()

            return make_response({"status": "success", "message": f"{implementation_type} updated successfully"}), 200

        except implementation_class.DoesNotExist:
            raise NotFoundError(f"No {implementation_type} found with unique_id: {unique_id}")

    def handle_assign_person_as_implementor(self, data):
        if 'unique_id' not in data or 'year_success_evidence' not in data:
            raise ValidationError("Missing required fields: 'unique_id' or 'year_success_evidence'")

        assign_person_as_implementor(data['unique_id'], data['year_success_evidence'])
        return make_response({"status": "success", "message": "Person assigned as implementor successfully"}), 200

    def handle_unassign_person_as_implementor(self, data):
        """
        Handle the unassign_person_as_implementor action.
        """
        if 'unique_id' not in data or 'year_success_evidence' not in data:
            raise ValidationError("Missing required fields: 'unique_id' or 'year_success_evidence'")

        unassign_person_as_implementor(data['unique_id'], data['year_success_evidence'])
        return make_response({"status": "success", "message": "Person unassigned as implementor successfully"}), 200

    def handle_assign_documentation_to_implementation(self, data):
        """
        Handle the assign_documentation_to_implementation action.
        """
        required_fields = ['implementation_id', 'implementation_type', 'documentation_type', 'documentation_id']
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"Missing required field: '{field}'")

        assign_documentation_to_implementation(
            implementation_id=data['implementation_id'],
            implementation_type=data['implementation_type'],
            documentation_type=data['documentation_type'],
            documentation_id=data['documentation_id']
        )
        return make_response({"status": "success", "message": "Documentation assigned to implementation successfully"}), 200


class ImplementationPlanAPI(MethodView):
    """
    Enhanced API endpoints for managing Plan nodes.
    """

    def get(self):
        """
        Handle GET requests to fetch plan nodes.

        Query Parameters:
            - all (bool): If 'true', returns all plans
            - unique_id (str): Get specific plan by ID
            - name (str): Get specific plan by name
            - academic_year (str): Filter by academic year
            - is_key_plan (bool): Filter by key plan status
            - is_campus_plan (bool): Filter by campus plan status
            - abandoned (bool): Filter by abandoned status
        """
        try:
            from app.database.graph_schema import Plan, AcademicYear

            # Check if requesting all plans
            all_param = request.args.get('all')

            if all_param and all_param.lower() == 'true':
                plans = Plan.nodes.all()
                data = [plan.serialize() for plan in plans]
                return make_response({"status": "success", "data": data}), 200

            # Get by unique_id
            unique_id = request.args.get('unique_id')
            if unique_id:
                try:
                    plan = Plan.nodes.get(unique_id=unique_id)
                    return make_response({"status": "success", "data": plan.serialize()}), 200
                except Plan.DoesNotExist:
                    raise NotFoundError(f"No plan found with unique_id: {unique_id}")

            # Get by name
            name = request.args.get('name')
            if name:
                try:
                    plan = Plan.nodes.get(name=name)
                    return make_response({"status": "success", "data": plan.serialize()}), 200
                except Plan.DoesNotExist:
                    raise NotFoundError(f"No plan found with name: {name}")

            # Filter by various criteria
            filters = {}

            # Boolean filters
            is_key_plan = request.args.get('is_key_plan')
            if is_key_plan is not None:
                filters['is_key_plan'] = is_key_plan.lower() == 'true'

            is_campus_plan = request.args.get('is_campus_plan')
            if is_campus_plan is not None:
                filters['is_campus_plan'] = is_campus_plan.lower() == 'true'

            abandoned = request.args.get('abandoned')
            if abandoned is not None:
                filters['abandoned'] = abandoned.lower() == 'true'

            # Apply filters if any
            if filters:
                plans = Plan.nodes.filter(**filters)
                data = [plan.serialize() for plan in plans]
                return make_response({"status": "success", "data": data}), 200

            # Filter by academic year
            academic_year = request.args.get('academic_year')
            if academic_year:
                try:
                    year = AcademicYear.nodes.get(name=academic_year)
                    plans = year.plan_set.all()
                    data = [plan.serialize() for plan in plans]
                    return make_response({"status": "success", "data": data}), 200
                except AcademicYear.DoesNotExist:
                    raise NotFoundError(f"No academic year found with name: {academic_year}")

            # If no parameters provided, return error
            return make_response({"status": "error", "error": "Please provide query parameters"}), 400

        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to fetch plans: {str(e)}"}), 500


    def post(self):
        """
        Handle POST requests to create a new implementation plan.
        The expected payload should be in the following format:
        {
            "name": "Plan Name",
            "description": "Plan description",
            "academic_year_name": "2023-2024",
            "is_key_plan": true,
            "is_campus_plan": false,
            "plan_status": "In Progress",
            "abandoned": false,
            "abandoned_notes": "Optional notes",
            "completed_year_name": "Optional completed year",
            "furthered_goal_number": 1,
            "furthered_working_group": "Working Group Name",
            "furthered_yse_identifier": "2023-2024-1.2-web"
        }
        """
        try:
            # Extract JSON data from the request
            data = request.get_json()

            # Ensure required fields are present
            required_fields = ['name', 'description', 'academic_year_name']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"Missing required field: '{field}'")

            # Call the add_plan function with the received data
            add_plan(data)

            # Return a success response
            return make_response({"status": "success", "message": "Plan added successfully"}), 201

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": "Failed to add plan"}), 500


    def put(self):
        """
        Handle PUT requests for different actions based on the "action" key in the payload.

        Example payloads:

        For updating a plan:
        {
            "action": "update_plan",
            "unique_id": "UUID of the plan",
            "name": "Updated Plan Name",
            "description": "Updated plan description",
            ...
        }
        """
        try:
            # Extract JSON data from the request
            data = request.get_json()

            # Retrieve action from data
            action = data.get('action')
            if not action:
                return make_response({"status": "error", "error": "Missing 'action' field in request."}), 400

            # Handle different actions
            if action == "update_plan":
                return self.handle_update_plan(data)
            else:
                return make_response({"status": "error", "error": f"Unknown action '{action}' in request."}), 400

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": "Failed to process request"}), 500

    def handle_update_plan(self, data):
        """
        Handle the update_plan action.
        """
        # Ensure required field 'unique_id' is present
        if 'unique_id' not in data:
            raise ValidationError("Missing required field: 'unique_id'")

        # Call the update_plan function
        update_plan(data)

        return make_response({"status": "success", "message": "Plan updated successfully"}), 200

    def delete(self):
        """
        Handle DELETE requests to remove a plan.

        Request Body:
            {
                "unique_id": str (required)
            }
        """
        try:
            from app.database.graph_schema import Plan

            data = request.get_json()

            # Validate required field
            unique_id = data.get('unique_id')
            if not unique_id:
                raise ValidationError("Missing required field: 'unique_id'")

            try:
                plan = Plan.nodes.get(unique_id=unique_id)
                plan.delete()
                return make_response({"status": "success", "message": "Plan deleted successfully"}), 200
            except Plan.DoesNotExist:
                raise NotFoundError(f"No plan found with unique_id: {unique_id}")

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to delete plan: {str(e)}"}), 500


class ImplementationAccomplishmentAPI(MethodView):
    """
    API endpoints for managing Accomplishment nodes.

    GET /implementations/accomplishments
    ------------------------------------
    Retrieve accomplishment(s) by various criteria.

    Query Parameters:
        - all (bool): If 'true', returns all accomplishments
        - unique_id (str): Get specific accomplishment by ID
        - academic_year (str): Filter by academic year
        - name (str): Get specific accomplishment by name

    Returns:
        200: {"status": "success", "data": accomplishment(s)}
        404: {"status": "error", "error": "Accomplishment not found"}


    POST /implementations/accomplishments
    -------------------------------------
    Create a new accomplishment.

    Request Body:
        {
            "name": str (required),
            "description": str (required),
            "academic_year": str (required),
            "advanced_goal_number": int (optional),
            "working_group": str (optional),
            "furthered_yse_identifier": str (optional)
        }

    Returns:
        201: {"status": "success", "message": "Accomplishment created successfully"}
        400: {"status": "error", "error": "Missing required fields"}
        500: {"status": "error", "error": "Failed to create accomplishment"}


    PUT /implementations/accomplishments
    ------------------------------------
    Update an existing accomplishment.

    Request Body:
        {
            "action": "update_accomplishment",
            "unique_id": str (required),
            "name": str (optional),
            "description": str (optional),
            "academic_year": str (optional),
            "advanced_goal_number": int (optional),
            "working_group": str (optional),
            "furthered_yse_identifier": str (optional)
        }

    Returns:
        200: {"status": "success", "message": "Accomplishment updated successfully"}
        404: {"status": "error", "error": "Accomplishment not found"}


    DELETE /implementations/accomplishments
    ---------------------------------------
    Delete an accomplishment.

    Request Body:
        {
            "unique_id": str (required)
        }

    Returns:
        200: {"status": "success", "message": "Accomplishment deleted successfully"}
        404: {"status": "error", "error": "Accomplishment not found"}
    """

    def get(self):
        """
        Handle GET requests to fetch accomplishment nodes.
        """
        try:
            from app.database.graph_schema import Accomplishment, AcademicYear

            # Check if requesting all accomplishments
            all_param = request.args.get('all')

            if all_param and all_param.lower() == 'true':
                accomplishments = Accomplishment.nodes.all()
                data = [acc.serialize() for acc in accomplishments]
                return make_response({"status": "success", "data": data}), 200

            # Get by unique_id
            unique_id = request.args.get('unique_id')
            if unique_id:
                try:
                    accomplishment = Accomplishment.nodes.get(unique_id=unique_id)
                    return make_response({"status": "success", "data": accomplishment.serialize()}), 200
                except Accomplishment.DoesNotExist:
                    raise NotFoundError(f"No accomplishment found with unique_id: {unique_id}")

            # Get by name
            name = request.args.get('name')
            if name:
                try:
                    accomplishment = Accomplishment.nodes.get(name=name)
                    return make_response({"status": "success", "data": accomplishment.serialize()}), 200
                except Accomplishment.DoesNotExist:
                    raise NotFoundError(f"No accomplishment found with name: {name}")

            # Filter by academic year
            academic_year = request.args.get('academic_year')
            if academic_year:
                try:
                    year = AcademicYear.nodes.get(name=academic_year)
                    accomplishments = year.accomplishment_set.all()
                    data = [acc.serialize() for acc in accomplishments]
                    return make_response({"status": "success", "data": data}), 200
                except AcademicYear.DoesNotExist:
                    raise NotFoundError(f"No academic year found with name: {academic_year}")

            # If no parameters provided, return error
            return make_response({"status": "error", "error": "Please provide query parameters"}), 400

        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to fetch accomplishments: {str(e)}"}), 500

    def post(self):
        """
        Handle POST requests to create a new accomplishment.
        """
        try:
            from app.database.queries.implementation.create import add_accomplishment

            data = request.get_json()

            # Validate required fields
            required_fields = ['name', 'description', 'academic_year']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"Missing required field: '{field}'")

            # Call the add_accomplishment function
            success = add_accomplishment(
                name=data['name'],
                description=data['description'],  # Fixed from accomplishment_description
                academic_year=data['academic_year'],
                advanced_goal_number=data.get('advanced_goal_number'),
                working_group=data.get('working_group'),
                furthered_yse_identifier=data.get('furthered_yse_identifier')
            )

            if success:
                return make_response({"status": "success", "message": "Accomplishment created successfully"}), 201
            else:
                raise CrudError("Failed to create accomplishment")

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to create accomplishment: {str(e)}"}), 500

    def put(self):
        """
        Handle PUT requests to update an existing accomplishment.
        """
        try:
            from app.database.queries.implementation.update import update_accomplishment

            data = request.get_json()

            # Check for action
            action = data.get('action')
            if not action:
                return make_response({"status": "error", "error": "Missing 'action' field"}), 400

            if action == "update_accomplishment":
                # Ensure unique_id is present
                if 'unique_id' not in data:
                    raise ValidationError("Missing required field: 'unique_id'")

                # Call the update function
                success = update_accomplishment(data)

                if success:
                    return make_response({"status": "success", "message": "Accomplishment updated successfully"}), 200
                else:
                    raise CrudError("Failed to update accomplishment")
            else:
                return make_response({"status": "error", "error": f"Unknown action: {action}"}), 400

        except ValidationError as e:
            return make_response({"status": "error", "error": str(e)}), 400
        except NotFoundError as e:
            return make_response({"status": "error", "error": str(e)}), 404
        except CrudError as e:
            return make_response({"status": "error", "error": str(e)}), 500
        except Exception as e:
            return make_response({"status": "error", "error": f"Failed to update accomplishment: {str(e)}"}), 500




# Register the views
implementations_view = ImplementationAPI.as_view('implementations_view')
plans_view = ImplementationPlanAPI.as_view('plans_view')
accomplishments_view = ImplementationAccomplishmentAPI.as_view('accomplishments_view')
data_api_endpoints.add_url_rule('/implementations', view_func=implementations_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/plans', view_func=plans_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/accomplishments', view_func=accomplishments_view, methods=['GET', 'POST', 'PUT', 'DELETE'])