import sys
import os

# Ensure current directory is in sys.path


import sys
import os
import logging
sys.path.append(r"C:\www\ati")
sys.path.append(r"C:\www\ati\ati")
sys.path.insert(0, os.path.dirname(__file__))
# Configure logging to output to stderr
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

try:
    from app import create_app  # Adjust the import as necessary
    application = create_app()
except Exception:
    logging.exception("An exception occurred while creating the application.")
    raise
