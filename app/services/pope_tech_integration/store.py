"""The database calls: one snapshot becomes one Metric node.

Writes go through the sanctioned create functions in the queries layer, never
raw Cypher, so the Metric gets the same checks as any other.
"""
# The queries layer must not be the first thing to load the data_api package,
# or it hits a circular import outside a Flask boot.
import app.endpoints.data_api  # noqa: F401
from app.database.graph_schema import Metric, Tracking
from app.database.queries.documentation.create import add_metric
from app.database.queries.evidence.update import assign_metric_to_yse
from app.database.queries.implementation.update import assign_documentation_to_implementation
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from app.services.pope_tech_integration import config
from app.services.pope_tech_integration.snapshot import (  # noqa: F401
    composite_key,
    snapshot_metric_dict,
)


def tracking_for(campus: str, tracking_titles: dict = None):
    """The campus's Tracking implementation, or None when no title is configured.

    A configured title that matches no node raises NotFoundError rather than
    saving the Metric unattached.
    """
    titles = config.TRACKING_TITLES if tracking_titles is None else tracking_titles
    title = titles.get(campus)
    if not title:
        return None
    tracking = Tracking.nodes.get_or_none(title=title)
    if tracking is None:
        raise NotFoundError(f"Tracking '{title}' for {campus} does not exist")
    return tracking


def save_snapshot(snapshot: dict, academic_year: str, year_identifier: str = None,
                  tracking_titles: dict = None) -> str:
    """Create the Metric, attach it to its campus's Tracking, optionally link it
    to a YSE, and return its composite key.

    The Tracking is resolved before anything is written, so a missing one leaves
    no orphan Metric. The has_metric edge counts in `academic_year`.
    Raises ValidationError when the snapshot is unusable or already stored, and
    NotFoundError when the academic year or the Tracking does not exist.
    """
    metric_dict = snapshot_metric_dict(snapshot, academic_year)
    tracking = tracking_for(snapshot["org"]["campus"], tracking_titles)

    add_metric(metric_dict)
    if tracking is not None:
        metric = Metric.nodes.get(composite_key=metric_dict["composite_key"])
        assign_documentation_to_implementation(
            implementation_id=tracking.unique_id,
            implementation_type="Tracking",
            documentation_type="metric",
            documentation_id=metric.unique_id,
            academic_year=academic_year,
        )
    if year_identifier:
        assign_metric_to_yse(year_identifier, metric_dict["composite_key"])
    return metric_dict["composite_key"]
