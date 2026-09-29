"""
Connection resolution for the MCP server.

The MCP server is one of the three sanctioned graph access paths (HTTP API, MCP, CLI)
and the only module under ``cypher_runner`` that opens its own Bolt driver. This file
holds the credential lookup that ``executor.py`` consumes. It used to live in
``run_query.py``; it moved here when the terminal runners were rebuilt on ``neo4j-cli``
so that nothing on the CLI path imports a driver or reads a password.

Credentials are read from the environment / a .env file. Two supported styles:

  1. Single neomodel-style URL (matches app/.env.development):
         DATABASE_URL=bolt://<user>:<password>@<host>:7687
     plus optional:
         NEO4J_DATABASE=ati        # defaults to "neo4j" (Aura's default DB)

  2. Split variables:
         NEO4J_URI=bolt://<host>:7687
         NEO4J_USERNAME=<user>
         NEO4J_PASSWORD=<password>
         NEO4J_DATABASE=ati
"""

import os
from pathlib import Path
from urllib.parse import urlparse


def _load_dotenv_if_present():
    """Best-effort load of app/.env.development without requiring python-dotenv."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    # app/.env.development relative to this file: ../../../.env.development
    candidate = Path(__file__).resolve().parents[3] / ".env.development"
    if candidate.exists():
        load_dotenv(candidate)


def resolve_connection():
    """
    Return (uri, auth, database) or exit with a clear message if not configured.
    auth is a (user, password) tuple or None.
    """
    _load_dotenv_if_present()

    # Default mirrors app/web_config.py (the "point to aura" change): Aura's
    # only database is "neo4j". .env.development sets NEO4J_DATABASE explicitly,
    # so this fallback only matters when it's left unset.
    database = os.environ.get("NEO4J_DATABASE", "neo4j")

    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        user = parsed.username
        password = parsed.password
        # Rebuild a clean URI without embedded credentials for the driver.
        netloc = parsed.hostname or ""
        if parsed.port:
            netloc += f":{parsed.port}"
        clean_uri = f"{parsed.scheme}://{netloc}"
        auth = (user, password) if user is not None else None
        return clean_uri, auth, database

    uri = os.environ.get("NEO4J_URI")
    if uri:
        user = os.environ.get("NEO4J_USERNAME")
        password = os.environ.get("NEO4J_PASSWORD")
        auth = (user, password) if user else None
        return uri, auth, database

    raise SystemExit(
        "No connection configured.\n"
        "Set DATABASE_URL=bolt://user:pass@host:7687 (neomodel style)\n"
        "or NEO4J_URI + NEO4J_USERNAME + NEO4J_PASSWORD, then retry."
    )
