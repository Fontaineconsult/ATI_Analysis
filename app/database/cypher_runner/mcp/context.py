"""
The shared context handed to every feature's ``register(mcp, ctx)``.

A feature should reach for things through this object rather than importing
globals, so the wiring stays in one place and features stay testable.
"""

from dataclasses import dataclass
from typing import Any, Dict

from .config import Settings
from .executor import GraphExecutor


@dataclass
class ServerContext:
    registry: Dict[str, Any]   # name -> validated registry entry (from run_query.load_registry)
    executor: GraphExecutor    # the (lazily-connected) Neo4j executor
    settings: Settings         # resolved env settings
