"""
Class registries that map string keys to neomodel class objects.

Pure string vocabularies (status_levels, working_groups, plan_statuses, etc.)
live in app/data_config.py and are re-exported below for backward compatibility
with existing `from app.database.class_factory import <vocab>` callers.
"""
from app.database.graph_schema import (
    Process,
    Project,
    Procedure,
    Service,
    Guidance,
    Tracking,
    InternalPolicy,
    Document,
    Webpage,
    Message,
    Note,
    Metric,
)

# Re-export vocabularies from data_config so existing
# `from app.database.class_factory import <name>` callers keep working.
from app.data_config import (  # noqa: F401
    working_group_names,
    compsite_key_wg_names,
    academic_years,
    implementation_types,
    documentation_types,
    documentation_relationships,
    implementor_classes,
    status_levels,
    message_types,
    metric_types,
    working_group_names_web_query,
    working_groups,
    plan_statuses,
    evidence_descriptions,
    trajectory_choices,
)


implementation_classes = {
    "Process": Process,
    "Project": Project,
    "Procedure": Procedure,
    "Service": Service,
    "Guidance": Guidance,
    "Tracking": Tracking,
    "InternalPolicy": InternalPolicy,
}

documentation_classes = {
    "document": Document,
    "webpage": Webpage,
    "message": Message,
    "note": Note,
    "Note": Note,
    "metric": Metric,
}
