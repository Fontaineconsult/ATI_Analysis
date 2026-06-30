"""HTTP round-trip tests for the file endpoints (app/endpoints/data_api/files.py).

Graph-independent — the files endpoint never touches Neo4j — so this builds its own
DB-free app (not the neo4j_connection-bound flask_client fixture) and points storage
at a temp dir.
"""
import hashlib
import io

import pytest

DATA = b"endpoint round trip\n"
KEY = hashlib.sha256(DATA).hexdigest()


@pytest.fixture
def files_client(tmp_path, monkeypatch):
    monkeypatch.setenv("FS_LOCAL_ROOT", str(tmp_path))
    monkeypatch.delenv("FS_PROVIDER", raising=False)
    from app import create_app
    from app.fs import storage

    app = create_app()
    app.config["TESTING"] = True
    app.config["AUTH_ENFORCED"] = False
    monkeypatch.setattr(storage, "_backend", None)   # rebuild backend against tmp root
    with app.test_client() as client:
        yield client


def _upload(client, data=DATA, filename="round.txt"):
    return client.post(
        "/ati/data-api/v1/files",
        data={"file": (io.BytesIO(data), filename)},
        content_type="multipart/form-data",
    )


def test_upload_then_download(files_client):
    r = _upload(files_client)
    assert r.status_code == 201, r.data
    body = r.get_json()["data"]
    assert body["key"] == KEY
    assert body["size"] == len(DATA)
    assert body["filename"] == "round.txt"

    d = files_client.get(f"/ati/data-api/v1/files/{KEY}")
    assert d.status_code == 200
    assert d.data == DATA


def test_upload_is_deduped(files_client):
    assert _upload(files_client).get_json()["data"]["key"] == KEY
    assert _upload(files_client).get_json()["data"]["key"] == KEY   # same key, no error


def test_upload_missing_field(files_client):
    r = files_client.post("/ati/data-api/v1/files", data={}, content_type="multipart/form-data")
    assert r.status_code == 400


def test_download_bad_key(files_client):
    assert files_client.get("/ati/data-api/v1/files/not-a-valid-key").status_code == 400


def test_download_missing(files_client):
    assert files_client.get(f"/ati/data-api/v1/files/{KEY}").status_code == 404


def test_delete_roundtrip(files_client):
    _upload(files_client)
    assert files_client.delete(f"/ati/data-api/v1/files/{KEY}").status_code == 204
    assert files_client.get(f"/ati/data-api/v1/files/{KEY}").status_code == 404
