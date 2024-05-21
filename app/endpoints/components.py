
from flask import Blueprint, render_template, request
from neomodel import db
import time
component_endpoints = Blueprint('components', __name__)

# Configure your Neo4j database connection



@component_endpoints.route('/indicator_selector', methods=['GET'])
def get_indicator_selector():
    if request.method == 'GET':

        academic_year = request.args.get('ay')
        query = (f'MATCH (a:AcademicYear)-[:status_in_year]-(y:YearSuccessEvidence)-[:success_indicator_is]->(s:SuccessIndicator)'
                 f'WHERE a.name = "{academic_year}"'
                 f'RETURN a, y, s')
        responses = []

        results, meta = db.cypher_query(query)

        for a, y, s in results:
            response = {
                'academic_year': a['name'],
                'year_success_evidence': y['year_identifier'],
                'success_indicator': s['success_indicator'],
                'composite_key': s['composite_key']
            }
            responses.append(response)
        if len(responses) > 0:

            return render_template('year_success_selector.html', year_success_evidence=responses)

        else:
            return f"<div>No indicator data found for {academic_year}</div>"


@component_endpoints.route('/success-indicator-table/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET'])
def get_success_indicator_table(year, success_indicator, subcommittee):

    if request.method == 'GET':
        print(subcommittee, success_indicator, year)
        composite_key = f"{success_indicator}-{subcommittee}"

        query = (f'MATCH (si:SuccessIndicator)-[:is_a_success_indicator_of]->(g:Goal),'
                 f'(si)-[:success_indicator_is]-(yse:YearSuccessEvidence)'
                 f'WHERE si.composite_key = "{composite_key}"'
                 f'MATCH (yse)-[:status_is]->(sl:StatusLevel)'
                 f'MATCH (yse)-[:status_in_year]->(ay:AcademicYear)'
                 f'OPTIONAL MATCH (yse)-[:implemented_by]->(p:Person)'
                 f'RETURN si AS SuccessIndicator, collect(g) AS Goals, collect(yse) AS YearSuccessEvidences, collect(sl) AS StatusLevels,'
                 f'ay AS AcademicYear, p AS Person')

        responses = []
        results, meta = db.cypher_query(query)

        for si, goals, yses, sls, ay, p in results:
            response = {
                'success_indicator': si['success_indicator'],
                'composite_key': si['composite_key'],
                'goals': [{'name': g['name']} for g in goals],
                'year_success_evidences': [{'year_identifier': yse['year_identifier']} for yse in yses],
                'status_levels': [{'status_level': sl['status_level']} for sl in sls],
                'academic_year': ay['name'] if ay else None,
                'person': p['name'] if p else None,
            }
            responses.append(response)
            print(responses)

        return render_template('success_indicator_table.html', success_indicator=responses)


@component_endpoints.route('/documents/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET'])
def get_documents(year, success_indicator, subcommittee):

    if request.method == 'GET':



        year_success_identifier = f"{year}-{success_indicator}-{subcommittee}"

        query = (f'MATCH (yse:YearSuccessEvidence)-[:has_documents]->(d:Document)'
                f'WHERE yse.year_identifier = "{year_success_identifier}"'
                f'RETURN d')

        responses = []
        results, meta = db.cypher_query(query)

        for d in results:
            response = {
                'document_name': d['name'],
                'document_path': d['file_path']
            }
            responses.append(response)

        return render_template('documents_table.html',
                               documents=responses)


@component_endpoints.route('/websites/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET'])
def get_websites(year, success_indicator, subcommittee):

    if request.method == 'GET':

        year_success_identifier = f"{year}-{success_indicator}-{subcommittee}"

        query = (f'MATCH (yse:YearSuccessEvidence)-[:has_webpages]->(d:Webpage)'
                 f'WHERE yse.year_identifier = "{year_success_identifier}"'
                 f'RETURN d')

        responses = []
        results, meta = db.cypher_query(query)

        for d in results:
            response = {
                'website_url': d['url'],
                'website_title': d['title']
            }
            responses.append(response)

        return render_template('websites_table.html',
                               websites=responses)


@component_endpoints.route('/notes/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET'])
def get_notes(year, success_indicator, subcommittee):
    if request.method == 'GET':
        year_success_identifier = f"{year}-{success_indicator}-{subcommittee}"
        query = (f'MATCH (yse:YearSuccessEvidence)-[:has_notes]->(n:Note)'
                 f'WHERE yse.year_identifier = "{year_success_identifier}"'
                 f'RETURN n')
        responses = []
        results, meta = db.cypher_query(query)
        for n in results:
            response = {
                'note_content': n['content'],
                'note_date': n['date']
            }
            responses.append(response)
        return render_template('notes_table.html', notes=responses)



@component_endpoints.route('/vendors/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET'])
def get_vendors(year, success_indicator, subcommittee):
    if request.method == 'GET':

        year_success_identifier = f"{year}-{success_indicator}-{subcommittee}"
        query = (f'MATCH (yse:YearSuccessEvidence)-[:has_vendors]->(v:Vendor)'
                 f'WHERE yse.year_identifier = "{year_success_identifier}"'
                 f'RETURN v')
        responses = []
        results, meta = db.cypher_query(query)
        for v in results:
            response = {
                'vendor_name': v['name'],
                'vendor_contact': v['contact']
            }
            responses.append(response)
        return render_template('vendors_table.html', vendors=responses)