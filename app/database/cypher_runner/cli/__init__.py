"""neo4j-cli integration: the transport layer for agent access to the graph.

See README.md in this folder. Nothing here holds a credential; the CLI reads it from the
OS keyring. ``transport`` is the only module that spawns the CLI, and no module in this
package imports the neo4j driver.
"""
from .transport import (  # noqa: F401
    CliError,
    CliNotFound,
    CliResult,
    build_command,
    find_cli,
    format_param,
    join_statements,
    rows,
    run,
)
