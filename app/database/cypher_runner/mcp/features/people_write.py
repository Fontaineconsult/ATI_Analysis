"""
Feature: people & org-units — create/update Person, Department, College, Vendor and their
membership/assignment relationships (write-gated).

The write complement to the people/org discovery queries (``find_person``, ``people_by_campus``,
``people_in_working_group``, ``departments_by_campus``, ``list_vendors``, ``list_campuses``).
An agent resolves who/what it is talking about with those, then records changes with these:

  create_person / update_person                      -> Person node (+ host campus, working groups)
  assign_person_to_working_group                     -> Person -[:participates_in]-> ATIWorkingGroup
  assign_person_to_department / _college / _vendor   -> unit -[:employs]-> Person
  unassign_person_from_org_unit                      -> removes an employs edge (any unit type)
  create_department / create_college                 -> node (+ optional operates_under_campus)
  create_vendor / update_vendor                      -> Vendor node

Identifier conventions (mixed in the graph — each tool says which it takes):
  people      -> employee_id (every tool here keys people this way)
  campuses    -> create_person takes the ABBREVIATION (e.g. 'sfsu'); create_department /
                 create_college take the full Campus.name. Discover both via list_campuses.
  work groups -> full ATIWorkingGroup.name: 'Web', 'Procurement', 'Instructional Materials'
                 ('Steering' exists in the graph as a data-only coordination shell).

Independence (same rule as notes_write / ontology_write): each tool only CALLS the sanctioned
queries functions (the same ones the Flask endpoints use). No CRUD logic lives here, and the
queries layer never imports this package. Queries imports happen INSIDE the tool body, after
``ensure_app()``, so registration stays app-free and the warm-up / circular-import rule holds.

Stdout shielding: several sanctioned org-unit functions ``print()`` progress messages. Under the
stdio transport stdout IS the JSON-RPC channel, so every queries call here runs inside
``_quiet()``, which redirects stdout to stderr for the duration of the call.

Gating: registers ONLY when ATI_MCP_ALLOW_WRITE is on (mirrors the other *_write features).
All descriptions are prefixed [WRITE].
"""

import contextlib
import sys
from typing import Optional

from ._appbootstrap import ensure_app

NAME = "people_write"


def _quiet():
    """Redirect stdout to stderr while a queries function runs (stdio-transport safety)."""
    return contextlib.redirect_stdout(sys.stderr)


def _person_dict(person) -> dict:
    return {
        "employee_id": person.employee_id,
        "unique_id": person.unique_id,
        "name": person.name,
        "email": person.email,
        "title": person.title,
        "ati_role": person.ati_role,
        "active": person.active,
        "can_approve_yse": person.can_approve_yse,
    }


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    # --- people ----------------------------------------------------------- #
    def create_person(
        employee_id: str,
        name: str,
        email: str,
        title: str,
        ati_role: Optional[str] = None,
        host_campus_abbrev: Optional[str] = None,
        working_groups: Optional[list] = None,
        active: bool = True,
        can_approve_yse: bool = False,
    ) -> dict:
        """Create a Person. `employee_id`, `name`, `email` and `title` are required; `name` is
        unique across the graph (a duplicate fails). `host_campus_abbrev` is the campus
        ABBREVIATION (e.g. 'sfsu' — see list_campuses). `working_groups` is a list of full
        working-group names ('Web', 'Procurement', 'Instructional Materials') the person joins.
        Fails if the employee_id already exists — use update_person for existing people."""
        ensure_app()
        from app.database.queries.individuals.create import add_person

        data = {
            "employee_id": employee_id,
            "name": name,
            "email": email,
            "title": title,
            "active": active,
            "can_approve_yse": can_approve_yse,
        }
        if ati_role is not None:
            data["ati_role"] = ati_role
        if host_campus_abbrev:
            data["host_campus"] = host_campus_abbrev
        if working_groups:
            data["workingGroups"] = [{"name": wg} for wg in working_groups]
        with _quiet():
            person = add_person(data)
        return {"ok": True, "person": _person_dict(person)}

    def update_person(
        employee_id: str,
        name: Optional[str] = None,
        email: Optional[str] = None,
        title: Optional[str] = None,
        ati_role: Optional[str] = None,
        active: Optional[bool] = None,
        can_approve_yse: Optional[bool] = None,
        host_campus_abbrev: Optional[str] = None,
        working_groups: Optional[list] = None,
    ) -> dict:
        """Update an existing Person by employee_id. Only the fields you pass change.
        REPLACE semantics on the two relationship fields: `host_campus_abbrev` (abbreviation,
        e.g. 'sfsu') replaces the person's host campus; `working_groups` (list of full names,
        e.g. ['Web']) replaces ALL working-group memberships with exactly that list — to add one
        membership without knowing the rest, use assign_person_to_working_group instead."""
        ensure_app()
        from app.database.queries.individuals.update import update_person_by_employee_id

        data = {"employee_id": employee_id}
        for key, value in (
            ("name", name),
            ("email", email),
            ("title", title),
            ("ati_role", ati_role),
            ("active", active),
            ("can_approve_yse", can_approve_yse),
        ):
            if value is not None:
                data[key] = value
        if host_campus_abbrev is not None:
            data["host_campus"] = host_campus_abbrev
        if working_groups is not None:
            data["workingGroups"] = [{"name": wg} for wg in working_groups]
        with _quiet():
            person = update_person_by_employee_id(data)
        return {"ok": True, "person": _person_dict(person)}

    def assign_person_to_working_group(employee_id: str, working_group_name: str) -> dict:
        """Add one working-group membership (participates_in) to an existing Person, keeping
        their other memberships. `working_group_name` is the full name: 'Web', 'Procurement'
        or 'Instructional Materials'. Idempotent (neomodel connect is a no-op if present)."""
        ensure_app()
        from app.database.queries.committees.update import add_person_to_committee

        with _quiet():
            message = add_person_to_committee(employee_id, working_group_name)
        # This sanctioned function reports failure as a string instead of raising.
        if not message.startswith("Person with ID"):
            raise RuntimeError(message)
        return {"ok": True, "employee_id": employee_id, "working_group": working_group_name}

    def assign_person_to_department(department_name: str, employee_id: str) -> dict:
        """Connect a Department to a Person it employs (Department -[:employs]-> Person).
        Both must already exist; `department_name` is the exact Department.name. Idempotent."""
        ensure_app()
        from app.database.queries.organizational_units.update import assign_employee_to_department

        with _quiet():
            assign_employee_to_department(department_name, employee_id)
        return {"ok": True, "department": department_name, "employee_id": employee_id}

    def assign_person_to_college(college_name: str, employee_id: str) -> dict:
        """Connect a College to a Person it employs (College -[:employs]-> Person).
        Both must already exist; `college_name` is the exact College.name. Idempotent."""
        ensure_app()
        from app.database.queries.organizational_units.update import assign_employee_to_college

        with _quiet():
            assign_employee_to_college(college_name, employee_id)
        return {"ok": True, "college": college_name, "employee_id": employee_id}

    def assign_person_to_vendor(vendor_name: str, employee_id: str) -> dict:
        """Connect a Vendor to a Person it employs (Vendor -[:employs]-> Person). Both must
        already exist; `vendor_name` is the exact Vendor.name (see list_vendors). Idempotent."""
        ensure_app()
        from app.database.queries.organizational_units.update import assign_employee_to_vendor

        with _quiet():
            assign_employee_to_vendor(vendor_name, employee_id)
        return {"ok": True, "vendor": vendor_name, "employee_id": employee_id}

    def unassign_person_from_org_unit(unit_type: str, unit_name: str, employee_id: str) -> dict:
        """Remove an employs edge: disconnect a Person from a Department, College, or Vendor.
        `unit_type` is 'department' | 'college' | 'vendor'; `unit_name` is the exact unit name.
        Idempotent (a missing edge is a no-op)."""
        ensure_app()
        from app.database.queries.individuals.read import get_person_by_employee_id
        from app.database.queries.organizational_units.update import unassign_employee_from_org_unit

        with _quiet():
            person = get_person_by_employee_id(employee_id)
            unassign_employee_from_org_unit(unit_type, unit_name, person.unique_id)
        return {"ok": True, "unit_type": unit_type, "unit": unit_name, "employee_id": employee_id}

    # --- org units -------------------------------------------------------- #
    def create_department(
        name: str,
        location: Optional[str] = None,
        campus_name: Optional[str] = None,
    ) -> dict:
        """Create a Department. Pass `campus_name` (the full Campus.name, NOT the abbreviation —
        see list_campuses) to also connect it to its campus (operates_under_campus); without a
        campus link the department is an orphan most reports will not see."""
        ensure_app()
        from app.database.queries.organizational_units.create import add_department
        from app.database.queries.organizational_units.update import assign_department_to_campus

        with _quiet():
            add_department(name, location)
            if campus_name:
                assign_department_to_campus(name, campus_name)
        return {"ok": True, "department": name, "campus": campus_name}

    def create_college(
        name: str,
        location: Optional[str] = None,
        campus_name: Optional[str] = None,
    ) -> dict:
        """Create a College. Pass `campus_name` (the full Campus.name, NOT the abbreviation —
        see list_campuses) to also connect it to its campus (operates_under_campus)."""
        ensure_app()
        from app.database.queries.organizational_units.create import add_college
        from app.database.queries.organizational_units.update import assign_college_to_campus

        with _quiet():
            add_college(name, location)
            if campus_name:
                assign_college_to_campus(name, campus_name)
        return {"ok": True, "college": name, "campus": campus_name}

    def create_vendor(name: str, location: Optional[str] = None) -> dict:
        """Create a Vendor. `name` is the unique business key (a duplicate fails with a clear
        error). Use list_vendors first to check whether it already exists."""
        ensure_app()
        from app.database.queries.organizational_units.create import create_vendor as _create_vendor

        with _quiet():
            vendor = _create_vendor(name, location)
        return {"ok": True, "vendor": {"name": vendor.name, "location": vendor.location}}

    def update_vendor(
        name: str,
        location: Optional[str] = None,
        new_name: Optional[str] = None,
    ) -> dict:
        """Update a Vendor found by its current `name`: set `location`, and/or rename it with
        `new_name` (existing supplied_by/employs edges survive the rename)."""
        ensure_app()
        from app.database.queries.organizational_units.update import update_vendor as _update_vendor

        with _quiet():
            vendor = _update_vendor(name, location=location, new_name=new_name)
        return {"ok": True, "vendor": {"name": vendor.name, "location": vendor.location}}

    tools = [
        (create_person, "create_person",
         "Create a Person (employee_id, name, email, title required) with optional host campus "
         "and working-group memberships. Fails on an existing employee_id."),
        (update_person, "update_person",
         "Update a Person by employee_id; only passed fields change. host_campus_abbrev and "
         "working_groups REPLACE those relationships wholesale."),
        (assign_person_to_working_group, "assign_person_to_working_group",
         "Add one working-group membership to a Person without touching their other "
         "memberships ('Web', 'Procurement', 'Instructional Materials')."),
        (assign_person_to_department, "assign_person_to_department",
         "Connect a Department to a Person it employs, by exact names/ids. Idempotent."),
        (assign_person_to_college, "assign_person_to_college",
         "Connect a College to a Person it employs, by exact names/ids. Idempotent."),
        (assign_person_to_vendor, "assign_person_to_vendor",
         "Connect a Vendor to a Person it employs, by exact names/ids. Idempotent."),
        (unassign_person_from_org_unit, "unassign_person_from_org_unit",
         "Remove an employs edge: disconnect a Person from a Department, College, or "
         "Vendor by unit_type + exact unit name. Idempotent."),
        (create_department, "create_department",
         "Create a Department, optionally connected to its campus (full Campus.name)."),
        (create_college, "create_college",
         "Create a College, optionally connected to its campus (full Campus.name)."),
        (create_vendor, "create_vendor",
         "Create a Vendor (unique name; duplicate fails)."),
        (update_vendor, "update_vendor",
         "Update a Vendor's location and/or rename it (edges survive the rename)."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
