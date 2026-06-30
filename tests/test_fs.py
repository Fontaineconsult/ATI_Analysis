"""Unit tests for the file-storage subsystem (app/fs). No DB, no Flask."""
import hashlib
import io

import pytest

from app.fs.backends.local import LocalFileSystemBackend
from app.fs.controller import StorageController
from app.fs.errors import ObjectNotFound, StorageValidationError

pytestmark = pytest.mark.unit

DATA = b"the quick brown fox\n"
KEY = hashlib.sha256(DATA).hexdigest()


def test_backend_roundtrip_and_content_address(tmp_path):
    be = LocalFileSystemBackend(tmp_path)
    stat = be.save(KEY, io.BytesIO(DATA), content_type="text/plain")
    assert stat.key == KEY
    assert stat.size == len(DATA)
    assert stat.content_type == "text/plain"
    assert be.exists(KEY)
    with be.open(KEY) as fh:
        assert fh.read() == DATA
    assert be.stat(KEY).size == len(DATA)


def test_backend_sharded_layout(tmp_path):
    LocalFileSystemBackend(tmp_path).save(KEY, io.BytesIO(DATA))
    assert (tmp_path / KEY[:2] / KEY[2:4] / KEY).is_file()


def test_backend_missing_raises(tmp_path):
    be = LocalFileSystemBackend(tmp_path)
    with pytest.raises(ObjectNotFound):
        be.open(KEY)
    with pytest.raises(ObjectNotFound):
        be.stat(KEY)


def test_backend_delete_idempotent(tmp_path):
    be = LocalFileSystemBackend(tmp_path)
    be.save(KEY, io.BytesIO(DATA))
    be.delete(KEY)
    assert not be.exists(KEY)
    be.delete(KEY)  # again — not an error


def test_iter_keys(tmp_path):
    be = LocalFileSystemBackend(tmp_path)
    k1 = hashlib.sha256(b"one").hexdigest()
    k2 = hashlib.sha256(b"two").hexdigest()
    be.save(k1, io.BytesIO(b"one"), content_type="text/plain")
    be.save(k2, io.BytesIO(b"two"), content_type="text/plain")
    assert set(be.iter_keys()) == {k1, k2}   # blobs only — not .meta.json or the .tmp dir


def test_controller_dedups_to_one_blob(tmp_path, monkeypatch):
    monkeypatch.setenv("FS_LOCAL_ROOT", str(tmp_path))
    monkeypatch.delenv("FS_PROVIDER", raising=False)
    c = StorageController()
    s1 = c.save(io.BytesIO(DATA), content_type="text/plain")
    s2 = c.save(io.BytesIO(DATA), content_type="text/plain")
    assert s1.key == s2.key == KEY
    assert len(list(tmp_path.rglob(KEY))) == 1   # stored exactly once


def test_controller_rejects_bad_keys(tmp_path, monkeypatch):
    monkeypatch.setenv("FS_LOCAL_ROOT", str(tmp_path))
    c = StorageController()
    for bad in ("../etc/passwd", "xyz", KEY.upper(), "", "a" * 63, "g" * 64, "a/b"):
        with pytest.raises(StorageValidationError):
            c.open(bad)


def test_controller_unknown_provider(tmp_path, monkeypatch):
    monkeypatch.setenv("FS_PROVIDER", "nope")
    monkeypatch.setenv("FS_LOCAL_ROOT", str(tmp_path))
    c = StorageController()
    with pytest.raises(StorageValidationError):
        c.exists(KEY)   # valid key, but backend creation fails on the bad provider
