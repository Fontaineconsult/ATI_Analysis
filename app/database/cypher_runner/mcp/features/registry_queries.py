"""
Feature: expose the Cypher registry as MCP tools.

Every ``read`` entry in ``query_registry.yaml`` becomes one MCP tool whose
parameters mirror the query's declared ``params``. Write entries are exposed
ONLY when ``ATI_MCP_ALLOW_WRITE`` is on, and are clearly prefixed.

This is the whole point of the server: the model never writes Cypher, it picks
from the vetted catalog. Adding a query to the graph's surface area is therefore
a registry edit (``query_registry.yaml``) — no code change here.
"""

import inspect
from typing import Any, Dict, List

NAME = "registry_queries"


def register(mcp, ctx) -> None:
    settings = ctx.settings
    for entry in ctx.registry.values():
        if not settings.category_allowed(entry.get("category", "uncategorized")):
            continue

        mode = entry.get("mode", "read")
        if mode == "write" and not settings.allow_write:
            continue

        description = entry.get("description") or entry["name"]
        if mode == "write":
            description = "[WRITE] " + description

        mcp.add_tool(_make_tool(entry, ctx), name=entry["name"], description=description)


def _make_tool(entry: Dict[str, Any], ctx):
    """Build a tool whose signature advertises exactly the query's params.

    The runtime function takes ``**kwargs`` for simplicity, but we attach a
    synthetic ``__signature__`` / ``__annotations__`` so FastMCP generates a
    proper input schema (one required string field per declared param).
    """
    cypher: str = entry["cypher"]
    expected: List[str] = list(entry.get("params", []))

    def tool(**kwargs: str) -> List[Dict[str, Any]]:
        missing = [p for p in expected if kwargs.get(p) is None]
        if missing:
            raise ValueError(
                f"missing required param(s): {missing}; expected {expected or 'none'}"
            )
        params = {p: kwargs[p] for p in expected}
        return ctx.executor.run(cypher, params)

    tool.__name__ = entry["name"]
    tool.__doc__ = entry.get("description") or entry["name"]
    tool.__signature__ = inspect.Signature(
        [
            inspect.Parameter(p, inspect.Parameter.KEYWORD_ONLY, annotation=str)
            for p in expected
        ]
    )
    tool.__annotations__ = {p: str for p in expected}
    tool.__annotations__["return"] = list
    return tool
