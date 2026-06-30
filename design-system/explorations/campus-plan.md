# Exploration — Campus Plan: professionalism & navigation

A study of the campus-plan area as it stands, the problems that make it hard to
navigate / read as less-than-professional, and the directions to fix it. The
companion mockup is `../mockups/campus-plan.html` (open in a browser).

## What's there today

**Route:** `/:campus/dashboard/campus-plan` → `CampusPlanContainer.js` (a single
component, no deep-link to a working group).

**The page is one long vertical scroll:**

```
Heading "Campus Plan"
CampusPlanStatStrip            (4 stat cards — good, keep)
Card: identity (campus · year · plan_identifier)   ← one thin line in a p=5 card
Section: Executive Summary     (inline editor)
Section: Executive Sponsors    (modal manage)
Section: President's Report     (link)
Card:    Cross-campus comparison (Compare with… menu + peer tags)
Heading "Working Group Plans"
  WorkingGroupPlan × 3  ← Web, Instructional Materials, Procurement
    each = Card{ Group Leads, [ Prioritized Indicators | Plans + Queries + Minutes ] }
```

Each of the **three** `WorkingGroupPlan` cards is itself a full dashboard: group
leads, a left column of prioritized-indicator split-cards (status progression,
trajectory, progress timeline, cross-campus toggle badges), and a right column
stacking **three** panels — Plans, `QueriesPanel`, `MeetingMinutesPanel` — each
of which **fetches its own data on mount**.

## Problems

### Navigation
1. **Pure scroll, no within-page nav.** To get from Web's minutes to
   Procurement's indicators you scroll past a wall. No tabs, rail, or jump links.
2. **Everything renders at once.** All 3 working groups × (leads + indicators +
   plans + queries + minutes) mount simultaneously. Cognitive overload + a slow
   first paint.
3. **No deep-linking to a working group.** The route is just `campus-plan`;
   Governance (canon) deep-links by id. You can't share "SFSU → Procurement."
4. **Cause/effect split.** The "Compare with…" control sits in the plan header,
   but its effect (per-campus badges) appears far below, inside each WG's
   indicator list. You change a thing here and the result is off-screen.

### Professionalism / visual
5. **Working-group identity color is unused.** design-sense §2 establishes
   Web = `teal.500`, Instructional Materials = `purple.500`,
   Procurement = `coral.500` — but all three WG cards render identical teal
   chrome. Nothing tells you *which* group you're in while scrolling. This is the
   single highest-leverage professional upgrade, and §8.4 already lists "thread
   the accents into cards" as the remaining work.
6. **Heading hierarchy is muddy.** Area title is `h2` "Campus Plan"; then
   "Working Group Plans" is **also** `h2` (just `size="md"`). Two sibling h2s.
7. **A wall of identical split-cards.** Indicators, plans, queries, and minutes
   all use the same gray-topped `splitCard` chrome. The unification was
   deliberate, but with no WG color and no landmarks it reads as a gray monotone.
8. **Thin identity card.** One line (campus · year · id) inside a `p={5}` Card —
   wasted vertical space that pushes the real content down.
9. **Tiny targets.** Cross-campus abbrev toggles are `2xs` uppercase buttons —
   below comfortable click/tap size.

### Performance / structure
10. **6+ panel fetches per page.** Each `QueriesPanel` and `MeetingMinutesPanel`
    fetches independently → 3 WGs × 2 = 6 calls, on top of the plan + peer
    fetches, all eagerly even though you can only read one group at a time.

## Directions

The core move is to stop rendering three dashboards at once and give the area a
**navigable shell**. Two genuine approaches:

### A — Working-group tabs  *(recommended)*
A compact **overview header** (identity line + stat strip + summary/sponsors/
report/compare in a tight 2-up), then a **tab bar** with one tab per working
group — each carrying its **identity color** and a count (+ ⚠ when at-risk).
The active tab shows that WG's dashboard; within it, **sub-tabs**
(Indicators · Plans · Queries · Minutes, with counts) replace the long panel
stack. Mount each panel only when its sub-tab is active (kills the eager fetches).
Deep-link `campus-plan/:workingGroup`.

- **Fixes:** 1, 2, 3, 5, 6, 7, 10. Instant orientation by color; one group at a
  time; lazy fetch; clean heading levels (h2 area → tablist → h3 WG → h4 panel).
- **Cost:** behavior change (people lose the all-on-one-page view); needs a route
  param + lazy mounting.

### B — One page + sticky rail
Keep the single page (good for exec read-through / print), but add a **sticky
left rail** (Overview · Web · IM · Procurement, scroll-spy highlighted) and give
each WG a full-width **identity-colored section header** so the wall gains
landmarks. Panels still stack.

- **Fixes:** 1, 4, 5, 6 (partially). Cheapest; preserves print/read-through.
- **Leaves:** 2 and 10 — everything still mounts/fetches at once.

**Recommendation:** **A** for the working app (navigation + performance + the
identity win), with B's identity-colored landmark as a fallback if a
one-page/print view is needed for executive review. The mockup renders **both**
behind a toggle so the trade is visible.

## What to reuse elsewhere

The point of this exploration (per the ask) is to harvest patterns:

1. **Working-group identity, centralized.** Lift Web/IM/Pro → color into one
   config (e.g. `styles/workingGroupIdentity.js`) and consume it from the
   SubNavbar, `GoalNavigator`, **and** here — closing design-sense §8.4. Any area
   that renders per-working-group content gets instant, consistent orientation.
2. **Tabbed-area shell.** design-sense §3.1 already sanctions Chakra `Tabs` for
   *sibling sub-domains* (Assets | TAAPs | Vendors). Campus-plan WGs are siblings
   → the same shell. Extract the overview-header + colored-tablist + lazy-panel
   pattern so other multi-sub-domain areas inherit it.
3. **Lazy embedded panels.** The self-fetching `QueriesPanel` /
   `MeetingMinutesPanel` pattern should mount on first reveal, not on page load —
   a reusable rule for any tabbed/collapsed self-fetching panel.
4. **Compact overview-header band.** The tight identity + stat-strip + 2-up meta
   header is reusable for any dashboard area that has both plan-level metadata and
   drill-down content.

These would land in `../components/` (shell + identity) and `design-sense.md`
once a direction is chosen.
