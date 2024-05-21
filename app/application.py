

from app import create_app
import os
app = create_app()

if __name__ == '__main__':
    print("SDFDSF", os.environ.get('FLASK_RUN_PORT'))
    app.run(host="127.0.0.1", port=app.config['FLASK_RUN_PORT'], threaded=app.config['THREADED'])