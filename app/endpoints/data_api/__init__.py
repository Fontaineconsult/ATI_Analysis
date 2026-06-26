from flask import Blueprint

# Initialize the Blueprint
data_api_endpoints = Blueprint('data_api', __name__)

from . import (asana,
               assets,
               campus_plans,
               committees,
               components,
               descriptors,
               dimensions,
               documents,
               evidence_campus as evidence,
               files,
               governance,
               implementation,
               indicators,
               individuals,
               intellectual_sources,
               interfaces,
               ontology,
               organizational_units,
               principles,
               queries,
               report,
               roles,
               settings,
               tools,
               vendors)