#
# QUERY CREATE QUERIES
#
# A Query is a pending question raised under a WorkingGroupPlan. The plan anchor encodes
# campus + academic year + working group, so it is the only required edge. This module is
# the only sanctioned creation path: neomodel cannot enforce the required anchor at save
# time, so create_query wires it explicitly.
#
from datetime import date

from app.database.graph_schema import *
from app.database.identifiers import make_working_group_plan_identifier
from app.data_config import query_categories
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Accepts working-group abbrevs, full names, AND the frontend route segments, all
# normalized to the 3-letter code used in WorkingGroupPlan.plan_identifier.
WORKING_GROUP_ABBREV = {
    "web": "web", "pro": "pro", "ins": "ins",
    "Web": "web", "Procurement": "pro", "Instructional Materials": "ins",
    "procurement": "pro", "instructional-materials": "ins",
}


def _resolve_working_group_plan(working_group_plan_identifier=None, campus_abbrev=None,
                                year_name=None, working_group=None) -> WorkingGroupPlan:
    """
    Resolve the anchor WorkingGroupPlan either directly by its plan_identifier, or by
    building the identifier from (year, campus, working_group).

    Raises ValidationError if neither path has enough info or the working group is
    unknown, NotFoundError if the plan doesn't exist.
    """
    identifier = working_group_plan_identifier
    if not identifier:
        if not (campus_abbrev and year_name and working_group):
            raise ValidationError(
                "Provide working_group_plan_identifier, or campus_abbrev + year_name + working_group"
            )
        abbrev = WORKING_GROUP_ABBREV.get(working_group)
        if not abbrev:
            raise ValidationError(
                f"Unknown working group {working_group!r}; expected one of {sorted(set(WORKING_GROUP_ABBREV))}"
            )
        identifier = make_working_group_plan_identifier(year_name, campus_abbrev, abbrev)

    try:
        return WorkingGroupPlan.nodes.get(plan_identifier=identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(
            f"WorkingGroupPlan {identifier!r} not found — a campus plan must exist for that "
            f"campus and year before a query can be raised under it"
        )


def create_query(question: str,
                 working_group_plan_identifier: str = None,
                 campus_abbrev: str = None,
                 year_name: str = None,
                 working_group: str = None,
                 category: str = None,
                 detail: str = None,
                 raised_by_unique_id: str = None) -> Query:
    """
    Create a Query anchored to a WorkingGroupPlan.

    The ONLY sanctioned creation path: it resolves and connects the required anchor edge
    (which neomodel can't enforce at save time) and validates the category vocabulary.
    Identify the anchor either with `working_group_plan_identifier` or with the
    (campus_abbrev, year_name, working_group) triple.

    Raises ValidationError on bad input, NotFoundError if the plan/person is missing,
    CrudError on save failure.
    """
    if not question or not question.strip():
        raise ValidationError("question is required")

    if category is not None and category not in query_categories:
        raise ValidationError(
            f"Invalid category {category!r}; must be one of {list(query_categories.keys())}"
        )

    wgp = _resolve_working_group_plan(
        working_group_plan_identifier, campus_abbrev, year_name, working_group
    )

    raiser = None
    if raised_by_unique_id:
        try:
            raiser = Person.nodes.get(unique_id=raised_by_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {raised_by_unique_id!r} not found")

    try:
        query = Query(
            question=question.strip(),
            detail=(detail.strip() if isinstance(detail, str) else detail) or None,
            category=category,
            status="open",
            date_raised=date.today(),
        )
        query.save()
        query.working_group_plan.connect(wgp)
        if raiser:
            query.query_raised_by.connect(raiser)
        return query
    except Exception as e:
        raise CrudError(f"Failed to create Query: {e}")
