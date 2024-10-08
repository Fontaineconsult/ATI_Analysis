import os
from flask import Blueprint, send_from_directory

from jinja2 import Environment, FileSystemLoader

react_pages = Blueprint('ati-explorer', __name__)

@react_pages.route('/', defaults={'path': ''})
@react_pages.route('/<path:path>')
def serve_react_app(path):
    if path != '' and os.path.exists(f"frontend/src/build/{path}"):
        return send_from_directory('frontend/src/build', path)
    else:
        # Serve index.html for all non-API routes under /ati-explorer (React's SPA routing)
        return send_from_directory('frontend/src/build', 'index.html')