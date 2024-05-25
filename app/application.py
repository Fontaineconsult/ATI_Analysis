

from app import create_app

app = create_app()
print(f'Template folder: {app.template_folder}')

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=app.config['FLASK_RUN_PORT'], threaded=app.config['THREADED'])
