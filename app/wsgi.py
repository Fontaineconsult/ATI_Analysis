import os
import sys
import logging
import traceback
from datetime import datetime

# Add paths for imports
sys.path.insert(0, r"C:\www\ati")
sys.path.insert(0, r"C:\www\ati\app")

# Setup logging to wfastcgi.log only
log_file = r"C:\www\ati\wfastcgi.log"

# Configure basic logging to wfastcgi.log - set to DEBUG to capture everything
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG to capture all levels
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a')
    ]
)

# Add Seq handler
try:
    from seqlog.structured_logging import SeqLogHandler
    seq_handler = SeqLogHandler('http://localhost:5341', api_key=None)
    seq_handler.setLevel(logging.DEBUG)  # Changed to DEBUG to send all levels to Seq
    logging.getLogger().addHandler(seq_handler)
except Exception as e:
    # If Seq fails, just continue with file logging
    logging.error(f"Failed to setup Seq: {e}")

logger = logging.getLogger(__name__)

try:
    from app import create_app
    from flask import request, has_request_context

    app = create_app()

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Build context if in a request
        extra = {}
        if has_request_context():
            extra = {
                'RequestPath': request.path,
                'RequestMethod': request.method
            }

        logger.error(f"Unhandled exception: {str(e)}", exc_info=True, extra=extra)
        return "Internal Server Error", 500

    application = app

    # Now you can use different log levels
    logger.debug("Application starting up")
    logger.info("Application initialized")
    logger.warning("This is a warning")
    logger.error("Application started successfully")  # Using error level to ensure it shows

except Exception as e:
    logger.error(f"Failed to start application: {str(e)}", exc_info=True)
    raise