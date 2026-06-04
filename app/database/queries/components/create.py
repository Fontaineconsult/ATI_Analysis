#
# COMPONENT CREATE QUERIES
#
import re

from app.database.graph_schema import *
from app.database.identifiers import make_component_identifier
from app.data_config import component_kinds
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# The literal `parent` coordinate for a component not (yet) attached to an interface.
STANDALONE_PARENT = "standalone"


def _slugify(value: str) -> str:
    """
    Normalize free text into the hyphenated slug form used inside component_identifiers
    (lowercase, non-alphanumeric runs collapsed to a single '-', no leading/trailing '-').
    'Video Player' -> 'video-player'. Mirrors the helper in queries/interfaces/create.py.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return slug.strip("-")


def create_component(
    title: str,
    interface_identifier: str = None,
    component_kind: str = None,
    description: str = None,
) -> Component:
    """
    Create a Component (a WCAG-grain element of an Interface — where a success criterion
    or a VPAT line item attaches).

    Identity is composite: the unique `component_identifier` is built from the parent
    Interface's identifier (or the literal 'standalone' when unattached) plus a slug of
    `title`, via `make_component_identifier`. `kind` lives here (Component is
    kind-homogeneous), NOT on the Interface.

    This is the only sanctioned creation path for Component: it resolves the optional
    parent Interface, builds the identifier in canonical format, validates the
    `component_kind` vocabulary, and guards the unique index with a friendly error.

    `interface_identifier` is OPTIONAL (part_of is ZeroOrOne) — a component may be
    created before being attached, then linked via assign_parent_interface_to_component.
    Guidelines (must_satisfy) are attached via the assign_* functions in
    queries/components/update.py.

    Parameters
    ----------
    title : str (required)
        The element name, e.g. 'Video Player'. Identity coordinate (in the key).
    interface_identifier : str, optional
        The parent Interface; absent => parent is 'standalone'. 404 if named-but-missing.
    component_kind : str, optional — one of `component_kinds` (functional role at WCAG grain).
    description : str, optional.

    Raises
    ------
    ValidationError on bad/missing input or a duplicate component_identifier.
    NotFoundError if `interface_identifier` names an Interface that doesn't exist.
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    if component_kind is not None and component_kind not in component_kinds:
        raise ValidationError(
            f"component_kind must be one of {list(component_kinds.keys())}; got {component_kind!r}"
        )

    title_slug = _slugify(title)
    if not title_slug:
        raise ValidationError(f"title {title!r} does not yield a usable slug")

    # Resolve the optional parent interface up front so a bad reference is a 404 before we
    # create a dangling node, and so it supplies the identifier's `parent` coordinate.
    interface = None
    parent = STANDALONE_PARENT
    if interface_identifier:
        try:
            interface = Interface.nodes.get(interface_identifier=interface_identifier)
        except Interface.DoesNotExist:
            raise NotFoundError(f"Interface {interface_identifier!r} not found")
        parent = interface.interface_identifier

    component_identifier = make_component_identifier(parent, title_slug)

    if Component.nodes.filter(component_identifier=component_identifier):
        raise ValidationError(
            f"Component with component_identifier {component_identifier!r} already exists"
        )

    try:
        component = Component(
            component_identifier=component_identifier,
            title=title,
            description=description,
            component_kind=component_kind,
        )
        component.save()
        if interface is not None:
            component.part_of.connect(interface)
        return component
    except Exception as e:
        raise CrudError(f"Failed to create Component {component_identifier!r}: {e}")
