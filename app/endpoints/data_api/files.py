"""HTTP file transfer — upload / download / delete.

Bytes move over HTTP: multipart upload, streamed download. Storage itself is the
pluggable ``app.fs`` subsystem; this module is the thin HTTP adapter. Auth-guarded
like the rest of data_api (the ``require_login`` before_request on
``data_api_endpoints``). No graph wiring in this phase — the upload response echoes the
filename so a future caller can attach the key/hash to a Document node.
"""
import logging

from flask import jsonify, request, send_file
from flask.views import MethodView

from app.fs import storage
from app.fs.errors import BackendError, ObjectNotFound, StorageValidationError

from . import data_api_endpoints

_logger = logging.getLogger("ati.api.files")


def _err(message, code):
    return jsonify({"status": "error", "data": None, "error": message, "message": None}), code


class FilesAPI(MethodView):

    def post(self):
        """Upload one file as multipart/form-data under the field name ``file``.
        Returns the content-addressed key (SHA-256) the file is stored under."""
        f = request.files.get("file")
        if f is None or not f.filename:
            return _err("no file provided (form field 'file')", 400)
        try:
            stat = storage.save(f.stream, content_type=f.mimetype or None)
        except StorageValidationError as e:
            return _err(str(e), 400)
        except BackendError as e:
            _logger.error("file upload failed: %s", e, exc_info=True)
            return _err("could not store file", 500)
        return jsonify({
            "status": "success",
            "data": {
                "key": stat.key,
                "size": stat.size,
                "content_type": stat.content_type,
                "filename": f.filename,
            },
            "error": None,
            "message": None,
        }), 201

    def get(self, key):
        """Download a stored file. ``?download=1`` forces an attachment;
        ``?name=<filename>`` sets the download filename (defaults to the key)."""
        try:
            stat = storage.stat(key)
            handle = storage.open(key)
        except StorageValidationError as e:
            return _err(str(e), 400)
        except ObjectNotFound:
            return _err("file not found", 404)
        except BackendError as e:
            _logger.error("file open failed: %s", e, exc_info=True)
            return _err("could not read file", 500)
        as_attachment = request.args.get("download") in ("1", "true", "yes")
        download_name = request.args.get("name") or key
        return send_file(
            handle,
            mimetype=stat.content_type or "application/octet-stream",
            as_attachment=as_attachment,
            download_name=download_name,
            max_age=0,
        )

    def delete(self, key):
        """Delete a stored file (idempotent)."""
        try:
            storage.delete(key)
        except StorageValidationError as e:
            return _err(str(e), 400)
        except BackendError as e:
            _logger.error("file delete failed: %s", e, exc_info=True)
            return _err("could not delete file", 500)
        return "", 204


_files_view = FilesAPI.as_view("files_api")
data_api_endpoints.add_url_rule("/files", view_func=_files_view, methods=["POST"])
data_api_endpoints.add_url_rule("/files/<string:key>", view_func=_files_view, methods=["GET", "DELETE"])
