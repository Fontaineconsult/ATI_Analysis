from flask import request
from flask.views import MethodView
from app.database.queries.implementation.create import add_plan

from . import data_api_endpoints
from ...database.queries.implementation.delete import unassign_person_as_implementor
from ...database.queries.implementation.update import update_plan, assign_person_as_implementor, \
    assign_documentation_to_implementation, add_progress_note_to_plan, \
    assign_person_as_owner, unassign_person_as_owner, \
    assign_accountable_working_group, unassign_accountable_working_group, \
    set_implementation_dimensions, set_implementation_participants, \
    assign_plan_to_campus, unassign_plan_from_campus, \
    attach_plan_to_yse, detach_plan_from_yse
from ...database.queries.implementation.read import get_plan_campuses, get_plan_yses
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import ApiError, ValidationError, CrudError, NotFoundError
from app.database.graph_schema import serialize_participants, serialize_applied_assets

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
            academic_year = request.args.get('academic_year')  # Optional filter

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

                # Build comprehensive node data
                node_data = {
                    "unique_id": implementation_node.unique_id,
                    "title": implementation_node.title,
                    "description": implementation_node.description,
                    "type": implementation_type,
                    "supporting_documents": [],
                    "supporting_webpages": [],
                    "supporting_notes": [],
                    "supporting_messages": [],
                    "supporting_metrics": [],
                    "dimensions": [
                        {"handle": d.handle, "name": d.name}
                        for d in implementation_node.classified_under.all()
                    ] if hasattr(implementation_node, "classified_under") else [],
                    "participants": serialize_participants(implementation_node) if hasattr(implementation_node, "participants") else [],
                    "assets": serialize_applied_assets(implementation_node) if hasattr(implementation_node, "remediates_interface") else [],
                }

                # Helper function to check if doc should be included for specific year
                def should_include_for_year(rel, year):
                    if not year or not rel:
                        return True
                    included = rel.included_in_years or []
                    excluded = rel.excluded_from_years or []
                    if not included and not excluded:
                        return True
                    return year in included and year not in excluded

                # Add supporting documents with relationship data
                for doc in implementation_node.supporting_documents.all():
                    rel = implementation_node.supporting_documents.relationship(doc)
                    if academic_year and not should_include_for_year(rel, academic_year):
                        continue

                    doc_data = {
                        'unique_id': doc.unique_id,
                        'name': doc.name,
                        'file_path': doc.file_path,
                        'include_in_report': doc.include_in_report,
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None
                        }
                    }
                    node_data['supporting_documents'].append(doc_data)

                # Add supporting webpages with relationship data
                for wp in implementation_node.supporting_webpages.all():
                    rel = implementation_node.supporting_webpages.relationship(wp)
                    if academic_year and not should_include_for_year(rel, academic_year):
                        continue

                    wp_data = {
                        'unique_id': wp.unique_id,
                        'name': wp.name,
                        'url': wp.url,
                        'include_in_report': wp.include_in_report,
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None
                        }
                    }
                    node_data['supporting_webpages'].append(wp_data)

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
            elif action == "assign_person_as_owner":
                return self.handle_assign_person_as_owner(data)
            elif action == "unassign_person_as_owner":
                return self.handle_unassign_person_as_owner(data)
            elif action == "assign_accountable_working_group":
                return self.handle_assign_accountable_working_group(data)
            elif action == "unassign_accountable_working_group":
                return self.handle_unassign_accountable_working_group(data)
            elif action == "set_dimensions":
                return self.handle_set_dimensions(data)
            elif action == "set_participants":
                return self.handle_set_participants(data)
            elif action == "assign_documentation_to_implementation":
                return self.handle_assign_documentation_to_implementation(data)
            elif action == "update_implementation":
                return self.handle_update_implementation(data)
            elif action == "retire_implementation":
                return self.handle_retire_implementation(data)
            elif action == "assign_implementation_to_yse":
                return self.handle_assign_implementation_to_yse(data)
            elif action == "update_documentation_year":
                return self.handle_update_documentation_year(data)
            elif action == "get_documents_for_year":
                return self.handle_get_documents_for_year(data)
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


    def handle_update_documentation_year(self, data):
        """
        Update year-specific inclusion for existing documentation relationships.

        Request Body:
        {
            "action": "update_documentation_year",
            "implementation_id": str,
            "implementation_type": str,
            "documentation_type": str,
            "documentation_id": str,
            "academic_year": str,  # e.g., "2024-2025"
            "include": bool  # true to include, false to exclude
        }
        """
        from app.database.queries.implementation.update import update_documentation_year_inclusion

        implementation_id = data.get('implementation_id')
        implementation_type = data.get('implementation_type')
        documentation_type = data.get('documentation_type')
        documentation_id = data.get('documentation_id')
        academic_year = data.get('academic_year')
        include = data.get('include', True)

        if not all([implementation_id, implementation_type, documentation_type,
                    documentation_id, academic_year]):
            raise ValidationError("Missing required fields for year update")

        success = update_documentation_year_inclusion(
            implementation_id=implementation_id,
            implementation_type=implementation_type,
            documentation_type=documentation_type,
            documentation_id=documentation_id,
            academic_year=academic_year,
            include=include
        )

        if success:
            action = "included in" if include else "excluded from"
            return make_response({
                "status": "success",
                "message": f"Documentation {action} {academic_year}"
            }), 200
        else:
            return make_response({
                "status": "error",
                "error": "Failed to update documentation year"
            }), 500

    def handle_get_documents_for_year(self, data):
        """
        Get all documents for an implementation in a specific academic year.

        Request Body:
        {
            "action": "get_documents_for_year",
            "implementation_id": str,
            "implementation_type": str,
            "academic_year": str,  # e.g., "2024-2025"
            "document_type": str (optional)  # "all", "document", "webpage", "note", "message"
        }
        """
        from app.database.queries.implementation.read import get_documents_for_year

        implementation_id = data.get('implementation_id')
        implementation_type = data.get('implementation_type')
        academic_year = data.get('academic_year')
        document_type = data.get('document_type', 'all')

        if not all([implementation_id, implementation_type, academic_year]):
            raise ValidationError("Missing required fields")

        documents = get_documents_for_year(
            implementation_id=implementation_id,
            implementation_type=implementation_type,
            academic_year=academic_year,
            document_type=document_type
        )

        return make_response({
            "status": "success",
            "data": documents
        }), 200



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

    def handle_retire_implementation(self, data):
        """Set or clear the retirement lifecycle on an implementation.

        Body: implementation_type, unique_id, retired (bool), and when retiring
        optionally retired_date ('YYYY-MM-DD', default today) + retired_note.
        Un-retiring clears date and note.
        """
        from app.database.queries.implementation.update import retire_implementation

        implementation_type = data.get('implementation_type')
        unique_id = data.get('unique_id')
        retired = data.get('retired')

        if not implementation_type or not unique_id:
            raise ValidationError("Missing required fields: 'implementation_type' and 'unique_id'")
        if not isinstance(retired, bool):
            raise ValidationError("'retired' must be a boolean")

        result = retire_implementation(
            implementation_type,
            unique_id,
            retired,
            retired_date=data.get('retired_date'),
            retired_note=data.get('retired_note'),
        )
        verb = 'retired' if retired else 'reactivated'
        return make_response(
            "success",
            data=result,
            message=f"{implementation_type} {verb} successfully",
        ), 200

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

    def handle_assign_person_as_owner(self, data):
        """
        Connect a Person to an implementation node via the owned_by edge.

        Body: { action: "assign_person_as_owner",
                implementation_type, implementation_unique_id, person_unique_id }
        """
        required = ['implementation_type', 'implementation_unique_id', 'person_unique_id']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        assign_person_as_owner(
            implementation_unique_id=data['implementation_unique_id'],
            implementation_type=data['implementation_type'],
            person_unique_id=data['person_unique_id'],
        )
        return make_response({"status": "success", "message": "Person assigned as owner successfully"}), 200

    def handle_unassign_person_as_owner(self, data):
        """Inverse of handle_assign_person_as_owner."""
        required = ['implementation_type', 'implementation_unique_id', 'person_unique_id']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        unassign_person_as_owner(
            implementation_unique_id=data['implementation_unique_id'],
            implementation_type=data['implementation_type'],
            person_unique_id=data['person_unique_id'],
        )
        return make_response({"status": "success", "message": "Person unassigned as owner successfully"}), 200

    def handle_assign_accountable_working_group(self, data):
        """
        Connect an accountable ATIWorkingGroup to a doing-implementation
        (Process/Project/Procedure/Service) via accountable_working_group.

        Body: { action: "assign_accountable_working_group",
                implementation_type, implementation_unique_id, working_group }
        where working_group is a full name ('Web') or abbreviation ('web'/'pro'/'ins').
        """
        required = ['implementation_type', 'implementation_unique_id', 'working_group']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        assign_accountable_working_group(
            implementation_unique_id=data['implementation_unique_id'],
            implementation_type=data['implementation_type'],
            working_group=data['working_group'],
        )
        return make_response({"status": "success", "message": "Accountable working group assigned successfully"}), 200

    def handle_unassign_accountable_working_group(self, data):
        """Inverse of handle_assign_accountable_working_group."""
        required = ['implementation_type', 'implementation_unique_id', 'working_group']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        unassign_accountable_working_group(
            implementation_unique_id=data['implementation_unique_id'],
            implementation_type=data['implementation_type'],
            working_group=data['working_group'],
        )
        return make_response({"status": "success", "message": "Accountable working group unassigned successfully"}), 200

    def handle_set_dimensions(self, data):
        """
        Replace a doing-implementation's AMM-dimension classification (classified_under).
        Replace-semantics: dimension_handles is the full intended set (the multi-select's
        current selection). Only Process/Project/Procedure/Service can be classified.

        Body: { action: "set_dimensions", implementation_type, implementation_unique_id,
                dimension_handles: ["dimension:...", ...] }
        """
        required = ['implementation_type', 'implementation_unique_id', 'dimension_handles']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        set_implementation_dimensions(
            implementation_type=data['implementation_type'],
            implementation_unique_id=data['implementation_unique_id'],
            dimension_handles=data['dimension_handles'],
        )
        return make_response({"status": "success", "message": "Dimensions updated successfully"}), 200

    def handle_set_participants(self, data):
        """
        Replace a doing-implementation's participants (the working team — people in their
        roles), distinct from owned_by. Replace-semantics: participants is the full set.

        Body: { action: "set_participants", implementation_type, implementation_unique_id,
                participants: [{person_unique_id, role_handle, note?}, ...] }
        """
        required = ['implementation_type', 'implementation_unique_id', 'participants']
        if not all(field in data for field in required):
            raise ValidationError(f"Missing required fields: {required}")
        set_implementation_participants(
            implementation_type=data['implementation_type'],
            implementation_unique_id=data['implementation_unique_id'],
            participants=data['participants'],
        )
        return make_response({"status": "success", "message": "Participants updated successfully"}), 200

    def handle_assign_documentation_to_implementation(self, data):
        """
        Assign documentation to an implementation with optional year-specific inclusion.

        Request Body:
        {
            "action": "assign_documentation_to_implementation",
            "implementation_id": str,
            "implementation_type": str,
            "documentation_type": str,
            "documentation_id": str,
            "academic_year": str (optional),  # e.g., "2024-2025"
            "include_in_year": bool (optional, default: true)
        }
        """
        from app.database.queries.implementation.update import assign_documentation_to_implementation

        implementation_id = data.get('implementation_id')
        implementation_type = data.get('implementation_type')
        documentation_type = data.get('documentation_type')
        documentation_id = data.get('documentation_id')
        academic_year = data.get('academic_year')
        include_in_year = data.get('include_in_year', True)

        if not all([implementation_id, implementation_type, documentation_type, documentation_id]):
            raise ValidationError("Missing required fields for documentation assignment")

        success = assign_documentation_to_implementation(
            implementation_id=implementation_id,
            implementation_type=implementation_type,
            documentation_type=documentation_type,
            documentation_id=documentation_id,
            academic_year=academic_year,
            include_in_year=include_in_year
        )

        if success:
            message = "Documentation assigned successfully"
            if academic_year:
                action = "included in" if include_in_year else "excluded from"
                message = f"Documentation assigned and {action} {academic_year}"
            return make_response({"status": "success", "message": message}), 200
        else:
            return make_response({"status": "error", "error": "Failed to assign documentation"}), 500


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

            # Campuses a plan is assigned to (via its furthers_yse anchors)
            # for one academic year: ?campuses_for=<uid>&academic_year=<year>
            # Every YSE a plan furthers, across all campuses/years:
            # ?yses_for=<uid>
            yses_for = request.args.get('yses_for')
            if yses_for:
                data = get_plan_yses(yses_for)
                return make_response(status="success", data=data), 200

            campuses_for = request.args.get('campuses_for')
            if campuses_for:
                academic_year = request.args.get('academic_year')
                if not academic_year:
                    return make_response(
                        status="error",
                        error="'academic_year' is required with 'campuses_for'"), 400
                data = get_plan_campuses(campuses_for, academic_year)
                return make_response(status="success", data=data), 200

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
            elif action == "add_progress_note":
                return self.handle_add_progress_note(data)
            elif action in ("assign_campus", "unassign_campus"):
                # Local error envelope: the shared handlers below put the
                # message in the wrong slot (make_response positional-dict
                # quirk) and the campus UI surfaces these errors verbatim.
                try:
                    return self.handle_campus_assignment(action, data)
                except ValidationError as e:
                    return make_response(status="error", error=str(e)), 400
                except NotFoundError as e:
                    return make_response(status="error", error=str(e)), 404
                except CrudError as e:
                    return make_response(status="error", error=str(e)), 500
            elif action in ("attach_yse", "detach_yse"):
                try:
                    if action == "attach_yse":
                        return self.handle_attach_yse(data)
                    return self.handle_detach_yse(data)
                except ValidationError as e:
                    return make_response(status="error", error=str(e)), 400
                except NotFoundError as e:
                    return make_response(status="error", error=str(e)), 404
                except CrudError as e:
                    return make_response(status="error", error=str(e)), 500
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

    def handle_campus_assignment(self, action, data):
        """
        Assign/unassign a plan to a campus for one academic year. Connects
        (or disconnects) the plan to that campus's YSEs for the same
        indicators + year it already furthers elsewhere.

        Expected payload:
        {
            "action": "assign_campus" | "unassign_campus",
            "unique_id": "UUID of the plan",
            "campus_abbrev": "ssu",
            "year_name": "2025-2026"
        }
        """
        required_fields = ['unique_id', 'campus_abbrev', 'year_name']
        for field in required_fields:
            if not data.get(field):
                raise ValidationError(f"Missing required field: '{field}'")

        if action == "assign_campus":
            linked = assign_plan_to_campus(
                data['unique_id'], data['campus_abbrev'], data['year_name'])
            return make_response(
                status="success",
                message=f"Plan assigned to {data['campus_abbrev']} "
                        f"({linked} evidence link{'s' if linked != 1 else ''}).",
                data={"linked": linked},
            ), 200

        unlinked = unassign_plan_from_campus(
            data['unique_id'], data['campus_abbrev'], data['year_name'])
        return make_response(
            status="success",
            message=f"Plan unassigned from {data['campus_abbrev']} "
                    f"({unlinked} evidence link{'s' if unlinked != 1 else ''} removed).",
            data={"unlinked": unlinked},
        ), 200

    def handle_attach_yse(self, data):
        """
        Connect the plan to ONE specific YearSuccessEvidence (the "add new
        evidence" path — finer-grained than assign_campus's mirror-all).

        Expected payload:
        {
            "action": "attach_yse",
            "unique_id": "UUID of the plan",
            "yse_unique_id": "UUID of the YearSuccessEvidence"
        }
        """
        for field in ('unique_id', 'yse_unique_id'):
            if not data.get(field):
                raise ValidationError(f"Missing required field: '{field}'")

        attach_plan_to_yse(data['unique_id'], data['yse_unique_id'])
        return make_response(
            status="success",
            message="Evidence link added.",
        ), 200

    def handle_detach_yse(self, data):
        """
        Remove one furthers_yse link (per-evidence pruning; finer-grained than
        unassign_campus). The query layer refuses to orphan the plan entirely.

        Expected payload:
        {
            "action": "detach_yse",
            "unique_id": "UUID of the plan",
            "yse_unique_id": "UUID of the YearSuccessEvidence"
        }
        """
        for field in ('unique_id', 'yse_unique_id'):
            if not data.get(field):
                raise ValidationError(f"Missing required field: '{field}'")

        detach_plan_from_yse(data['unique_id'], data['yse_unique_id'])
        return make_response(
            status="success",
            message="Evidence link removed.",
        ), 200

    def handle_add_progress_note(self, data):
        """
        Handle the add_progress_note action.

        Expected payload:
        {
            "action": "add_progress_note",
            "plan_id": "UUID of the plan",
            "note_name": "Note title",
            "note_content": "Note content",
            "created_by_id": "UUID of the person" (optional)
        }
        """
        # Validate required fields
        required_fields = ['plan_id', 'note_name', 'note_content']
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"Missing required field: '{field}'")

        # Call the add_progress_note_to_plan function
        result = add_progress_note_to_plan(
            plan_id=data['plan_id'],
            note_name=data['note_name'],
            note_content=data['note_content'],
            created_by_id=data.get('created_by_id')
        )

        return make_response({
            "status": "success",
            "message": "Progress note added successfully",
            "data": result
        }), 200

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