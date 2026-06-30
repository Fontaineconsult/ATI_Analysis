# Components — Card & Section

The two surface primitives that recur everywhere. **Source of truth:**
`design-sense.md` §3.3 + the reference implementations
(`graph_components/assets/AssetDetailPanel.js`). Copy these verbatim — there is
no theme-level component default yet (tracked debt, `design-sense.md` §8.1), so
every surface re-states these props inline.

---

## Card — a titled white surface

```jsx
const Card = ({ title, children, ...rest }) => (
  <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
       boxShadow="sm" p={5} {...rest}>
    {title && (
      <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>
    )}
    {children}
  </Box>
);
```

- Heading is `teal.700` (the canon) — **not** `gray.700` (legacy tell).
- `p={5}` for detail cards; drop to `p={4}` for standard, `p={3}` for dense.

---

## Section — denser inner block, signature uppercase heading

```jsx
const Section = ({ title, children }) => (
  <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
       boxShadow="sm" p={3}>
    <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase"
             letterSpacing="wide" mb={2}>{title}</Heading>
    {children}
  </Box>
);
```

The uppercase + wide-tracking + `teal.700` heading is the app's signature
section look (see `foundations/typography.md`).

---

## Composing a detail panel

A detail panel = a `VStack spacing={4}` of these, **flattened inline** — identity
`Card` first (title + badges + Edit/Delete), then `Section`s. **No nested modals
for reading** (`design-sense.md` §1.3) — modals are for create/edit forms and
action gates only.

```jsx
<VStack spacing={4} align="stretch">
  <Card title={null}>{/* identity: title, badges, actions */}</Card>
  <Section title="Stewardship">{/* … */}</Section>
  <Section title="Remediation">{/* … */}</Section>
</VStack>
```

---

## Stat-strip card (diagnostic dashboard)

Top-of-area counts with a colored top accent (`AssetStatStrip.js`). Lead with the
**attention** metric (e.g. "⚠ Elevation", "TAAPs due") — diagnostic-first
(`design-sense.md` §1.1).

```jsx
<Box flex="1" bg="white" borderRadius="lg" boxShadow="sm"
     borderTopWidth="3px" borderTopColor={accent} p={4}>
  <Stat>
    <StatLabel>…</StatLabel>
    <StatNumber>…</StatNumber>
    <StatHelpText>…</StatHelpText>
  </Stat>
</Box>
```

---

## Accessibility

- Semantic heading levels nest correctly: `h2` area → `h3` Card → `h4` Section.
  Always set `as=` (see `foundations/typography.md`).
- Read-only headings meant to be reachable get `tabIndex={0}` + an `aria-label`
  on the section.
