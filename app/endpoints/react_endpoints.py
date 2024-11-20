import os
from flask import Blueprint, send_from_directory, current_app

react_pages = Blueprint('react_pages', __name__)

@react_pages.route('/', defaults={'path': ''})
@react_pages.route('/<path:path>')
def serve_react_app(path):
    # Construct the absolute path to the build directory
    build_dir = os.path.join(current_app.root_path, 'frontend', 'src', 'build')
    full_path = os.path.join(build_dir, path)

    if path != '' and os.path.exists(full_path):
        return send_from_directory(build_dir, path)
    else:
        # Serve index.html for all other routes under /ati
        return send_from_directory(build_dir, 'index.html')
