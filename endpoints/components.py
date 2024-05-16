
from flask import Blueprint, render_template, request, jsonify
from neomodel import db, config

component_endpoints = Blueprint('components', __name__)

# Configure your Neo4j database connection
config.DATABASE_URL = 'bolt://neo4j:testtest@localhost:7687'

@component_endpoints.route('/get-component', methods=['GET'])
def get_component():
    if request.method == 'GET':
        if request.args.get('year_success_evidence'):
            academic_year = request.args.get('year_success_evidence')
            query = (f'MATCH (a:AcademicYear)-[:status_in_year]-(y:YearSuccessEvidence)-[:success_indicator_is]->(s:SuccessIndicator)'
                     f'WHERE a.name = "{academic_year.replace("-", "/")}"'
                     f'RETURN a, y, s')
            responses = []
            results, meta = db.cypher_query(query)

            for a, y, s in results:
                response = {
                    'academic_year': a['name'],
                    'year_success_evidence': y['year_identifier'],
                    'success_indicator': s['success_indicator']
                }
                responses.append(response)

            return render_template('year_success_selector.html', year_success_evidence=responses)



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