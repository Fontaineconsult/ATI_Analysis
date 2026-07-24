"""
Server settings, resolved from the environment.

Everything is overridable via env vars so the same code serves a read-only
local stdio server (the default) and, later, a hosted HTTP deployment — without
editing source. Defaults are deliberately conservative: read-only, stdio.

    ATI_MCP_SERVER_NAME   display name advertised to the MCP client   (default "ati-graph")
    ATI_MCP_ALLOW_WRITE   expose write-mode registry queries as tools  (default false)
    ATI_MCP_TRANSPORT     "stdio" | "sse" | "streamable-http"          (default "stdio")
    ATI_MCP_HOST          bind address for the HTTP transports         (default "127.0.0.1";
                          set "0.0.0.0" to serve the campus network)
    ATI_MCP_PORT          bind port for the HTTP transports            (default 8000)
    ATI_MCP_CATEGORIES    comma-separated allowlist of registry        (default all)
                          categories to expose (e.g. "evidence,indicators")

Host/port must flow through OUR settings: the installed MCP SDK's FastMCP
ignores its own FASTMCP_* env vars at construction time and binds
127.0.0.1:8000 unless the values are passed explicitly (verified 2026-07).
"""

import os
from dataclasses import dataclass
from typing import Optional, Tuple


def _as_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


@dataclass(frozen=True)
class Settings:
    server_name: str = "ati-graph"
    allow_write: bool = False
    transport: str = "stdio"
    host: str = "127.0.0.1"
    port: int = 8000
    # None means "expose every category"; otherwise an allowlist.
    categories: Optional[Tuple[str, ...]] = None

    def category_allowed(self, category: str) -> bool:
        return self.categories is None or category in self.categories


def load_settings() -> Settings:
    raw_categories = os.environ.get("ATI_MCP_CATEGORIES")
    categories = (
        tuple(c.strip() for c in raw_categories.split(",") if c.strip())
        if raw_categories
        else None
    )
    return Settings(
        server_name=os.environ.get("ATI_MCP_SERVER_NAME", "ati-graph"),
        allow_write=_as_bool(os.environ.get("ATI_MCP_ALLOW_WRITE"), default=False),
        transport=os.environ.get("ATI_MCP_TRANSPORT", "stdio"),
        host=os.environ.get("ATI_MCP_HOST", "127.0.0.1"),
        port=int(os.environ.get("ATI_MCP_PORT", "8000")),
        categories=categories,
    )
