from flask import Flask
from endpoints.components import component_endpoints
from endpoints.pages import page_endpoints

app = Flask(__name__)
app.register_blueprint(component_endpoints)
app.register_blueprint(page_endpoints)

if __name__ == '__main__':
    app.run(debug=True, port=5000)