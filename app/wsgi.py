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

# The neo4j 6.x driver logs EVERY server notification (e.g. "null value eliminated
# in set function", "property key does not exist") at WARNING. Under DEBUG that
# floods wfastcgi.log and buries real errors. Clamp the driver/server loggers to
# ERROR — genuine failures still surface as raised exceptions (logged via the app's
# error path), not as these informational notification records.
for _noisy in ("neo4j", "neo4j.notifications", "neo4j.pool", "neobolt", "werkzeug"):
    logging.getLogger(_noisy).setLevel(logging.ERROR)

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
    from werkzeug.exceptions import HTTPException

    app = create_app()

    @app.errorhandler(Exception)
    def handle_exception(e):
        method = request.method if has_request_context() else '?'
        path = request.path if has_request_context() else '?'

        # Werkzeug HTTPExceptions (404, 401, 405, 400, ...) are normal HTTP
        # outcomes, not server faults. Return them UNCHANGED so the client gets
        # the correct status code -- the previous handler rewrote EVERY one to a
        # 500 and logged it with a full traceback (that's why a missing URL
        # showed up as an "Unhandled exception"). Log quietly instead: INFO for
        # client 4xx, ERROR only for genuine 5xx, and no traceback.
        if isinstance(e, HTTPException):
            code = e.code or 500
            logger.log(
                logging.ERROR if code >= 500 else logging.INFO,
                "HTTP %s on %s %s: %s", code, method, path, e.name,
            )
            return e

        # Anything else is an unexpected server fault: full traceback + 500.
        logger.error(
            "Unhandled exception on %s %s: %s", method, path, e,
            exc_info=True,
            extra={'RequestPath': path, 'RequestMethod': method},
        )
        return "Internal Server Error", 500

    application = app

    logger.info("ATI application initialized (pid %s)", os.getpid())

except Exception as e:
    logger.error(f"Failed to start application: {str(e)}", exc_info=True)
    raise