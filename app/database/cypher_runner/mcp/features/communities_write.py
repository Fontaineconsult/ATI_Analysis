"""
Feature: communities of practice — create communities, manage membership, and manage
indicator stakes (write-gated).

The write complement to the community reads (``list_communities`` / ``community_detail``
in the registry). Communities are cross-campus people-groupings; ``has_stake_in`` links
a community to the SuccessIndicators its practice area holds a stake in — its members
are those indicators' stakeholders (interview targets, evidence sources).

  create_community              -> CommunityOfPractice node
  assign_person_to_community    -> Person -[:member_of_community]-> community (incremental)
  add_community_stake           -> community -[:has_stake_in]-> SuccessIndicator
  remove_community_stake        -> removes that edge

Identifier conventions:
  communities -> full CommunityOfPractice.name ('Library', 'Faculty Development', ...);
                 tools resolve the name internally (communities key by unique_id, which
                 agents should never need). Discover names via list_communities.
  people      -> employee_id (matching people_write).
  indicators  -> SuccessIndicator.composite_key ('7.11-ins', '1.9-pro', ...).

Independence (same rule as the other *_write features): tools only CALL sanctioned
queries functions, imported INSIDE the tool body after ``ensure_app()``. Stdout is
shielded with ``_quiet()`` (stdio transport). Registers only when ATI_MCP_ALLOW_WRITE
is on; descriptions are [WRITE]-prefixed.
"""

import contextlib
import sys
from typing import Optional

from ._appbootstrap import ensure_app

NAME = "communities_write"


def _quiet():
    """Redirect stdout to stderr while a queries function runs (stdio-transport safety)."""
    return contextlib.redirect_stdout(sys.stderr)


def _resolve_community(name: str):
    """CommunityOfPractice by exact name -> node. Raises NotFoundError if missing."""
    from app.database.graph_schema import CommunityOfPractice
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    community = CommunityOfPractice.nodes.first_or_none(name=name)
    if community is None:
        raise NotFoundError(f"Community named {name!r} not found — see list_communities")
    return community


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def create_community(name: str, description: Optional[str] = None) -> dict:
        """Create a CommunityOfPractice (unique name; duplicate fails). Communities are
        cross-campus groupings by shared functional area — freely creatable data."""
        ensure_app()
        from app.database.queries.communities.create import create_community as _create

        with _quiet():
            community = _create({"name": name, "description": description})
        return {"ok": True, "community": community.serialize()}

    def assign_person_to_community(
        employee_id: str, community_name: str, note: Optional[str] = None,
    ) -> dict:
        """Add one community membership to a Person (by employee_id) without touching
        their other memberships. `community_name` is the full CommunityOfPractice.name;
        the optional note records the person's stake in the area."""
        ensure_app()
        from app.database.graph_schema import Person
        from app.database.queries.communities.update import set_person_communities
        from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

        community = _resolve_community(community_name)
        person = Person.nodes.first_or_none(employee_id=employee_id)
        if person is None:
            raise NotFoundError(f"Person with employee_id {employee_id!r} not found")

        # set_person_communities is replace-semantics; carry the existing set forward.
        current = [
            {"community_id": c["unique_id"], "note": c.get("note")}
            for c in person.serialize().get("communities", [])
            if c["unique_id"] != community.unique_id
        ]
        current.append({"community_id": community.unique_id, "note": note})
        with _quiet():
            set_person_communities(employee_id, current)
        return {"ok": True, "person": person.name, "community": community.name}

    def add_community_stake(
        community_name: str, composite_key: str, note: Optional[str] = None,
    ) -> dict:
        """Link a community to a SuccessIndicator its practice area has a stake in
        (has_stake_in) — its members are that indicator's stakeholders. Idempotent;
        `composite_key` like '7.11-ins'. The optional note records why the stake."""
        ensure_app()
        from app.database.queries.communities.update import add_community_stake as _add

        community = _resolve_community(community_name)
        with _quiet():
            _add(community.unique_id, composite_key, note)
        return {"ok": True, "community": community.name, "composite_key": composite_key}

    def remove_community_stake(community_name: str, composite_key: str) -> dict:
        """Remove a community's has_stake_in link to a SuccessIndicator. Idempotent."""
        ensure_app()
        from app.database.queries.communities.update import remove_community_stake as _remove

        community = _resolve_community(community_name)
        with _quiet():
            _remove(community.unique_id, composite_key)
        return {"ok": True, "community": community.name, "composite_key": composite_key}

    tools = [
        (create_community, "create_community",
         "Create a CommunityOfPractice (unique name; duplicate fails)."),
        (assign_person_to_community, "assign_person_to_community",
         "Add one community membership to a Person (employee_id + full community name) "
         "without touching their other memberships; optional note = their stake."),
        (add_community_stake, "add_community_stake",
         "Link a community (full name) to a SuccessIndicator (composite_key) its practice "
         "area has a stake in — members become that indicator's stakeholders. Idempotent."),
        (remove_community_stake, "remove_community_stake",
         "Remove a community's has_stake_in link to a SuccessIndicator. Idempotent."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
