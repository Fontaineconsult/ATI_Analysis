import sys
import os

# Ensure current directory is in sys.path


import sys
import os
import logging
# Add the parent directory (C:\www\ati\app) to the path so `app` can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    sys.path.insert(0, os.path.dirname(__file__))
    # Configure logging to output to stderr
    # logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

    from app import create_app  # Adjust the import as necessary
    application = create_app()
except Exception:
    raise
