---
name: get-source-text
description: Fetch the live content behind a Webpage or Document and store it as Source Text (raw_text) on the node, so agents and maturity reviews can read what a link actually says instead of guessing from its title. Takes an implementation (fills every page it is documented by), a single page/document, or a campus backlog. Triggered by "get the source text", "pull the live content", "mirror this page", "fill in raw_text", "fetch the documentation for X".
---

# Get source text — mirror live content into the graph

`Source Text` in the UI is `raw_text` on Webpage and Document. The URL stays the
record of truth; raw_text is a dated snapshot, and `raw_text_captured` says when it
was taken. Without it a link is only a title — a maturity review, an ingest, or a
report reader has to trust the name and cannot check the claim.

This skill fills that field from the live source. It never invents content: a page
that cannot be fetched is reported as unfetchable, not summarised from its title.

## Step 1 — Resolve the worklist (read-only)

Three entry points, all through the registry runner:

```
# an implementation — every live page/document it is documented by
run_query --query source_text_candidates_for_implementation --param implementation_title="SFSU AT Canvas Remediation"

# the campus backlog — every live webpage with a URL and no Source Text
run_query --query documentation_missing_source_text --param campus_abbreviation=sfsu   # '' for all
```

A single named page or document: resolve it by `unique_id` or `url` with an ad-hoc
read. Both queries already exclude `depreciated` and `no_longer_exists` items —
there is no point mirroring a page that is gone.

Items that already have Source Text are listed with their capture date. **Re-fetch
only when asked or when the snapshot is visibly stale** — overwriting a good mirror
with a worse one (a redirect, a login wall) is the main way this skill does damage.

## Step 2 — Fetch

Use WebFetch on the item's `url`. Ask it to return the page's substantive content as
Markdown — the body a reader would care about, not the chrome.

Strip before storing: site navigation, cookie/consent banners, skip links, footers,
"related links" rails, and repeated breadcrumb trails. Keep: headings, body prose,
lists, tables, form/field labels, contact details, dates, and any policy or procedure
text. The point is that someone can later grep this and quote it.

Handle the four failure modes honestly — each is a FINDING, not a retry loop:

| Result | What it means | What to do |
|---|---|---|
| **403 / login wall** | SSO, vendor portal, or bot-blocked | Do NOT write raw_text. Report it for manual paste — the UI's Source Text box exists for exactly this. |
| **404 / gone** | link rot | Do NOT write raw_text. Flag as a `no_longer_exists` candidate and report it; that flag feeds the "No active documentation" diagnostic. |
| **Cross-host redirect** | WebFetch returns the target rather than following | Re-fetch the redirect URL. If the destination is a different page than the name implies, say so rather than silently mirroring it. |
| **PDF** | binary, WebFetch cannot parse it | Extract locally with `pypdf`, normalise to text, then store. Note in the report that it came from a PDF. |

A fetch that returns a near-empty body, a consent page, or an error page is a
failure even when the HTTP status is 200. Check what you got before writing it.

## Step 3 — Verify before writing

Present the worklist and STOP before any write. Per item: the node, its URL, the
fetch outcome, the character count, and the first line or two of what will be stored.
The user is checking that the mirror is the right content, which they cannot do after
it lands. Failures appear in the same table so the ratio is visible.

## Step 4 — Write

Through the sanctioned update path, one item at a time:

```
PUT /ati/data-api/v1/documents/webpages
{ "action": "update_webpage",
  "webpage_dict": { "unique_id": "<uid>", "raw_text": "<markdown>" } }

PUT /ati/data-api/v1/documents/documents
{ "action": "update_document",
  "document_dict": { "unique_id": "<uid>", "raw_text": "<markdown>" } }
```

The type segment is required by the route (`/documents/<document_type>`); a bare
`/documents` 500s on a missing positional argument. Calling `update_webpage` /
`update_document` from `queries/documentation/update.py` directly works too.

**Pass NOTHING else.** The optional arguments on these functions are association
side-effects, and every one of them is a silent bug in this context:

- `maintained_by` → `disconnect_all()` then reconnect, **reassigning the maintainer**
  to whoever ran the fetch.
- `year_success_evidence` → connects a fresh `has_webpage`/`has_note` edge, giving
  the item a second home it did not have.
- `implementation_id` + `academic_year` + `include_in_year` → rewrites year curation
  on the documentation edge, changing which report years show the item.

Filling Source Text must change exactly one property. `raw_text_captured` is stamped
by the query layer automatically, and only when the text actually changes — so a
re-run that fetches identical content correctly leaves the date alone.

## Step 5 — Report

Per item: written (with char count), skipped (already had a mirror), or failed (with
the reason). Then the two lists that are the real output of a run:

- **Needs manual paste** — the 403s. Give the node name and URL so the user can
  paste into the Source Text box.
- **Link-rot candidates** — the 404s, as `no_longer_exists` proposals. Do not set
  that flag from this skill; it changes what the documentation diagnostics say, and
  a transient outage looks identical to a dead page on one attempt.

Confirm by read-back that `raw_text_captured` moved on the items you wrote.

## Scope

- **Webpage** and **Document** carry Source Text and are this skill's targets.
- **Governance types** (Law, Case, Directive, ExternalPolicy, Memo, Guideline) also
  carry `raw_text` with the same contract, written through
  `update_governance_item`. Same rules apply; the payload key differs.
- **Implementations do not carry raw_text.** Naming one means "fill everything it is
  documented by" — the implementation is the entry point, never the target.
- Never write raw_text on a `depreciated` or `no_longer_exists` item. If the user
  asks for one specifically, say why it was excluded and let them override.
