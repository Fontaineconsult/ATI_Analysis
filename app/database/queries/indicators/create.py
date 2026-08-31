#
# INDICATOR CREATE QUERIES
#
from datetime import datetime as dt
from os import removedirs

from neomodel import db
from app.database.graph_schema import *
from app.data_config import (working_group_names, compsite_key_wg_names,
                             evidence_requirement_levels, evidence_requirement_elements,
                             evidence_requirement_rubric_dimensions)
from app.database.identifiers import make_evidence_requirement_handle

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError

from datetime import datetime as dt
from dateutil.parser import parse as parse_date

def create_success_indicator(number,
                             goal_number,  # number
                             sub_committee,
                             success_indicator_text,
                             date_added=None,
                             removed=False,
                             examples_of_evidence=None,
                             established_example=None,
                             managed_example=None,
                             optimizing_example=None,
                             introduced_in_year=None):
    # DateProperty deflation requires a datetime.date — never a string. The None
    # branch previously produced a strftime string, which neomodel 6 rejects.
    if date_added is None:
        date_added = dt.now().date()
    elif isinstance(date_added, str):
        try:
            date_added = parse_date(date_added).date()
        except ValueError:
            raise ValidationError("date_added must be in a valid 'YYYY-MM-DD' format if provided as a string.")

    try:
        working_group = working_group_names[sub_committee]
    except KeyError:
        raise ValidationError('Invalid sub-committee name. One of: pro, web, ins')

    composite_key = f'{goal_number}.{number}-{compsite_key_wg_names[sub_committee]}'

    params = {
        'wg_name': working_group,
        'goal_number': int(goal_number)
    }

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    try:
        results, _ = db.cypher_query(query, params)
        if not results:
            raise NotFoundError(f'Goal with number {params["goal_number"]} does not exist in working group {params["wg_name"]}')
        goal_node = Goal.inflate(results[0][0])
    except Exception as e:
        raise CrudError(f"Failed to find or create goal node: {str(e)}")

    existing_indicator = SuccessIndicator.nodes.filter(composite_key=composite_key).all()
    if existing_indicator:
        raise ValidationError(f'SuccessIndicator with composite_key "{composite_key}" already exists.')

    try:
        indicator = SuccessIndicator(
            number=number,
            success_indicator=success_indicator_text,
            composite_key=composite_key,
            date_added=date_added,
            removed=removed,
            examples_of_evidence=examples_of_evidence or [],
            established_example=established_example,
            managed_example=managed_example,
            optimizing_example=optimizing_example,
            introduced_in_year=introduced_in_year
        )
        indicator.save()
        goal_node.supporting_success_indicators.connect(indicator)
        return True
    except Exception as e:
        raise CrudError(f"Failed to create SuccessIndicator: {str(e)}")



def add_goal(goal, goal_number, name, removed, working_group):
    try:
        working_group = working_group_names[working_group]
    except KeyError:
        raise ValidationError('Invalid working group name. One of: pro, web, ins')

    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})
    RETURN wg
    """

    try:
        results, _ = db.cypher_query(query, params)
        if not results:
            raise NotFoundError(f'ATIWorkingGroup with name "{params["wg_name"]}" does not exist.')
        working_group_node = ATIWorkingGroup.inflate(results[0][0])
    except Exception as e:
        raise CrudError(f"Failed to retrieve working group: {str(e)}")

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    try:
        results, _ = db.cypher_query(query, params)
        if results:
            raise ValidationError(f'Goal with number {params["goal_number"]} already exists in {params["wg_name"]}')
    except Exception as e:
        raise CrudError(f"Failed to check for existing goal: {str(e)}")

    try:
        goal_node = Goal(
            goal=goal,
            goal_number=goal_number,
            name=name,
            removed=removed
        )
        goal_node.save()
        working_group_node.responsible_for.connect(goal_node)
        return True
    except Exception as e:
        raise CrudError(f"Failed to create goal: {str(e)}")


def add_evidence_requirement(composite_key,
                             level,
                             requirement,
                             element=None,
                             rubric_dimension=None,
                             lead_in=None):
    """Create one EvidenceRequirement and attach it to its SuccessIndicator.

    The sanctioned creation path: an EvidenceRequirement with no `has_evidence_requirement`
    edge is meaningless — it is one element of a specific indicator's bar — and neomodel
    cannot enforce a required RelationshipTo at save time, so the invariant lives here.

    `seq` is assigned as max+1 within (composite_key, level), which is also what makes the
    handle unique. Concurrency is not a concern here: this is a single-curator settings
    form, and the unique index on handle is the backstop if it ever becomes one.
    """
    requirement = (requirement or "").strip()
    if not requirement:
        raise ValidationError("An evidence requirement needs requirement text.")
    if level not in evidence_requirement_levels:
        raise ValidationError(
            f"Unknown level '{level}'. Expected one of: {', '.join(evidence_requirement_levels)}."
        )
    element = (element or None)
    if element and element not in evidence_requirement_elements:
        raise ValidationError(
            f"Unknown element '{element}'. Expected one of: {', '.join(evidence_requirement_elements)}."
        )

    try:
        indicator = SuccessIndicator.nodes.get(composite_key=composite_key)
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator with composite_key '{composite_key}' not found.")

    try:
        rows, _ = db.cypher_query(
            "MATCH (er:EvidenceRequirement {composite_key: $ck, level: $lvl}) "
            "RETURN coalesce(max(er.seq), 0)",
            {"ck": composite_key, "lvl": level},
        )
        seq = (rows[0][0] if rows else 0) + 1

        # Default the dimension from the element when the caller doesn't state one, so a
        # requirement stays gradeable against the same three rubric dimensions.
        if rubric_dimension is None and element:
            rubric_dimension = evidence_requirement_rubric_dimensions.get(element)

        node = EvidenceRequirement(
            handle=make_evidence_requirement_handle(composite_key, level, seq),
            composite_key=composite_key,
            level=level,
            seq=seq,
            element=element,
            requirement=requirement,
            rubric_dimension=rubric_dimension,
            lead_in=(lead_in or None),
        ).save()
        indicator.evidence_requirements.connect(node)
        return node
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        raise CrudError(f"Failed to add evidence requirement to {composite_key}: {e}")
