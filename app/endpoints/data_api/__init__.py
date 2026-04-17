from flask import Blueprint

# Initialize the Blueprint
data_api_endpoints = Blueprint('data_api', __name__)

from . import (committees,
               documents,
               evidence_campus as evidence,
               governance,
               implementation,
               indicators,
               individuals,
               organizational_units)