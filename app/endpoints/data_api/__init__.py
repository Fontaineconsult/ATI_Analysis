from flask import Blueprint

# Initialize the Blueprint
data_api = Blueprint('data_api', __name__)

from . import (committees,
               documents,
               evidence,
               governance,
               implementation,
               indicators,
               individuals,
               organizational_units)