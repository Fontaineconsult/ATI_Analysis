"""
Feature: discovery tools.

Lets a client (or the model) ask *what* is available and *how* a query works,
without trial-and-error. Pure metadata — these tools never touch the database,
so they answer even when no graph is connected.

  - list_queries(category=None) -> the catalog (name/category/mode/params/desc)
  - describe_query(name)        -> one query's full definition, including Cypher
"""

from typing import Any, Dict, List, Optional

NAME = "catalog"


def register(mcp, ctx) -> None:
    registry = ctx.registry

    def list_queries(category: Optional[str] = None) -> List[Dict[str, Any]]:
        """List the curated ATI graph queries, optionally filtered by category."""
        rows = [
            {
                "name": e["name"],
                "category": e.get("category", "uncategorized"),
                "mode": e.get("mode", "read"),
                "description": e.get("description", ""),
                "params": e.get("params", []),
            }
            for e in registry.values()
            if category is None or e.get("category") == category
        ]
        return sorted(rows, key=lambda r: (r["category"], r["name"]))

    def describe_query(name: str) -> Dict[str, Any]:
        """Show the Cypher and parameters for one curated query by name."""
        entry = registry.get(name)
        if not entry:
            raise ValueError(f"unknown query '{name}' (try list_queries)")
        return {
            "name": entry["name"],
            "category": entry.get("category", "uncategorized"),
            "mode": entry.get("mode", "read"),
            "description": entry.get("description", ""),
            "params": entry.get("params", []),
            "cypher": entry["cypher"].rstrip(),
        }

    mcp.add_tool(
        list_queries,
        name="list_queries",
        description="List the curated ATI graph queries available as tools.",
    )
    mcp.add_tool(
        describe_query,
        name="describe_query",
        description="Show the Cypher and parameters for one curated query by name.",
    )
