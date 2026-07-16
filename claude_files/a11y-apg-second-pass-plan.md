# A11y second pass — APG keyboard contracts + site-wide navigation consistency

The axe sweep (first pass, 2026-07) catches what a scanner can see: names, roles, contrast,
focusability. This plan is the **second pass**: implementing the full W3C ARIA Authoring
Practices Guide (APG) interaction contracts — <https://www.w3.org/WAI/ARIA/apg/patterns/> —
and using that work to make navigation feel like *one app* across every page.
Companion docs: `design-sense.md` §6/§6.1 (the conventions), `e2e/BASELINE-2026-07-16.md`
(first-pass scoreboard).

**Principle:** axe proves a widget is *named*; APG proves it *works* — from the keyboard,
in a screen reader, with focus landing where a user expects. Every item below ends with an
e2e interaction spec so the contract stays enforced.

---

## 1. The site picture

### Navigation layers (as built today)

| Layer | Element | Semantics today |
|---|---|---|
| 1. Top nav | `<nav aria-label="Main Navigation">` in the teal header | Buttons-as-links (`Button as={RouterLink}`) for ATI Explorer / Dashboard / About + campus/year/person Menu selectors |
| 2. Section nav | `SubNavbar` — `<nav aria-label="Section navigation">` | Per-area link sets (Dashboard: 3 WG + reports/copy/campus-plan/settings · Explorer: 5 sections · About: 8 tabs) |
| 3. In-area nav | Varies by area | Chakra `Tabs` (Assets: Assets\|TAAPs\|Vendors), left sidebar buttons (Settings), `GoalNavigator` header (goal views), master-detail listboxes (most areas) |
| 4. Detail | Master-detail right panel, expandable rows, modals | Mixed — this is where the hand-rolled widgets live |

### Route inventory
The canonical list is `e2e/routes.js` (24 static routes across Dashboard / ATI Explorer /
About + parameterized detail routes). Keep that file authoritative; this plan doesn't
duplicate it.

### Where the app is inconsistent today (the gap this plan closes)

1. **Three different "section switcher" idioms** for the same mental operation:
   SubNavbar uses links, the Assets area uses `Tabs` bound to routes
   (`assets/:assetTab`), Settings uses plain sidebar buttons with local state. A keyboard
   or SR user gets three different behaviors for "go to a subsection."
2. **No current-location signal**: SubNavbar links style the active item visually but do
   not set `aria-current="page"`; the Settings sidebar has no `aria-current` equivalent
   (selected state is visual only).
3. **Clickable-div rows** in newer areas (campus plan queries/minutes rows, stat-strip
   filter tiles) are mouse-only — `role="button"` without `tabIndex`/key handlers.
4. **Listbox keyboard support is uneven**: `SuccessIndicatorList` has roving
   tabindex + arrow keys (the reference implementation); `PeopleList`, `PrincipleList`,
   `ImplementationList`, `TaapList`, `VendorList` declare `role="listbox"`/`option` but
   options are not focusable — the role is a promise the keyboard can't keep.
5. **No skip link, no focus management on route change**: every navigation is a silent
   SPA swap; keyboard users re-tab through the whole header after each click, SR users
   get no announcement.
6. **Deep-link/focus behavior varies**: reports hash-scroll + highlight, goal views
   URL-sync selection, other lists reset selection on navigation.

---

## 2. Work packages

### A. Landmark + wayfinding baseline (do first — small, app-shell only)
- Add a **skip link** ("Skip to main content") as the first focusable element in
  `App.js`; target `<Container as="main" id="main">` (APG: Landmarks).
- On route change, move focus to the `main` region (or the area `h2`) and set
  `document.title` per page ("Dashboard · Web · Goal 1 — ATI"). A small
  `useRouteAnnouncer` hook + `aria-live=polite` region covers SR announcement.
- `aria-current="page"` on the active item in SubNavbar and the top-nav area links.
- Convert top-nav area switchers from `Button as={RouterLink}` to `Link` styled as
  buttons *or* keep Button but verify the rendered element is `<a href>` (it is, via
  `as`) — then the `aria-current` treatment applies cleanly.
- **Spec:** `e2e/tests/navigation.spec.js` — tab-1 reaches skip link; activating it
  focuses main; after client-side nav, focus is in main and `aria-current` moved.

### B. One section-switcher idiom (navigation consistency, the user-visible win)
Decide once, apply everywhere: **subsections that change the URL are links in a `nav`**
(APG: not everything that looks like tabs should be `role="tab"` — route-bound "tabs"
are navigation).
- SubNavbar: already links — add `aria-current` (package A) and keep.
- Assets area `Tabs` → keep the visual tab look but render as `nav` + links with
  `aria-current`, or keep Chakra Tabs purely visual with `as` overrides. Either way the
  URL keeps driving state (`assets/:assetTab`).
- Settings sidebar → make it a `nav aria-label="Settings sections"` of real links
  (`dashboard/settings/:section` routes instead of local state), matching every other
  area. This also makes settings sections deep-linkable — a functional improvement, not
  just a11y.
- **Spec:** every area asserts exactly one `nav[aria-label="Section navigation"]`-level
  idiom and `aria-current="page"` on the active subsection.

### C. Listbox keyboard contracts (APG: Listbox)
Bring every `role="listbox"` list up to `SuccessIndicatorList`'s standard:
roving `tabIndex` (list is one tab stop), `↑`/`↓` move, `Home`/`End` jump,
`Enter`/`Space` select, `aria-selected` follows selection, selection scrolls into view.
- Targets: `PeopleList`, `PrincipleList`, `GovernanceList` (inner lists under the
  accordion), `ImplementationList`, `TaapList`, `VendorList`, `AssetList`.
- Extract the roving-tabindex logic from `SuccessIndicatorList` into a shared hook
  (`useListboxNavigation`) so the contract is written once — mirrors the
  config-driven-badges philosophy in design-sense §1.4.
- The scroll containers keep `tabIndex={0} role="region"` (added in pass 1) only where
  the inner list is not itself focusable; once a listbox is a tab stop, drop the
  redundant region focus to avoid double stops.
- **Spec:** parameterized `keyboard-listbox.spec.js` over each list: arrow-key
  traversal changes `aria-selected` and detail panel content, single tab stop.

### D. Clickable-div → real button conversions (APG: Button / Disclosure)
- Campus plan: `WgQueriesSection` rows, `WgMinutesSection` rows, `CampusPlanStatStrip`
  filter tiles, minutes/date sub-rows — all `role="button"` divs without keyboard
  access. Convert to `<Box as="button">` (full-width, text-left) or add
  `tabIndex={0}` + Enter/Space handlers; whichever, the accessible name must describe
  the action ("Open query: …").
- IndicatorRow's disclosure chevron got `aria-expanded` in pass 1; sweep for any other
  expand/collapse triggers still on plain boxes (design-sense §6.1 failure mode 1).
- Replace remaining `window.confirm` destructive guards with Chakra `AlertDialog`
  (APG: Alert Dialog; design-sense §4.4 already prefers it).
- **Spec:** keyboard-only walk of the campus plan page reaches and activates every row
  and tile.

### E. Widget-level APG polish
- `StatusLevelLadder`: swap `role="img"` for `role="meter"` + `aria-valuenow/min/max`
  + `aria-valuetext` ("Defined, level 3 of 6") per APG Meter; keep the text label.
- `HelpTip` (descriptor tooltips): verify Esc dismisses (Chakra Tooltip does), and the
  trigger's `role="note"`+`aria-label` reads sensibly in NVDA; consider `aria-describedby`
  instead of duplicating the label.
- Members react-table: `th scope="col"`; if column sorting is ever added, `aria-sort`.
- Modals: audit every form modal for `initialFocusRef` on the first field (APG: Dialog).
- **Spec:** spot interaction specs per widget.

### F. Enforcement + docs
- New e2e specs from A–E live under `e2e/tests/` next to the axe sweep; they are the
  regression net for the keyboard contracts axe can't check.
- Update `design-sense.md` §6.1 table's "Watch for" column with anything learned.
- Manual screen-reader spot-check (NVDA + Chrome) of one page per area at the end.

---

## 3. Sequencing & effort

| Package | Size | Depends on | Notes |
|---|---|---|---|
| A. Landmarks/skip/focus | S | — | App shell only; biggest UX-per-line win |
| B. One switcher idiom | M | A | Settings route refactor is the only structural change |
| C. Listbox contracts | M | — | One shared hook + 7 list adoptions |
| D. Button conversions | S–M | — | Mechanical; campus plan concentrated |
| E. Widget polish | S | — | Independent nibbles |
| F. Enforcement | S | A–E | Specs written alongside each package |

A → B first (they define the consistent navigation skeleton), C and D can run in
parallel after, E/F trail. Each package lands with its spec so `npm test` in `e2e/`
stays the single source of truth for "is the site still consistent."
