from flask import Blueprint, jsonify

from app.database.class_factory import working_group_names_web_query
from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group
from app.database.tools.report_queries import build_yse_report


data_api = Blueprint('data-api', __name__)



@data_api.route('/yse/<yse>', methods=['GET'])
def get_yse(yse):
    yse_dict = build_yse_report(yse)
    return jsonify(yse_dict)

@data_api.route('/working-group/<working_group>/<academic_year>', methods=['GET'])
def get_all_yse_by_working_group(working_group, academic_year):

    working_group =  working_group_names_web_query[working_group]

    return fetch_evidence_for_working_group(working_group, academic_year)[0][0]