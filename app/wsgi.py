import os,sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app import create_app  # Import the Flask application factory

# Create the Flask application
app = create_app()

# Set up logging
import logging
from logging.handlers import RotatingFileHandler

# Configure logging for error capture
log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.log')  # Absolute path to app.log

if not app.debug:  # Enable logging only if not in debug mode
    handler = RotatingFileHandler(log_file_path, maxBytes=10000, backupCount=1)
    handler.setLevel(logging.ERROR)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)

# Print a startup message for verification
if __name__ == "__main__":
    print("WSGI application loaded. Ready to serve requests.")
