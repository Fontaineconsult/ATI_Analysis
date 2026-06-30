# Foundations — Typography

**Source of truth:** `theme.js` (`fontSizes`), `styles/App.css` (font family),
`design-sense.md` §2 (heading patterns). See `index.html` for live specimens.

---

## Font family

- **UI font: Roboto** — set on `body, html, #root` in `App.css`
  (`font-family: 'Roboto', sans-serif`).
- Headings use the same family (Chakra default inherits `body`).

> ⚠ **Known debt:** `App.css` `@import`s **Source Sans Pro** at the top but the
> `font-family` rule names **Roboto** — so the imported face is unused and Roboto
> resolves via the system/Chakra fallback chain. When you next touch global CSS,
> reconcile this: either load Roboto explicitly or switch the family to the
> imported Source Sans Pro. Don't add a third font.

---

## Type scale (`theme.js` `fontSizes`)

| Token | rem | px @16 | Typical use |
|---|---|---|---|
| `2xs` | _(Chakra default `0.625rem`)_ | 10 | Dense list meta, micro-badges, brand-band eyebrow |
| `xs` | `0.75rem` | 12 | Secondary / meta text |
| `sm` | `0.875rem` | 14 | **Body default**, inputs, buttons |
| `md` | `1rem` | 16 | Card/page heading (`Heading size="md"`) |
| `lg` | `1.125rem` | 18 | Area title (`Heading as="h2" size="lg"`) |
| `xl` | `1.25rem` | 20 | |
| `2xl` | `1.5rem` | 24 | |
| `3xl` | `1.875rem` | 30 | |
| `4xl` | `2.25rem` | 36 | |

(`2xs` is not in the `theme.js` override — it is Chakra's built-in `0.625rem`,
used widely in the canon for micro-text.)

---

## Heading & text patterns (`design-sense.md` §2)

| Role | Recipe |
|---|---|
| **Area title** | `Heading as="h2" size="lg" color="gray.800"` |
| **Card / page heading** | `Heading size="md"` (working-group/area title, `teal.700`) |
| **Card heading (in Card primitive)** | `Heading as="h3" size="sm" color="teal.700"` |
| **Section heading (signature look)** | `Heading as="h4" size="xs"` + `textTransform="uppercase"` `letterSpacing="wide"` `color="teal.700"` |
| **Body** | `fontSize="sm"` (`gray.800` / `gray.700`) |
| **Secondary / meta** | `fontSize="xs"` (`gray.600`) |
| **Micro (dense meta, badges)** | `fontSize="2xs"` |
| **Identifiers** (composite keys, handles, `asset_identifier`) | `fontFamily="mono"` `color="gray.400"` |
| **Eyebrow** (brand band, About) | `fontSize="2xs"` `textTransform="uppercase"` `letterSpacing="0.18em"` |

### The signature section heading

The single most recognizable type treatment in the app — uppercase, wide
tracking, brand-blue, small:

```jsx
<Heading as="h4" size="xs" color="teal.700"
         textTransform="uppercase" letterSpacing="wide" mb={2}>
  {title}
</Heading>
```

---

## Rules

- **Headings carry `teal.700`** in the canon; `gray.700` headings are a *legacy*
  tell (`design-sense.md` §7) — nudge toward `teal.700`.
- **Always set `as=`** on `Heading` so the semantic level is explicit and the
  document outline stays correct (`h2` area → `h3` card → `h4` section). This is
  an accessibility product — the heading hierarchy is load-bearing.
- Color is never the only signal — pair it with text/label/badge.
