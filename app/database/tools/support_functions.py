import hashlib
import os

def get_file_hash(filepath):
    if not os.path.exists(filepath):
        return None  # Or raise an exception

    hash_sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()


