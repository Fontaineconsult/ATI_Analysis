# Foundations — Spacing & Shape

**Source of truth:** `design-sense.md` §2 (spacing/shape), `styles/App.css`
(container widths, chrome). Chakra spacing scale (`1` = `0.25rem` = 4px).

---

## Spacing rhythm

| Context | Value | Notes |
|---|---|---|
| Between cards (`VStack`/`Flex` `spacing`/`gap`) | `3`–`4` | 12–16px |
| Inside a card | `2` | 8px |
| Detail panel stack | `VStack spacing={4}` | identity Card first, then Sections |
| Master-detail column gap | `gap={6}` | 24px between list and detail |
| Page container padding | `px={6}`, main `pt={6}` | |

> ⚠ Be consistent. Legacy areas drift between `2`–`4` arbitrarily — don't add to
> the drift. Pick from the table above.

---

## Shape

### Cards / surfaces

| Prop | Value |
|---|---|
| `borderRadius` | `lg` |
| `boxShadow` | `sm` |
| `borderWidth` | `1px` |
| `borderColor` | `gray.200` |
| `padding` | `p={5}` (detail cards) · `p={4}` (standard) · `p={3}` (dense inner) |

### Stat-strip cards

Same surface, plus a colored top accent: `borderTopWidth="3px"` +
`borderTopColor={accent}`.

### Badges / pills

| Kind | `borderRadius` |
|---|---|
| Status pills | `full` |
| Type / category badges | `md` |

### Selection / list rows

`borderLeftWidth="3px"` — `teal.500` when selected, `transparent` otherwise;
`bg="teal.50"` when selected; compact `px={3} py={1.5}`.

---

## Containers & breakpoints

| Token | Value | Source |
|---|---|---|
| Page container | `Container maxW="container.xl"` | = **1400px** (overridden in `App.css` `:root`, default is 1280) |
| `container.lg` | 1280px | `App.css` `:root` |
| `container.md` | 768px | `App.css` `:root` |
| `container.sm` | 640px | `App.css` `:root` |
| `.App-content` max-width | 1400px, `padding: 2rem` | `App.css` |
| Mobile breakpoint | `max-width: 768px` → padding `1rem` | `App.css` |

> The Chakra `container.*` size tokens are overridden in `App.css` `:root` with
> `!important`. If a layout's max width surprises you, that's why — check
> `:root` before `theme.js`.

---

## Chrome dimensions (`App.css`)

| Element | Value |
|---|---|
| `.App-header` | navy `#202c4a`, `padding: 1rem`, `box-shadow: 0 2px 4px rgba(0,0,0,.1)` |
| `.nav-bar` | `#2a3a62`, `height: 60px`, 1px `#2d3748` top+bottom borders |
| `.main-content` | `padding-top: 112px` (offsets fixed header) |

---

## Master-detail ratio (the area shell)

The canonical layout (`design-sense.md` §3.1) — **1 : 2** list-to-detail:

```jsx
<Flex gap={6} align="flex-start">
  <Box flex="1" minW="0" maxW="400px">{/* List */}</Box>
  <Box flex="2" minW="0">{/* DetailPanel */}</Box>
</Flex>
```

Always `minW="0"` on both columns so text truncation (`noOfLines`) works.
