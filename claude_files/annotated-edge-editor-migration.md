# Migration plan — property-carrying edge editors → `AnnotatedAttachmentSelector`

**Status:** step 1 done (governance). Steps 2–4 planned, not started.
**Date:** 2026-08-12

---

## The problem this closes

The app has two kinds of edge. Property-free edges (`is_sourced_from`, `informs`) go
through `functional_components/EntityAttachmentSelector.jsx`, which is shared and reused
everywhere. Property-carrying edges had **no shared surface at all**, because
`EntityAttachmentSelector`'s `onAttach(uniqueId)` signature leaves no room for edge
properties. So every one of them was hand-rolled separately against Chakra primitives:

| Component | Edge | Properties | Lines |
|---|---|---|---|
| `implementation_explorer/ParticipantsEditor.js` | `worked_on` (ParticipationRel) | `role_handle`, `note` | 142 |
| `graph_components/people/RoleHoldingsEditor.js` | `holds_role` (RoleHoldingRel) | `in_position_description`, `pd_description` | 194 |
| `graph_components/people/CommunityDetailPanel.js` (stake block, ~L296–359) | `has_stake_in` (CommunityStakeRel) | `note` | inline |
| `graph_components/governance/GovernanceIndicatorLinks.js` | `drives` (DrivesRel) | `provision`, `quote`, `note` | **migrated** |

Four implementations of one interaction: pick an entity, annotate the link, list what's
attached, edit, remove. They disagree on save semantics, on whether edits are possible at
all, and on error handling.

`design-sense.md` §8 already records this as debt — its own "build a new area" recipe
assumes property-free links.

---

## The shared component

`functional_components/AnnotatedAttachmentSelector.jsx` — sibling to
`EntityAttachmentSelector`, for edges that carry properties.

The edge's properties are described by a **`fields` schema** rather than hardcoded, the
same way `governanceTypes.js` describes node fields. One schema drives both the add form
and the read view, so the two cannot drift apart.

```js
fields = [{ name, label, type: 'text'|'textarea', placeholder?, rows?, mono?,
            display?: 'badge'|'quote'|'muted'|'inline' }]
```

Also supports: grouped candidates via `candidates[].group` (renders `<optgroup>`, caller
controls order), a `flag` predicate for per-row conditions surfaced as a text badge, and
an optional `onUpdate` — omit it and attached rows become read-only.

**Reference consumer:** `GovernanceIndicatorLinks.js`. ~430 lines → ~200, with the
governance-specific part reduced to a field schema, three service calls, and two label
functions.

---

## Step 2 — `CommunityDetailPanel` stake block

**The closest match, and the one that proves the abstraction.** Same shape as governance:
pick a SuccessIndicator, annotate the link, list, remove. One property instead of three.

```js
fields={[{ name: 'note', label: 'Why this stake', type: 'text', display: 'muted' }]}
```

Two things it gains for free:
- **Editing.** Today a stake's note can only be set at add time; fixing one means remove
  and re-add. `onUpdate` gives inline editing.
- **WG → Goal grouping.** It currently renders a flat `Select` of every indicator, which
  is the same 122-row list the governance picker had before this change.

Needs: a backend `update_community_stake` (only `add_community_stake` exists, at
`queries/communities/update.py:104`) and the read to return goal/WG coordinates per
indicator — the same addition already made to `get_governance_link_targets()`.

**This step is the one that matters.** Two consumers is where the abstraction stops being
speculative; if it doesn't fit here, the component is wrong and should be reshaped before
going further.

---

## Step 3 — `ParticipantsEditor`

Fits, but with one real mismatch: it uses **replace semantics** (stage all rows locally,
one "Save participants" call posting the whole array), where the shared component writes
per row.

Also: a person may participate in more than one role, so the same person appears as
multiple edges. The shared component keys on `unique_id` and de-duplicates candidates
against `attached`, which would wrongly bar a second role for the same person.

**Resolve before migrating.** Either give the component an opt-in `allowRepeatTargets`
plus a separate row key, or leave `ParticipantsEditor` alone. Do not contort the shared
component to fit — this is the step most likely to be worth skipping.

---

## Step 4 — `RoleHoldingsEditor`

Needs a `type: 'switch'` field (`in_position_description` is a boolean) and conditional
field display (`pd_description` only shows when the switch is on). Also replace semantics.

Cheap to add if steps 2–3 have already validated the schema; not worth doing on its own.
Lowest priority.

---

## Ordering and stop conditions

1. ~~Governance~~ — done.
2. **CommunityDetailPanel stake block** — do this next. Validates the abstraction and
   fixes two real gaps (no editing, flat 122-row picker) as a side effect.
3. ParticipantsEditor — only after resolving repeat-target keying.
4. RoleHoldingsEditor — only after a `switch` field type exists.

**Stop if:** step 2 needs more than a field schema and handler wiring. That would mean the
component is shaped around governance rather than around the interaction, and it should be
reshaped before any further migration.

**Do not** migrate `IndicatorSelectorModal` (campus plan). Its edge —
`prioritizes_success_indicator` — is property-free, so it belongs to
`EntityAttachmentSelector`'s family, not this one.

---

## Related

- Schema for the two governance edges: `app/database/graph_schema.py`, Governance section
  docstring.
- Backend link targets, including the WG/Goal coordinates the grouped picker needs:
  `app/database/queries/governance/read.py::get_governance_link_targets`.
- Working-group ordering is derived from `data_config.WORKING_GROUP_DEFS` (backend) and
  `styles/workingGroupIdentity.js` (frontend) — never hardcode the group set.
