import json

from flask import request
from flask.views import MethodView
from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group
from . import data_api_endpoints
from ...database.class_factory import working_group_names_web_query
from app.endpoints.data_api.util.response import make_response

from app.endpoints.data_api.errors.custom_exceptions import (
    ApiError,
    NotFoundError,
    ValidationError
)


def get_all_yse_by_working_group(working_group, academic_year):
    if working_group not in working_group_names_web_query:
        raise ValidationError(
            message="Invalid working group: one of web, instructional-materials, procurement"
        )

    try:
        results = fetch_evidence_for_working_group(
            working_group_names_web_query[working_group],
            academic_year
        )
    except Exception as e:
        raise ApiError(
            message="Failed to fetch evidence for working group.",
            original_exception=e
        )

    if not results:
        raise NotFoundError(
            message="No data found for the specified working group and academic year."
        )


    return make_response(
        status="success",
        data=json.loads(results[0][0])
    ), 200





class EvidenceAPI(MethodView):
    def get(self, working_group, academic_year):
        """
        Handle GET requests to fetch YSE by working group and academic year.
        """
        return get_all_yse_by_working_group(working_group, academic_year)




# Create the view
evidence_view = EvidenceAPI.as_view('evidence_view')

# Register the URL rules with the blueprint
data_api_endpoints.add_url_rule(
    '/evidence/<string:working_group>/<string:academic_year>',
    view_func=evidence_view,
    methods=['GET']
)

# Register OPTIONS method if needed
data_api_endpoints.add_url_rule(
    '/evidence',
    view_func=evidence_view,
    methods=['OPTIONS']
)
