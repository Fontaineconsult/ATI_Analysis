from datetime import date

from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError

from neomodel import db

from app.database.graph_schema import Person, ATIWorkingGroup, Campus
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError
from neomodel import db, DoesNotExist

def update_person_by_employee_id(data: dict) -> Person:
    """
    Update a person node by employee_id and refresh the in_ati_working_group relationships.

    :param data: The data to update the person with.
    :return: The updated Person node.
    """

    employee_id = data.get('employee_id')
    if not employee_id:
        raise ValueError("Employee ID is required.")

    try:
        # Start a transaction
        with db.transaction:
            # Fetch the person node by employee_id
            person = Person.nodes.get(employee_id=employee_id)

            # Update person's properties (only update properties provided in data)
            if 'active' in data and data['active'] is not None:
                person.active = data['active']
            if 'ati_role' in data and data['ati_role'] is not None:
                person.ati_role = data['ati_role']
            if 'can_approve_yse' in data and data['can_approve_yse'] is not None:
                person.can_approve_yse = data['can_approve_yse']
            if 'email' in data and data['email'] is not None:
                person.email = data['email']
            if 'name' in data and data['name'] is not None:
                person.name = data['name']
            if 'title' in data and data['title'] is not None:
                person.title = data['title']
            if 'non_committee_member_active' in data and data['non_committee_member_active'] is not None:
                person.non_committee_member_active = data['non_committee_member_active']

            # Save updated person node
            person.save()

            # Update host_campus relationship if provided
            if 'host_campus' in data:
                person.host_campus.disconnect_all()
                abbrev = data.get('host_campus')
                if abbrev:
                    try:
                        campus = Campus.nodes.get(abbreviation=abbrev)
                    except DoesNotExist:
                        raise NotFoundError(f"Campus with abbreviation '{abbrev}' not found.")
                    person.host_campus.connect(campus)

            # Update relationships if 'workingGroups' is provided in data
            if 'workingGroups' in data:
                working_groups = data.get('workingGroups') or []
                if not isinstance(working_groups, list):
                    raise ValueError("The 'workingGroups' field must be a list.")

                # Clear all existing relationships to working groups
                person.in_ati_working_group.disconnect_all()

                # Re-establish relationships based on the provided working groups
                for wg_data in working_groups:
                    wg_name = wg_data.get('name')
                    if wg_name:
                        # Fetch the working group node by its name
                        try:
                            working_group = ATIWorkingGroup.nodes.get(name=wg_name)
                        except DoesNotExist:
                            raise NotFoundError(f"ATIWorkingGroup with name '{wg_name}' not found.")

                        # Create a relationship between the person and the working group
                        person.in_ati_working_group.connect(working_group)

        return person

    except DoesNotExist:
        raise NotFoundError(f"Person with employee_id '{employee_id}' not found.")
    except (NotFoundError, ValueError):
        raise
    except Exception as e:
        raise CrudError(f"Error updating person with employee_id '{employee_id}': {e}")


def set_person_role_holdings(employee_id: str, holdings: list) -> Person:
    """
    Replace a person's role holdings (holds_role) with the given set. Replace-semantics:
    `holdings` is the full intended set; each is
    {role_handle, in_position_description, pd_description}. The PD-tracking props live on
    the holds_role edge (RoleHoldingRel) — whether the role is in the person's position
    description, and free text on how it's addressed.

    Raises ValidationError on a bad list / missing role_handle, NotFoundError if the
    person or any role is missing, CrudError on failure. Returns the person node.
    """
    if not employee_id:
        raise ValidationError("employee_id is required")
    if holdings is None:
        holdings = []
    if not isinstance(holdings, list):
        raise ValidationError("roles must be a list of role holdings")

    try:
        person = Person.nodes.get(employee_id=employee_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person with employee_id {employee_id!r} not found")

    # Resolve all roles up front so a bad handle fails before we mutate any edges.
    resolved = []
    for h in holdings:
        h = h or {}
        handle = h.get("role_handle")
        if not handle:
            raise ValidationError("each role holding requires a role_handle")
        try:
            role = Role.nodes.get(handle=handle)
        except Role.DoesNotExist:
            raise NotFoundError(f"Role {handle!r} not found")
        resolved.append((role, h))

    try:
        person.holds_role.disconnect_all()
        seen = set()
        for role, h in resolved:
            if role.handle in seen:
                continue
            seen.add(role.handle)
            person.holds_role.connect(role, {
                "in_position_description": bool(h.get("in_position_description", False)),
                "pd_description": h.get("pd_description"),
                "added_date": date.today(),
            })
        return person
    except Exception as e:
        raise CrudError(f"Failed to set role holdings for {employee_id!r}: {e}")

