"""The review matrix tester at /ati/reports/public/review-matrix/.

A static page published into app/public_reports/static/review-matrix by
app/database/ontology/impact-matrix/publish-tester.js. The routes serve the page and the
four files it loads, and nothing else from that folder. No graph access, so no
database fixture.
"""
import pytest

pytestmark = pytest.mark.api

BASE = '/ati/reports/public/review-matrix'
ASSETS = ['review-matrix-tester.css', 'review-matrix-tester.js', 'review-matrix.js', 'review-emails.js']


@pytest.fixture(scope='module')
def client():
    from app import create_app
    app = create_app()
    app.config['TESTING'] = True
    return app.test_client()


def test_bare_address_redirects_to_the_folder(client):
    r = client.get(BASE)
    assert r.status_code in (301, 308)
    assert r.headers['Location'].endswith(BASE + '/')


def test_page_renders(client):
    r = client.get(BASE + '/')
    assert r.status_code == 200
    assert r.mimetype == 'text/html'
    body = r.get_data(as_text=True)
    assert '<title>Accessibility review tester</title>' in body
    for asset in ASSETS:
        assert f'"{asset}"' in body


@pytest.mark.parametrize('asset', ASSETS)
def test_assets_serve(client, asset):
    r = client.get(f'{BASE}/{asset}')
    assert r.status_code == 200
    assert r.headers['Cache-Control'] == 'public, max-age=300'


@pytest.mark.parametrize('path', ['README.md', 'missing.js'])
def test_other_files_do_not_serve(client, path):
    assert client.get(f'{BASE}/{path}').status_code == 404


@pytest.mark.parametrize('path', ['..%2F__init__.py', '../__init__.py', 'sub/review-matrix.js'])
def test_paths_outside_the_folder_never_reach_a_file(client, path):
    # The tester route takes one path segment, so these fall through to the React
    # app's catch-all, which answers with its own index page. Either way, no file
    # from the server comes back.
    body = client.get(f'{BASE}/{path}').get_data(as_text=True)
    assert 'Blueprint(' not in body
    assert 'Accessibility review tester' not in body


def test_switch_turns_the_page_off(client):
    app = client.application
    app.config['PUBLIC_REPORTS_ENABLED'] = False
    try:
        assert client.get(BASE + '/').status_code == 404
        assert client.get(BASE).status_code == 404
    finally:
        app.config['PUBLIC_REPORTS_ENABLED'] = True
