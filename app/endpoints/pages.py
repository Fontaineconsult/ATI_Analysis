from flask import Flask, request, jsonify, render_template, Blueprint
from app.database.neomodelschema import *
from neomodel import db
from jinja2 import Environment, FileSystemLoader
from app.database.queries.read import full_year_report



page_endpoints = Blueprint('pages', __name__)


@page_endpoints.route('/')
def index():
    return "Hello World"


@page_endpoints.route('/indicator-explorer', methods=['GET'])
def indicator_explorer():

    return render_template('indicator_explorer.html')


@page_endpoints.route('/goals', methods=['GET'])
def get_goals():
    goals = Goal.nodes.all()
    print(goals)
    return jsonify([{"name":goal.name, "goal":goal.goal} for goal in goals])

@page_endpoints.route('/success-indicators',  methods=['GET'])
def get_success_indicators():
    try:
        query = """
    MATCH (si:SuccessIndicator)-[:is_a_success_indicator_of]->(g:Goal),
          (si)-[:success_indicator_is]-(yse:YearSuccessEvidence)
    MATCH (yse)-[:status_is]->(sl:StatusLevel)
    RETURN si AS SuccessIndicator, collect(g) AS Goals, collect(yse) AS YearSuccessEvidences, collect(sl) AS StatusLevels
    """
        results, meta = db.cypher_query(query)

        response = []
        for si, goals, yses, sls in results:
            success_indicator = {
                'success_indicator': si['success_indicator'],  # adjust as per your model attributes
                'composite_key': si['composite_key'],
                'goals': [{'name': g['name']} for g in goals],
                'year_success_evidences': [{'year_identifier': yse['year_identifier']} for yse in yses],
                'status_levels': [{'status_level': sl['status_level']} for sl in sls]  # adjust attributes as necessary
            }
            response.append(success_indicator)

        return render_template('success_indicators.html', success_indicators=response)
    except Exception as e:
        return str(e), 500

@page_endpoints.route('/success-indicator', defaults={'year': None, 'success_indicator': None, 'subcommittee': None}, methods=['GET', 'POST'])
@page_endpoints.route('/success-indicator/<string:year>/<string:success_indicator>/<string:subcommittee>', methods=['GET', 'POST'])
def get_success_indicator(year, success_indicator, subcommittee):
    if request.method == 'GET':
        if year is None and success_indicator is None and subcommittee is None:
            # Extract parameters from query string
            success_indicator = request.args.get('success_indicator')
            print(success_indicator)
            if success_indicator:
                components = success_indicator.split('/')
                year = components[0] if len(components) > 0 else None
                success_indicator = components[1] if len(components) > 1 else None
                subcommittee = components[2] if len(components) > 2 else None
            else:
                return "Missing parameters", 400

        print(subcommittee, success_indicator, year)
        if success_indicator and subcommittee and year:
            year_identifier = f"{year}-{success_indicator}-{subcommittee}"
        else:
            return 404




        query = full_year_report(year_identifier)


        # query = (f'MATCH (si:SuccessIndicator)-[:is_a_success_indicator_of]->(g:Goal),'
        #         f'(si)-[:success_indicator_is]-(yse:YearSuccessEvidence)'
        #         f'WHERE yse.year_identifier = "{year_identifier}"'
        #         f'MATCH (yse)-[:status_is]->(sl:StatusLevel)'
        #         f'MATCH (yse)-[:status_in_year]->(ay:AcademicYear)'
        #         f'OPTIONAL MATCH (yse)-[:implemented_by]->(p:Person)'
        #         f'RETURN si AS SuccessIndicator, collect(g) AS Goals, collect(yse) AS YearSuccessEvidences, collect(sl) AS StatusLevels,'
        #         f'ay AS AcademicYear, p AS Person')
        #
        # print(query)
        #
        # responses = []
        # results, meta = db.cypher_query(query)
        # print(meta)
        # for si, goals, yses, sls, ay, p in results:
        #     response = {
        #         'success_indicator': si['success_indicator'],
        #         'composite_key': si['composite_key'],
        #         'goals': [{'name': g['name']} for g in goals],
        #         'year_success_evidence': [{'year_identifier': yse['year_identifier']} for yse in yses],
        #         'status_levels': [{'status_level': sl['status_level']} for sl in sls],
        #         'academic_year': ay['name'] if ay else None,
        #         'person': p['name'] if p else None,
        #     }
        #     responses.append(response)

        return render_template('success_indicator.html',
                               success_indicator=query,
                               path=f"{year}/{success_indicator}/{subcommittee}",
                               year_success_identifier=year_identifier)




@page_endpoints.route('/add_year_success', methods=['GET', 'POST'])
def add_year_success():
    if request.method == 'POST':
        academic_year = request.form['academic_year']
        status_level = request.form['status_level']
        related_success_indicator = request.form['related_success_indicator']

        try:
            AY = AcademicYear.nodes.get(name=academic_year)
            status_level = StatusLevel.nodes.get(status_level=status_level)
            success_indicator = SuccessIndicator.nodes.get(composite_key=related_success_indicator)

            new_year_status = YearSuccessEvidence(
                year_identifier=f"{academic_year}-{related_success_indicator}"
            )
            new_year_status.save()
            new_year_status.academic_year.connect(AY)
            new_year_status.status_level.connect(status_level)
            new_year_status.related_success_indicator.connect(success_indicator)

            return jsonify({'status': 'success', 'message': 'Year Success Evidence added successfully'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)})

    return render_template('add_year_success.html')


@page_endpoints.route('/document', methods=['GET', 'POST'])
def add_document():
    if request.method == 'GET':
        return render_template('add_document.html')


    if request.method == 'POST':

        year_identifier = request.form['year_identifier']
        document_name = request.form['document_name']
        file_path = request.form['file_path']
        uri_path = request.form['uri_path']

        try:
            year_status = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
            new_document = Document(
                name=document_name,
                file_path=file_path,
                uri_path=uri_path

            )
            new_document.save()
            year_status.has_documents.connect(new_document)

            return jsonify({'status': 'success', 'message': 'Document added successfully'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)})

    return render_template('add_document.html')



