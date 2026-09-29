"""The curated query catalog, loaded and validated. Nothing here touches a database.

``query_registry.yaml`` is the source of truth for every named read the agent paths
(CLI and MCP) may run. This module is the one loader both paths share, so it must stay
free of driver imports: importing it never opens Bolt.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - environment dependent
    sys.exit("Missing dependency: pyyaml  ->  pip install pyyaml")

REGISTRY_PATH = Path(__file__).with_name("query_registry.yaml")


def load_registry(path: Path = REGISTRY_PATH) -> dict:
    """Load the YAML registry into a name -> entry dict, validating as we go."""
    if not path.exists():
        sys.exit(f"Registry not found: {path}")
    with path.open(encoding="utf-8") as fh:
        entries = yaml.safe_load(fh) or []

    registry, errors = {}, []
    for i, e in enumerate(entries):
        name = e.get("name")
        if not name:
            errors.append(f"entry #{i} has no 'name'")
            continue
        if name in registry:
            errors.append(f"duplicate name '{name}'")
        mode = e.get("mode", "read")
        if mode not in ("read", "write"):
            errors.append(f"'{name}': mode must be read|write, got '{mode}'")
        if not e.get("cypher", "").strip():
            errors.append(f"'{name}': empty cypher")
        e.setdefault("params", [])
        e.setdefault("category", "uncategorized")
        e.setdefault("description", "")
        registry[name] = e

    if errors:
        sys.exit("Registry validation failed:\n  - " + "\n  - ".join(errors))
    return registry
