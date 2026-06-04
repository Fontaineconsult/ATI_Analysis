#
# INTERFACE READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.data_config import functions, audiences
from app.data_config import coverage_domains as COVERAGE_DOMAINS
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


# Implementations that remediate a node, by reverse accessor. The accessor names are
# identical on Asset and Interface (both carry remediated_by_* RelationshipFrom edges
# on the shared `remediates` rel-type), so one tuple drives both.
_REMEDIATION_ACCESSORS = (
    ("Process",   "remediated_by_processes"),
    ("Project",   "remediated_by_projects"),
    ("Procedure", "remediated_by_procedures"),
    ("Service",   "remediated_by_services"),
)


def _remediation_list(interface) -> list:
    """All implementations remediating this interface (via remediates_interface), tagged by type."""
    out = []
    for label, accessor in _REMEDIATION_ACCESSORS:
        for impl in getattr(interface, accessor).all():
            out.append({"type": label, "title": impl.title, "unique_id": impl.unique_id})
    return out


def _serialize_interface_detail(interface) -> dict:
    """
    Full interface projection: identity + backing asset(s) + remediating
    implementations + documentation, plus the derived coverage flag.

    The headline derivation is `uncovered`: an interface is UNCOVERED when no
    implementation remediates it — the specific-coverage edge
    (implementation -[:remediates_interface]-> interface). That is the Title II
    §35.205 unmet-duty signal for interfaces.

    NOTE: general / "Rule 2" coverage (an institution-level implementation sweeping
    this interface's KIND rather than this instance) is NOT yet factored in, so
    `uncovered` may over-report until that sweep is modeled. See get_uncovered_interfaces.
    """
    presented_assets = list(interface.presented_by.all())
    remediations = _remediation_list(interface)
    is_remediated = bool(remediations)

    data = interface.serialize()
    data.update({
        "presented_by": [a.serialize() for a in presented_assets],
        "accountable_working_groups": [
            {"unique_id": wg.unique_id, "name": wg.name}
            for wg in interface.accountable_working_groups.all()
        ],
        "remediated_by": remediations,
        "described_by": [d.serialize() for d in interface.described_by.all()],
        "described_on": [w.serialize() for w in interface.described_on.all()],
        "notes": [n.serialize() for n in interface.notes.all()],
        "is_asset_backed": bool(presented_assets),
        "is_remediated": is_remediated,
        # Rule-2/general coverage deferred (see above).
        "uncovered": not is_remediated,
    })
    return data


def get_all_interfaces() -> list:
    """All Interface nodes as lightweight summaries, ordered by identifier."""
    return [i.serialize() for i in Interface.nodes.order_by("interface_identifier").all()]


def get_interface(interface_identifier: str) -> dict:
    """Full detail for one Interface. Raises NotFoundError if it doesn't exist."""
    try:
        interface = Interface.nodes.get(interface_identifier=interface_identifier)
    except Interface.DoesNotExist:
        raise NotFoundError(f"Interface {interface_identifier!r} not found")
    return _serialize_interface_detail(interface)


def get_interfaces_by_function(function: str) -> list:
    """All interfaces serving a given function (summaries). Raises ValidationError on a bad function.

    `function` is single-valued and identity-bearing, so this is a plain property filter."""
    if function not in functions:
        raise ValidationError(
            f"function must be one of {list(functions.keys())}; got {function!r}"
        )
    return [
        i.serialize()
        for i in Interface.nodes.filter(function=function).order_by("interface_identifier")
    ]


# coverage_domains is multi-valued (an ArrayProperty), so membership is tested with `IN`
# against the list rather than equality. Done in Cypher so the match happens in-DB.
_INTERFACES_BY_COVERAGE_DOMAIN_QUERY = """
    MATCH (i:Interface)
    WHERE $domain IN i.coverage_domains
    RETURN i
    ORDER BY i.interface_identifier
"""


def get_interfaces_by_coverage_domain(coverage_domain: str) -> list:
    """All interfaces in a given coverage domain (summaries). Raises ValidationError on a bad domain."""
    if coverage_domain not in COVERAGE_DOMAINS:
        raise ValidationError(
            f"coverage_domain must be one of {list(COVERAGE_DOMAINS.keys())}; got {coverage_domain!r}"
        )
    results, _ = db.cypher_query(_INTERFACES_BY_COVERAGE_DOMAIN_QUERY, {"domain": coverage_domain})
    return [Interface.inflate(row[0]).serialize() for row in results]


# audience is multi-valued (an ArrayProperty), so membership is tested with `IN`
# against the list rather than equality. Done in Cypher so the match happens in-DB.
_INTERFACES_BY_AUDIENCE_QUERY = """
    MATCH (i:Interface)
    WHERE $audience IN i.audience
    RETURN i
    ORDER BY i.interface_identifier
"""


def get_interfaces_by_audience(audience: str) -> list:
    """All interfaces governed by a given audience (summaries). Raises ValidationError on a bad audience."""
    if audience not in audiences:
        raise ValidationError(
            f"audience must be one of {list(audiences.keys())}; got {audience!r}"
        )
    results, _ = db.cypher_query(_INTERFACES_BY_AUDIENCE_QUERY, {"audience": audience})
    return [Interface.inflate(row[0]).serialize() for row in results]


_INTERFACES_FOR_ASSET_QUERY = """
    MATCH (i:Interface)-[:presented_by]->(:Asset {asset_identifier: $asset_identifier})
    RETURN i
    ORDER BY i.interface_identifier
"""


def get_interfaces_for_asset(asset_identifier: str) -> list:
    """All interfaces presented by the given asset (summaries)."""
    results, _ = db.cypher_query(_INTERFACES_FOR_ASSET_QUERY, {"asset_identifier": asset_identifier})
    return [Interface.inflate(row[0]).serialize() for row in results]


# The interface elevation query: interfaces that NO implementation remediates (no
# incoming remediates_interface edge). These are the Title II §35.205 unmet-duty signals.
#
# CAVEAT: general / "Rule 2" coverage (an institution-level implementation sweeping the
# interface's KIND) is NOT modeled here yet, so this may over-report uncovered interfaces.
# Tighten this query once kind-level sweeps exist; until then it is a deliberate
# upper bound, not a precise set.
_UNCOVERED_INTERFACES_QUERY = """
    MATCH (i:Interface)
    WHERE NOT (i)<-[:remediates_interface]-()
    RETURN i
    ORDER BY i.interface_identifier
"""


def get_uncovered_interfaces() -> list:
    """
    Interfaces that no implementation remediates — the modeled signal that the
    accessibility duty for that interaction point is unmet. Returns full detail.
    See the query's caveat about deferred general/Rule-2 coverage.
    """
    results, _ = db.cypher_query(_UNCOVERED_INTERFACES_QUERY)
    return [_serialize_interface_detail(Interface.inflate(row[0])) for row in results]
