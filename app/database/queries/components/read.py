#
# COMPONENT READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.data_config import component_kinds
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


def _serialize_component_detail(component) -> dict:
    """
    Full component projection: identity + parent Interface + the WCAG Guidelines it must
    satisfy + documentation. Kind lives on the component (serialize() carries it).
    """
    parent = component.part_of.single()

    data = component.serialize()
    data.update({
        "part_of": (
            {
                "interface_identifier": parent.interface_identifier,
                "title": parent.title,
                "unique_id": parent.unique_id,
            }
            if parent else None
        ),
        "must_satisfy": [g.serialize() for g in component.must_satisfy.all()],
        "described_by": [d.serialize() for d in component.described_by.all()],
        "notes": [n.serialize() for n in component.notes.all()],
    })
    return data


def get_all_components() -> list:
    """All Component nodes as lightweight summaries, ordered by identifier."""
    return [c.serialize() for c in Component.nodes.order_by("component_identifier").all()]


def get_component(component_identifier: str) -> dict:
    """Full detail for one Component. Raises NotFoundError if it doesn't exist."""
    try:
        component = Component.nodes.get(component_identifier=component_identifier)
    except Component.DoesNotExist:
        raise NotFoundError(f"Component {component_identifier!r} not found")
    return _serialize_component_detail(component)


_COMPONENTS_FOR_INTERFACE_QUERY = """
    MATCH (c:Component)-[:part_of]->(:Interface {interface_identifier: $interface_identifier})
    RETURN c
    ORDER BY c.component_identifier
"""


def get_components_for_interface(interface_identifier: str) -> list:
    """All components that are part_of the given interface (summaries)."""
    results, _ = db.cypher_query(
        _COMPONENTS_FOR_INTERFACE_QUERY, {"interface_identifier": interface_identifier}
    )
    return [Component.inflate(row[0]).serialize() for row in results]


def get_components_by_kind(component_kind: str) -> list:
    """All components of a given kind (summaries). Raises ValidationError on a bad kind."""
    if component_kind not in component_kinds:
        raise ValidationError(
            f"component_kind must be one of {list(component_kinds.keys())}; got {component_kind!r}"
        )
    return [
        c.serialize()
        for c in Component.nodes.filter(component_kind=component_kind).order_by("component_identifier")
    ]
