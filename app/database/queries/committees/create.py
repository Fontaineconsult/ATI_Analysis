#
# COMMITTEE CREATE QUERIES
#
from app.database.graph_schema import *
from app.database.identifiers import (
    make_campus_plan_identifier,
    make_working_group_plan_identifier,
)
from app.data_config import working_group_names
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Working-group abbreviations that are valid in plan identifiers and accepted
# by create_working_group_plan / create_campus_plan below. Mirrors the suffix
# used in SuccessIndicator.composite_key.
WORKING_GROUP_ABBREVS = ("web", "pro", "ins")


def create_working_group_plan(campus_abbrev: str, year_name: str, working_group_abbrev: str) -> WorkingGroupPlan:
    """
    Create a single WorkingGroupPlan for (campus, year, working_group).

    Connects the required edges:
      - working_group -> ATIWorkingGroup

    The CampusPlan -> WorkingGroupPlan edge is the responsibility of the caller
    (typically `create_campus_plan` below), since this function does not know
    which CampusPlan it should attach to.

    Raises ValidationError on bad inputs, NotFoundError if the working group
    or campus or year is missing, CrudError on a create failure.
    """
    if working_group_abbrev not in WORKING_GROUP_ABBREVS:
        raise ValidationError(
            f"working_group_abbrev must be one of {WORKING_GROUP_ABBREVS}; got {working_group_abbrev!r}"
        )

    try:
        wg_full_name = working_group_names[working_group_abbrev]
    except KeyError:
        raise ValidationError(f"Unknown working group abbreviation: {working_group_abbrev!r}")

    try:
        wg_node = ATIWorkingGroup.nodes.get(name=wg_full_name)
    except ATIWorkingGroup.DoesNotExist:
        raise NotFoundError(f"ATIWorkingGroup '{wg_full_name}' not found")

    plan_identifier = make_working_group_plan_identifier(year_name, campus_abbrev, working_group_abbrev)

    existing = WorkingGroupPlan.nodes.filter(plan_identifier=plan_identifier)
    if existing:
        raise ValidationError(f"WorkingGroupPlan with plan_identifier {plan_identifier!r} already exists")

    try:
        wgp = WorkingGroupPlan(plan_identifier=plan_identifier)
        wgp.save()
        wgp.working_group.connect(wg_node)
        return wgp
    except Exception as e:
        raise CrudError(f"Failed to create WorkingGroupPlan {plan_identifier!r}: {e}")


def create_campus_plan(campus_abbrev: str, year_name: str) -> CampusPlan:
    """
    Create a CampusPlan and its three child WorkingGroupPlans (web/pro/ins).

    Connects the required edges:
      - campus -> Campus
      - academic_year -> AcademicYear
      - working_group_plans -> WorkingGroupPlan (x3, one per group)

    Raises ValidationError if a plan already exists for (campus, year),
    NotFoundError if the campus or year node is missing, CrudError on save failure.

    Note: this is the only sanctioned creation path for CampusPlan. Calling
    `CampusPlan(...).save()` directly bypasses the required-relationship wiring
    and the working-group-plan stubs — use this function instead.
    """
    try:
        campus_node = Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus with abbreviation {campus_abbrev!r} not found")

    try:
        year_node = AcademicYear.nodes.get(name=year_name)
    except AcademicYear.DoesNotExist:
        raise NotFoundError(f"AcademicYear {year_name!r} not found")

    plan_identifier = make_campus_plan_identifier(year_name, campus_abbrev)

    existing = CampusPlan.nodes.filter(plan_identifier=plan_identifier)
    if existing:
        raise ValidationError(f"CampusPlan with plan_identifier {plan_identifier!r} already exists")

    try:
        plan = CampusPlan(plan_identifier=plan_identifier)
        plan.save()
        plan.campus.connect(campus_node)
        plan.academic_year.connect(year_node)
    except Exception as e:
        raise CrudError(f"Failed to create CampusPlan {plan_identifier!r}: {e}")

    for wg_abbrev in WORKING_GROUP_ABBREVS:
        wgp = create_working_group_plan(campus_abbrev, year_name, wg_abbrev)
        plan.working_group_plans.connect(wgp)

    return plan
