"""
Server entrypoint.

``build_server()`` wires every feature onto a FastMCP instance and returns it
with its context; ``main()`` runs it. The client (Claude Desktop / Code) launches
this over stdio with no arguments. A couple of debug flags are provided for
humans:

    python -m app.database.cypher_runner.mcp --self-test   # build + list tools, no DB
    python -m app.database.cypher_runner.mcp --check-db    # also verify Neo4j connectivity
    python -m app.database.cypher_runner.mcp               # run the server (stdio)

Dependencies: mcp, neo4j, pyyaml  ( pip install "mcp[cli]" neo4j pyyaml )
"""

import argparse
import sys

from .config import load_settings
from .context import ServerContext
from .executor import GraphExecutor
from .features import ALL_FEATURES


def _require_fastmcp():
    try:
        from mcp.server.fastmcp import FastMCP
    except ImportError:
        sys.exit('Missing dependency: mcp  ->  pip install "mcp[cli]"')
    return FastMCP


def build_server():
    """Construct the FastMCP server and its ServerContext.

    Registration is resilient: a feature that fails is logged to stderr and
    skipped, so a broken (or SDK-incompatible) feature degrades gracefully
    instead of taking the whole server down.
    """
    from ..run_query import load_registry  # validated name -> entry dict

    settings = load_settings()
    ctx = ServerContext(
        registry=load_registry(),
        executor=GraphExecutor(),
        settings=settings,
    )

    FastMCP = _require_fastmcp()
    mcp = FastMCP(settings.server_name)

    for feature in ALL_FEATURES:
        name = getattr(feature, "NAME", feature.__name__)
        try:
            feature.register(mcp, ctx)
        except Exception as exc:  # noqa: BLE001 - one bad feature must not kill the server
            print(f"[ati-mcp] feature '{name}' failed to register: {exc}", file=sys.stderr)

    return mcp, ctx


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="ATI Cypher MCP server.")
    ap.add_argument("--self-test", action="store_true",
                    help="Build the server and report registered tools, then exit (no DB).")
    ap.add_argument("--check-db", action="store_true",
                    help="Like --self-test, but also verify Neo4j connectivity.")
    args = ap.parse_args(argv)

    mcp, ctx = build_server()

    if args.self_test or args.check_db:
        try:
            # FastMCP keeps tools in an internal manager; fall back gracefully
            # across SDK versions by counting whatever it exposes.
            tools = getattr(getattr(mcp, "_tool_manager", None), "_tools", {})
            print(f"[ati-mcp] server '{ctx.settings.server_name}' built — "
                  f"{len(tools)} tool(s), write={ctx.settings.allow_write}, "
                  f"transport={ctx.settings.transport}")
            for tool_name in sorted(tools):
                print(f"  - {tool_name}")
            if args.check_db:
                ctx.executor.verify()
                print("[ati-mcp] Neo4j connectivity: OK")
        finally:
            ctx.executor.close()
        return

    try:
        mcp.run(transport=ctx.settings.transport)
    finally:
        ctx.executor.close()


if __name__ == "__main__":
    main()
