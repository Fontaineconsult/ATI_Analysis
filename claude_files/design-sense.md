# ATI Analysis — Frontend Design Sense

The canonical visual + interaction language for the app. When building or restyling any
area, **follow this**. It codifies the strongest existing design language — the newer
"graph components" areas (Assets, Governance, the Success-Indicator master-detail) — and
calls out the legacy patterns to avoid so the app converges instead of drifting.

> Stack: React 18 + Chakra UI. Colors/spacing are currently expressed **inline** per
> component (there is no component-level theme yet — see [Known debts](#known-debts)). Until
> that changes, "follow the tokens below" means *use these exact Chakra props*.

---

## 1. Design philosophy (the "sense")

These are the load-bearing instincts. Keep them even if specific tokens change.

1. **Diagnostic-first, not a data dump.** Surface *what needs attention* before detail. The
   UI should answer "where are the gaps?" at a glance: count chips turn **red when zero**
   (e.g. an indicator with no responsible person), summary badge rows sit above lists, and
   derived signals get their own badge (the asset **elevation signal**). This is the soul of
   the app — every new area should have a diagnostic read, not just CRUD.
2. **Status at a glance, then drill in.** Always-visible status summaries (badge rows, stat
   strips, status pills) precede the expandable/clickable detail.
3. **Master–detail over modal mazes.** Left list (selectable) → right detail (flattened,
   inline sections). Reserve modals for *create/edit forms* and *action gates* (e.g. Review),
   never for primary reading.
4. **Config-driven labels & colors.** Vocabularies, labels, and colors live in one config
   per domain (`governanceTypes.js`, `assetConfig.js`) — never hardcoded per component. A new
   choice/value is a one-line config edit that the list, form, badge, and detail all pick up.
5. **Reuse the shared surfaces.** Person/entity linking goes through
   `PersonAssignmentSelector` / `EntityAttachmentSelector`, not bespoke pickers.
6. **Accessibility is first-class.** ARIA roles, roving tabindex, `_focusVisible` rings,
   semantic headings. This is an accessibility product — the UI must model the standard.
7. **Calm, single-accent palette.** Teal is the brand/primary accent; neutrals carry
   structure; saturated colors are reserved for *meaning* (status/severity), not decoration.

---

## 2. Foundations (tokens)

### Color

**Brand / primary — teal.** Use for headings, primary actions, active nav, selection.
| Use | Token |
|---|---|
| Section/card headings, accents | `teal.700` |
| Primary buttons / active solid | `colorScheme="teal"` (solid) |
| Selection highlight bg, active nav bg | `teal.50` |
| Selection left-border / focus ring | `teal.500` |

**Neutrals — structure.**
| Use | Token |
|---|---|
| Page background | `gray.50` (App.css `#f0f4f7`) |
| Card / surface background | `white` |
| Borders, dividers | `gray.200` |
| Primary text | `gray.800` |
| Secondary text | `gray.600` |
| Tertiary / mono identifiers | `gray.400` |
| Muted / empty-state text | `gray.500` (often `fontStyle="italic"`) |

**Semantic — meaning only.** Two palettes, both centralized — **do not hardcode hex**:

- **Plan status** → `styles/palette.js` semantic tokens (`{solid, bg, fg}`), via
  `getPlanStatusColor()` in `styles/planStatusColors.js` (or `getPlanStatusColorScheme()`
  for a plain `<Badge colorScheme>`): Not Started=gray · In Progress=blue · Completed=green ·
  On Hold=orange · Abandoned=red. Never re-derive this mapping inline.
- **Maturity status** (the CMM ladder) → `services/utils/statusColors.js`
  `getStatusColor(level)` — a red→green heat ramp across the six `status_levels`:
  Not Started=`#E53E3E` (red) · Initiated=`#ED8936` (orange) · Defined=`#ECC94B` (yellow) ·
  Established=`#41b441` · Managed=`#246f24` · Optimizing=`#157744` (greens) · none=gray.

> ⚠️ Teal currently doubles as both the brand accent *and* an "advanced" status tone. When
> you add status visuals, prefer the red→green maturity ramp for *status* and keep teal for
> *chrome/brand*, so a teal element never ambiguously means "maxed out."

### Typography

- Font: **Roboto** (App.css), Chakra default scale (custom `fontSizes` set in `App.js`
  `extendTheme`).
- Card/page heading: `Heading size="md"` (working-group/area title, `teal.700`).
- Section heading: `Heading as="h3" size="xs"` + `textTransform="uppercase"`
  `letterSpacing="wide"` `color="teal.700"` — the signature section look.
- Body: `fontSize="sm"` (`gray.800`/`gray.700`). Secondary/meta: `fontSize="xs"`.
- Dense list meta + micro-badges: `fontSize="2xs"`.
- Identifiers (composite keys, handles, asset_identifier): `fontFamily="mono"` `gray.400`.

### Spacing & shape

- Cards: `borderRadius="lg"`, `boxShadow="sm"`, `borderWidth="1px"`, `borderColor="gray.200"`,
  padding **`p={4}`–`p={5}`** (detail cards `p={5}`, denser inner cards `p={3}`).
- Badges/pills: `borderRadius="full"` (status pills) or `"md"` (type/category badges).
- Vertical rhythm: `VStack`/`Flex` `spacing`/`gap` of **`3`–`4`** between cards, `2` inside a
  card. (Be consistent; the legacy areas drift between 2–4 arbitrarily — don't.)
- Page container: `Container maxW="container.xl"` (1400px) `px={6}`, main `pt={6}`.

---

## 3. Layout patterns

### 3.1 Area shell — stat strip + master-detail

The canonical area (see `AssetsMasterContainer.js`, `GovernanceMasterContainer.js`,
`EvidenceMasterContainer.js`):

```jsx
<Box>
  <Heading as="h2" size="lg" color="gray.800" mb={4}>{AreaName}</Heading>

  {/* optional diagnostic stat strip across the top */}
  <StatStrip ... />

  {/* optional Chakra Tabs when the area has sibling sub-domains (Assets|TAAPs|Vendors) */}
  <Flex gap={6} align="flex-start">
    <Box flex="1" minW="0">{/* List (selectable) */}</Box>
    <Box flex="2" minW="0">{/* DetailPanel for the selection */}</Box>
  </Flex>
</Box>
```

- **1 : 2** list-to-detail ratio. List `flex="1"` (cap with `maxW="400px"` for wide screens),
  detail `flex="2"`. Always `minW="0"` so text truncation works.
- The **container owns** loading/selection state and the add→form→refresh flow; list and
  detail are controlled children (mirror `GovernanceMasterContainer`).

### 3.2 Stat strip (diagnostic dashboard)

Top-of-area counts with a colored top-border accent (see `AssetStatStrip.js`). Each card:
`flex="1"`, white, `borderRadius="lg"`, `boxShadow="sm"`, `borderTopWidth="3px"` +
`borderTopColor={accent}`, Chakra `Stat`/`StatLabel`/`StatNumber`/`StatHelpText`. Lead with
the *attention* metric (e.g. "⚠ Elevation", "TAAPs due").

### 3.3 Card & Section primitives

Copy these two — they recur everywhere.

```jsx
// Card — a titled white surface (from AssetDetailPanel.js)
const Card = ({ title, children, ...rest }) => (
  <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
       boxShadow="sm" p={5} {...rest}>
    {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
    {children}
  </Box>
);

// Section — denser inner block with the signature uppercase teal heading
const Section = ({ title, children }) => (
  <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
       boxShadow="sm" p={3}>
    <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase"
             letterSpacing="wide" mb={2}>{title}</Heading>
    {children}
  </Box>
);
```

A detail panel = a `VStack spacing={4}` of these (identity Card first, then Sections),
**flattened inline** — no nested modals for reading.

---

## 4. Components

### 4.1 List rows (selectable)

Two flavors, both keyed by the domain's business key (e.g. `asset_identifier`, `composite_key`):

- **Flat list** (`SuccessIndicatorList.js`, `TaapList.js`, `VendorList.js`): white row,
  `borderLeftWidth="3px"` (`teal.500` when selected, else transparent), `bg="teal.50"` when
  selected, hover `boxShadow="md"`/`bg="gray.50"`, compact `px={3} py={1.5}`.
- **Accordion grouped** (`GovernanceList.js`, `AssetList.js`): group by a primary dimension
  (type/scope), search box on top, an **Add** button, auto-expand groups containing the
  selection or search matches.

Row anatomy: monospace ID + status badge on the top line; 1–2 line description (`noOfLines`);
a footer of **count chips** (icon + number, **red when 0**) and state flags
(`Ready`/`This yr`/`Next yr`). Make selectable lists an ARIA `listbox` with roving tabindex.

### 4.2 Badges

`colorScheme`-driven, `fontSize="2xs"`/`"xs"`, `textTransform="uppercase"` for type pills,
`variant` `subtle`/`outline`/`solid`. Centralize per domain in a config + a tiny badge
component (`AssetBadges.js`: `ScopeBadge`/`ClassBadge`/`ElevationBadge`;
`governanceTypes.js` color map). Status pills use `borderRadius="full"`; category badges `"md"`.

### 4.3 Forms (create / edit)

Modal-based (`GovernanceForm.js`, `AssetForm.js`, `TaapForm.js`): `Modal size="lg"`,
`FormControl`+`FormLabel` (`fontSize="sm"` `color="gray.700"` `fontWeight="semibold"`),
`Input/Select/Textarea size="sm"`, footer with ghost **Cancel** + teal **Create/Save**
(`isLoading` + `loadingText`). Multi-select = `CheckboxGroup` + `Wrap`/`WrapItem`/`Checkbox`
(see the Implementation Details dimensions control). Field labels/help can be sourced from the
descriptor layer via `useDescriptors().describeField(label, field)` with a humanized fallback.

### 4.4 Buttons & actions

`size="sm"`/`"xs"`, `colorScheme="teal"`; `variant="solid"` (primary), `"outline"`
(secondary), `"ghost"` (tertiary/cancel). "Add X" buttons use `leftIcon={<AddIcon />}`.
Destructive = `colorScheme="red"` `variant="ghost"`, guarded by `window.confirm` or an alert
dialog. Per-row icon actions = `IconButton` (`ViewIcon`/`EditIcon`/`DeleteIcon`), outline.

### 4.5 Linking entities (reuse, don't rebuild)

- `functional_components/PersonAssignmentSelector.jsx` — assign/unassign people
  (`assignedPersons`, `candidatePersons`, `onAssign`, `onUnassign`, `afterChange`).
- `functional_components/EntityAttachmentSelector.jsx` — generic `{unique_id,label}`
  many-to-many with optional "+ New".

### 4.6 Status visuals (the maturity language)

Status is a six-rung CMM ladder (`Not Started → Initiated → Defined → Established → Managed
→ Optimizing`). Render it with the shared pieces — never re-derive colors:

- **`functional_components/StatusLevelLadder.js`** — the maturity *ladder*. Shows all six rungs
  in order with the current one emphasized, so status reads as a *position on a journey*, not a
  lone label. `variant="compact"` = a thin heat-ramp segmented bar (dense list rows);
  `variant="full"` = a labeled stepper with arrows (detail headers). Pass `level` (the
  status_level name); `null` → "no evidence". **Use this anywhere an item has a status_level.**
- `campus_plan_components/StatusProgression.js` → `StatusPill` — a single colored status pill
  (and a prev→current pair for year-over-year views).
- Color sources (single source of truth — don't hardcode): `services/utils/statusColors.js`
  `getStatusColor(name)` (hex ramp) + `getStatusBackgroundColor(name)` (tint) +
  `STATUS_LEVELS_ORDER`; the numeric `getStatusColor(0..5)` colorScheme map lives in
  `indicators/indicatorHelpers.js`.

---

## 5. States

| State | Treatment |
|---|---|
| Nothing selected | Dashed `gray.300` border, `bg="gray.50"`, centered muted prompt: "Select … to view." |
| Empty list | Italic `gray.500` text inside a plain card: "No … yet." |
| Missing / critical | `bg="red.50"` `borderColor="red.200"` box with `red.700` text (e.g. "No evidence …"). |
| Loading (area) | Centered `Spinner size="xl"` + text. |
| Loading (inline) | `HStack` `Spinner size="sm" color="teal.500"` + "Loading …". |
| Background update | Non-blocking small spinner ("Updating … in the background"). |
| Error | `Alert status="error"` (`borderRadius="md"`, `fontSize="sm"`) with `AlertIcon`. |
| Success / failure ops | `useToast` (success 2s; error 3–3.5s with `description`). |

---

## 6. Accessibility conventions

- Selectable lists: `role="listbox"` + rows `role="option"` `aria-selected`, roving tabindex,
  arrow-key navigation, Enter/Space to select.
- Visible focus: `_focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}`.
- Semantic heading levels (`h2` area → `h3` card → `h4`/`h6` section), `aria-label` on
  sections, `tabIndex={0}` on read-only headings meant to be reachable.
- Color is never the only signal — pair status color with a text label/badge.

---

## 7. Canon vs legacy

**Follow (canon — the newer "graph components" language):**
`components/graph_components/**` (assets, governance, indicators), the
`*MasterContainer` shells, `Card`/`Section` primitives, config-driven badges
(`assetConfig.js`, `governanceTypes.js`), centralized color tokens
(`styles/palette.js`, `services/utils/statusColors.js`), Chakra-prop styling.

**Avoid (legacy — `dashboard_components/report_*` and a few older pieces):**
- `gray.700` card headings (canon = `teal.700`).
- Styling via raw CSS classes in `styles/App.css` (`.goal-section`, etc.) — use Chakra props.
- One-off inline badge hex / ad-hoc `spacing` values.
- New modal-for-reading flows.

When you touch a legacy component, nudge it toward canon (don't wholesale-rewrite unasked).

---

## 8. Known debts (managed design decisions)

Tracked here so choices are deliberate, not accidental:

1. **No theme-level component defaults.** Everything is inline; a restyle touches many files.
   *Aspiration:* lift `Card`, `Section`, `StatusBadge`, and color tokens into `extendTheme` /
   shared components so areas inherit instead of copy. Until then, this doc is the contract.
2. **Teal double-duty** (brand + "advanced" status) — see §2 warning.
3. **Two visual languages** still coexist (canon vs legacy) — converge over time.
4. **Working groups (Web / Instructional Materials / Procurement) have no visual identity** —
   they render identically. Open opportunity: add `color` + `icon` to the `WORKING_GROUPS`
   config and thread through the subnav chip + `GoalNavigator` header.
5. ~~Maturity shown as a single pill, not a ladder.~~ **Addressed** — `StatusLevelLadder`
   (`functional_components/StatusLevelLadder.js`) renders the six-rung ladder with the current
   level emphasized (compact bar in indicator rows; labeled stepper in the detail header). See
   §4.6; reuse it anywhere status appears.

---

## 9. Recipe — building a new area

1. **Config first.** Create `graph_components/<area>/<area>Config.js`: vocab keys → labels +
   `colorScheme`, group ordering, form field defs, helper getters (mirror `assetConfig.js`).
2. **Services.** Add to `services/api/{get,post,put,delete}.js` matching the backend contract
   (plain POST create; action-dispatch PUT; responses wrapped `{status,data,...}` → read
   inside `.data`). Mirror an existing domain's function shapes.
3. **Shell.** `<Area>MasterContainer.js`: stat strip (if there's a diagnostic count) + the
   `flex 1:2` master-detail; container owns load/selection/add-flow.
4. **List.** Copy `GovernanceList`/`SuccessIndicatorList`: search, grouping or flat rows,
   selection, Add button, diagnostic chips/badges, ARIA listbox.
5. **Detail.** `VStack` of `Card`/`Section`: identity card (title + badges + Edit/Delete)
   then inline sections; reuse `PersonAssignmentSelector`/`EntityAttachmentSelector` for links.
6. **Form.** Config-driven `Modal` create/edit (mirror `AssetForm`).
7. **States.** Wire every state from §5. Toasts on every mutation.
8. **Diagnostic pass.** Before calling it done: *what does this area surface at a glance?* Add
   the count/■badge/stat that answers it — that's the house style.
9. **Verify.** `CI=false npm run build` green; check the canon tokens (teal headings, gray.200
   cards, mono IDs, badge variants) match this doc.

**Reference implementations to copy from:** `AssetsMasterContainer.js`,
`GovernanceMasterContainer.js`, `AssetDetailPanel.js`, `GovernanceList.js`,
`SuccessIndicatorList.js` / `SuccessIndicatorDetailPanel.js`, `AssetStatStrip.js`,
`AssetBadges.js`, `assetConfig.js`, `governanceTypes.js`.