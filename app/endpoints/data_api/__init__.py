from flask import Blueprint

# Initialize the Blueprint
data_api_endpoints = Blueprint('data_api', __name__)

from . import (assets,
               campus_plans,
               committees,
               components,
               documents,
               evidence_campus as evidence,
               governance,
               implementation,
               indicators,
               individuals,
               interfaces,
               organizational_units,
               settings,
               tools,
               vendors)