from flask import Blueprint

# Initialize the Blueprint
data_api_endpoints = Blueprint('data_api', __name__)

from . import (assets,
               campus_plans,
               committees,
               components,
               descriptors,
               dimensions,
               documents,
               evidence_campus as evidence,
               governance,
               implementation,
               indicators,
               individuals,
               intellectual_sources,
               interfaces,
               organizational_units,
               principles,
               settings,
               tools,
               vendors)