from flask import Blueprint, jsonify

from app.database.class_factory import working_group_names_web_query, status_levels
from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group
from app.database.queries.documentation.create import add_note, add_message
from app.database.queries.documentation.update import update_note, update_message
from app.database.queries.evidence.read import get_all_status_level_nodes
from app.database.queries.evidence.update import assign_status_to_yse, assign_approver_to_yse
from app.database.queries.individuals.read import get_person_by_employee_id, get_all_persons
from app.database.tools.report_queries import build_yse_report


data_api = Blueprint('data-api', __name__)



@data_api.route('/yse/<yse>', methods=['GET'])
def get_yse(yse):
    yse_dict = build_yse_report(yse)
    return jsonify(yse_dict)

@data_api.route('/working-group/<working_group>/<academic_year>', methods=['GET'])
def get_all_yse_by_working_group(working_group, academic_year):

    if working_group not in working_group_names_web_query:
        return jsonify({'error': f'Invalid working group: one of web, instructional-materials, procurement'}), 400

    results = fetch_evidence_for_working_group(working_group_names_web_query[working_group], academic_year)
    if not results:
        return jsonify({'error': 'No data found'}), 404

    return results[0][0]

from flask import request, jsonify

@data_api.route('/status-levels', methods=['GET', 'PUT'])
def get_or_update_status_level():
    if request.method == 'GET':
        # Handle GET request: Retrieve all status level nodes
        all_nodes = get_all_status_level_nodes()
        serialized = [node.serialize() for node in all_nodes]
        return ({'status_levels': serialized}), 200  # Return status levels with HTTP 200

    elif request.method == 'PUT':
        # Handle PUT request: Update status level for a given YearSuccessEvidence (YSE)
        # Extract the 'yse' and 'status_level' from the request JSON
        data = request.get_json()
        yse = data.get('yse')  # Get the YearSuccessEvidence identifier from request
        status_level = data.get('status_level')  # Get the new status level from request

        if not yse or not status_level:
            return jsonify({'error': 'Missing yse or status_level in request'}), 400  # Return HTTP 400 if data is missing

        if status_level not in status_levels:
            return jsonify({'error': f'Invalid status level. One of "{[level for level in status_level]}"'}), 400


        # Assign the new status level to the YearSuccessEvidence (YSE)
        try:
            assign_status_to_yse(yse, status_level)
            return jsonify({'message': 'Status level updated successfully'}), 200  # Return success response with HTTP 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500  # Return HTTP 500 for any server error

    return jsonify({'error': 'Method not allowed'}), 405  # Handle invalid methods with HTTP 405



@data_api.route('/persons', methods=['GET'])
def get_persons():
    employee_id = request.args.get('employee_id')
    if not employee_id:
        all_persons = get_all_persons()
        serialized = [person.serialize() for person in all_persons]
        return jsonify({'persons': serialized})

    person = get_person_by_employee_id(employee_id)
    if person:
        return jsonify({'person': person.serialize()})
    else:
        return jsonify({'error': 'Person not found'}), 404

@data_api.route('/assign-approver', methods=['PUT'])
def assign_approver():
    data = request.get_json()
    yse = data.get('year_success_evidence')
    employee_id = data.get('employee_id')

    if not yse or not employee_id:
        return jsonify({'error': 'Missing yse or employee_id in request'}), 400

    person = get_person_by_employee_id(employee_id)
    if not person:
        return jsonify({'error': 'Person not found'}), 404

    try:
        assign_approver_to_yse(yse, employee_id)
        return jsonify({'message': 'Approver assigned successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_api.route('/notes', methods=['POST','PUT'])
def add_or_update_notes():
    if request.method == 'PUT':
        data = request.get_json()
        yse = data.get('year_success_evidence')
        notes_object = data.get('note_dict')
        created_by = data.get('created_by')

        update = update_note(yse, notes_object, created_by)
        if update:
            return jsonify({'message': 'Note updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update note'}), 500


    if request.method == 'POST':
        data = request.get_json()
        yse = data.get('year_success_evidence')
        notes_object = data.get('note_dict')


        update = add_note(yse, notes_object)
        if update:
            return jsonify({'message': 'Note updated successfully'}), 201
        else:
            return jsonify({'error': 'Failed to update note'}), 500





@data_api.route('/messages', methods=['POST', 'PUT'])
def add_or_update_messages():
    if request.method == 'PUT':
        data = request.get_json()
        yse = data.get('year_success_evidence')
        message_object = data.get('message_dict')


        update = update_message(yse, message_object)
        if update:
            return jsonify({'message': 'Message updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update message'}), 500

    if request.method == 'POST':

        data = request.get_json()
        print(data)
        yse = data.get('year_success_evidence')
        message_object = data.get('message_dict')

        update = add_message(yse, message_object)
        if update:
            return jsonify({'message': 'Message updated successfully'}), 201
        else:
            return jsonify({'error': 'Failed to update message'}), 500


