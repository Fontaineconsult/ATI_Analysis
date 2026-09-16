# Search guide: VPAT, ACR review, and ICT procurement review

Compiled 2026-09-16, revised the same day after the routing rule was corrected.

Scope is the external canon around accessibility conformance reporting and procurement
review. This is deliberately NOT campus evidence. Nothing here is an Implementation, a
Document, or a Webpage hanging off a campus YSE.

The findings come from web search, not from fetching each page. Every entry is marked for
whether its Source Text still has to be pulled. The ETL fetches; this guide decides what
to fetch and where it lands.

## 1. What an intellectual source is for

An intellectual source carries **no authority**. Nothing in it obliges a campus to do
anything. That is the whole distinction from Governance, and it is why the two are
separate tabs rather than one list with a type filter.

What it is instead: **read material a campus draws on when authoring a new
implementation, or when an existing one turns out to be behind what the field knows.**
The second half matters as much as the first. A campus Process written in 2019 against
WCAG 2.0 is not wrong, it is dated, and the thing that reveals it as dated is a source
like these rather than an audit finding. An intellectual source is how evidence gets
updated rather than only graded.

Three tests, all of which have to pass.

1. **No authority over the CSU.** If it binds us, it is Governance.
2. **Read material, not a thing you join or buy.** A consortium's testing program is a
   service. If the CSU joined it, participation would be a campus Implementation, and the
   program would be its subject rather than its grounding. Same for a vendor product.
3. **An idea: theory, model, method, or scholarship.** Not a description of someone's
   operations.

### Why Section 508 material is Governance, not theory

California Government Code Section 7405 adopts Section 508 for California state entities,
and the CSU is one. That statute is already a Law node in this graph. So the Section 508
apparatus reaches us through California law, and everything in it that sets a requirement
is Governance however procedural it reads. The Revised Standards, the ICT Testing
Baseline, and the federal program's own buying guidance all sit on the Governance side
for that reason. This corrects the first draft of this guide, which filed the federal
buying guidance as a borrowed method.

The line does not run between "standard" and "method". It runs between what reaches us as
a requirement and what we choose to read.

## 2. The schema change, now made

`IntellectualSource` previously carried `unique_id`, `name`, `description_short` and
`description_full`. Every source in this guide is a document, so those four fields made
the nodes names without sources.

Added in `graph_schema.py`, with the query layer updated to match:

| Field | Purpose |
|---|---|
| `url` | Where the source lives. The record of truth. |
| `raw_text` | Agent-readable mirror, same contract as Webpage and Document. |
| `raw_text_captured` | When the snapshot was taken. Stamped by the query layer, never accepted from the caller, and moves only when the text itself changes. |
| `author` | Whose thinking this is. A principle grounded in scholarship has to say whose. |
| `publisher` | The body that issued it. |
| `published_date` | A source's age is what says whether the field has moved on. |
| `citation` | The full formal citation, where author plus publisher does not let a reader find the work again. |

`create.py` stamps `raw_text_captured` on create and coerces `published_date` through a
`_coerce_date` that raises `ValidationError` rather than letting a client typo escape as a
500. `update.py` handles `raw_text` outside the patch loop on the governance contract, so
an unrelated edit cannot make a stale mirror look freshly captured, and clearing the text
clears the date. Verified through a Flask boot: 11 properties present, bad dates rejected,
read path intact.

This means `/get-source-text` can fill these nodes with no second code path.

## 3. What is already in the graph

70 governance items. Zero IntellectualSource nodes. Four governance items carry Source
Text.

The ETL must MERGE rather than create against: Revised Section 508 Standards (36 CFR Part
1194) (2017); Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh); EN
301 549 (V3.2.1, 2021); WCAG 2.0, 2.1 and 2.2; WCAG Evaluation Methodology (WCAG-EM) 2.0;
California Government Code Section 7405; TAAP Authoring Template.

Note the duplicate: "Section 508 of the Rehabilitation Act of 1973" and "Rehabilitation
Act of 1973, Section 508" are two nodes for one statute. Do not add a third. Already on
the graph work backlog.

Absent, which is the gap this guide fills: the VPAT itself, Section508.gov, the ICT
Testing Baseline, WCAG2ICT, and every ACR review method.

## 4. Governance candidates

### 4.1 Voluntary Product Accessibility Template (VPAT) 2.5Rev

```yaml
type: Guideline
merge_key: title
properties:
  title: "Voluntary Product Accessibility Template (VPAT) 2.5Rev"
  description: "The industry template vendors complete to report how a product conforms to accessibility standards. Published by the Information Technology Industry Council. A completed VPAT is an Accessibility Conformance Report (ACR). Issued in four editions: 508, WCAG, EU (EN 301 549), and INT, which covers all three."
  effective_date: "2025-04-01"
  last_updated: "2025-04-01"
sources:
  - url: "https://www.itic.org/policy/accessibility/vpat"
    title: "VPAT, Information Technology Industry Council"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  Version 2.5Rev, April 2025, per ITI. Confirm the version at fetch time, because ITI
  revises this without renaming the page. Distributed as .doc, so the fetch needs the
  document rather than the landing page. The template itself carries no legal force
  anywhere, but it is Governance here because it is the required artifact in the
  procurement chain that Section 508 and Gov Code 7405 put us in. This node is the anchor
  every review method in section 5 points back at.
```

### 4.2 Section 508 ICT Testing Baseline

```yaml
type: Guideline
merge_key: title
properties:
  title: "Section 508 ICT Testing Baseline"
  description: "The minimum tests and evaluation guidance that determine whether content meets Section 508 requirements. Maintained by the U.S. Access Board. Covers a Baseline for Web and a Baseline for Documents, with software and hardware baselines in development. Establishes what a conformance claim was actually tested against."
sources:
  - url: "https://ictbaseline.access-board.gov/"
    title: "Section 508 ICT Testing Baseline Portfolio, U.S. Access Board"
    accessed: "2026-09-16"
  - url: "https://ictbaseline.access-board.gov/web-baselines/"
    title: "Baseline for Web"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  Access Board authorship, and it defines conformance to a standard that reaches us
  through Gov Code 7405. Pairs with WCAG-EM, already in the graph.
```

### 4.3 WCAG2ICT

```yaml
type: Guideline
merge_key: title
properties:
  title: "Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)"
  description: "W3C Group Note describing how WCAG 2 principles and success criteria apply to non-web documents and software, including mobile apps, native applications, and software with closed functionality. Informative rather than normative. Updated in coordination with EN 301 549."
  last_updated: "2025-08-21"
sources:
  - url: "https://www.w3.org/TR/wcag2ict-22/"
    title: "WCAG2ICT, W3C Group Note"
    accessed: "2026-09-16"
  - url: "https://www.w3.org/WAI/standards-guidelines/wcag/non-web-ict/"
    title: "WCAG2ICT Overview, W3C WAI"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  W3C publishes the standard we are measured against, and WCAG 2.0 through 2.2 are already
  Guideline nodes here. The note is explicitly informative and the description says so.
  It matters because most purchased ICT is not a website, and WCAG2ICT is what makes a
  WCAG claim meaningful for a desktop application or a PDF.
```

### 4.4 Section 508 program guidance on buying accessible ICT

```yaml
type: Directive
merge_key: title
properties:
  title: "Section508.gov Guidance on Accessibility in Procurement"
  description: "The U.S. federal Section 508 program's guidance for buying accessible ICT: how to define accessibility criteria in solicitations, pre-solicitation and post-solicitation review, and the supporting tools. Includes the Accessibility Requirements Tool (ART), which generates the accessibility requirement statements belonging in a solicitation, and the Solicitation Review Tool (SRT), which checks a drafted solicitation for them. Administered by GSA."
sources:
  - url: "https://www.section508.gov/buy/define-accessibility-criteria/"
    title: "Define Accessibility Criteria in Contracts, Section508.gov"
    accessed: "2026-09-16"
  - url: "https://www.section508.gov/buy/accessibility-in-procurement-pre-solicitation-2/"
    title: "Accessibility in Procurement II: Solicitation and Post-Solicitation"
    accessed: "2026-09-16"
  - url: "https://www.section508.gov/tools/list-of-art-requirements/"
    title: "Accessibility Requirements Tool (ART) Requirements Statements by ICT"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  Governance, on the Gov Code 7405 reasoning in section 1. The first draft of this guide
  had this as an open question and ART/SRT as a separate intellectual source; both are
  resolved here. ART and SRT are tools within the federal program rather than theory, so
  they are described on this node instead of getting nodes of their own. ART's generated
  requirement statements are the concrete thing a campus procurement procedure would
  borrow, which makes this the highest-value fetch in section 4.
```

## 5. IntellectualSource candidates

Five. Each passes all three tests in section 1: no authority over us, read material, an
idea rather than an operation. This is the first content the new tab would hold.

### 5.1 Commonwealth of Massachusetts ACR Review Checklist

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Commonwealth of Massachusetts Accessibility Conformance Report Review Checklist"
  description_short: "A yes/no method for judging whether a vendor's conformance report is credible."
  description_full: >-
    Each check is a yes/no question where "yes" supports the report's validity. The checks
    cover who completed the report and whether they had accessibility expertise or were a
    reputable third party, whether it measures conformance against WCAG 2.1 or 2.2 levels
    A and AA, and whether the Remarks and Explanations column carries detail for every
    criterion marked Partially Supports or Does Not Support. It is the clearest published
    answer to what reviewing a conformance report means beyond collecting one.
  url: "https://www.mass.gov/info-details/accessibility-conformance-report-review"
  publisher: "Commonwealth of Massachusetts"
sources:
  - url: "https://www.mass.gov/doc/accessibility-conformance-report-review-checklist/download"
    title: "Accessibility Conformance Report Review Checklist (download)"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  The worked example of test 1. A government instrument with real force in its own
  jurisdiction and none over us, so it is read material here. The highest-value item in
  this guide for authoring: SF State's library said plainly it performs no substantive
  review of conformance reports, and this is what a substantive review procedure would be
  written from.
```

### 5.2 Harvard, How to Interpret a VPAT

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "How to Interpret a VPAT (Harvard Digital Accessibility Services)"
  description_short: "A guide to reading a conformance report, including the patterns that show it was not taken seriously."
  description_full: >-
    Written for non-specialist buyers. Names the red flags directly: an empty Remarks
    column, a bare "Partially Supports" with no context, a document where nearly every row
    reads Supports or Not Applicable, missing version numbers, and an outdated report.
  url: "https://accessibility.huit.harvard.edu/interpret-vpat"
  publisher: "Harvard University Digital Accessibility Services"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  Teaching material rather than a description of Harvard's operations, which is what keeps
  it on the right side of test 3.
```

### 5.3 University of Michigan, Evaluate Compliance Documentation

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Evaluate Compliance Documentation (University of Michigan)"
  description_short: "Three tests a conformance report must pass before it counts as evidence."
  description_full: >-
    A report must be created or updated within the past year, written against WCAG, and
    specific to the product and version under consideration. The version test is the one
    campuses most often skip, because vendors supply a report for a product line rather
    than for the release being licensed.
  url: "https://accessibility.umich.edu/how-to/procurement-vendors/evaluate-compliance"
  publisher: "University of Michigan"
confidence: high
source_text: REQUIRED, not yet fetched
```

### 5.4 Impact-tiered ICT accessibility review

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Impact-tiered ICT accessibility review"
  description_short: "A model that sizes the depth of an accessibility review to a product's reach."
  description_full: >-
    High-impact products get an in-depth review, including testing that validates rather
    than accepts the vendor's claims. Medium-impact products are reviewed at a committee's
    discretion. Where barriers are found and the purchase proceeds, it proceeds on an
    Equally Effective Alternate Access Plan naming the barriers, the workaround, how
    barriers are communicated, the resources required, and who is responsible. The model
    resolves the problem that verifying every purchase is impossible and verifying none of
    them is negligent, by making reach the thing that decides.
confidence: medium
source_text: REQUIRED for at least two of the sources, not yet fetched
sources:
  - url: "https://www.mtu.edu/accessibility/policies/procedures/procurement/"
    title: "ICT Procurement Procedures, Michigan Technological University"
    accessed: "2026-09-16"
  - url: "https://access.illinois.edu/ada/digital-accessibility-policy/procurement/"
    title: "ICT Procurement Requirements, University of Illinois"
    accessed: "2026-09-16"
  - url: "https://www.unr.edu/accessibility/resources/procurement/process"
    title: "ICT Procurement Process, University of Nevada, Reno"
    accessed: "2026-09-16"
  - url: "https://www.section508.gov/blog/Accessibility-risk-management-and-model/"
    title: "Accessibility Risk Management and Risk Model for ICT, Section508.gov"
    accessed: "2026-09-16"
notes: >-
  A synthesized node, which the ETL should surface for approval rather than assume. The
  model is the intellectual source; each university's page is one instance of it, and
  those pages are other campuses' evidence rather than ours. That is the reason to
  synthesize instead of creating four nodes. Directly relevant to 4.6-pro, where CSUEB's
  own campus-level EAP process is retired.
```

### 5.5 Prioritizing Accessibility in the E-Resources Procurement Lifecycle

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Prioritizing Accessibility in the E-Resources Procurement Lifecycle"
  description_short: "Peer-reviewed treatment of conformance reports as a working tool across acquisition and remediation in academic libraries."
  description_full: >-
    Treats the conformance report as an instrument used throughout an acquisition lifecycle
    rather than a gate passed once at purchase, and connects acquisition decisions to the
    remediation work that follows them.
  url: "https://www.tandfonline.com/doi/full/10.1080/0361526X.2020.1722020"
  publisher: "Serials Review (Taylor and Francis)"
  published_date: "2020-01-01"
  citation: "Serials Review, 2020. DOI 10.1080/0361526X.2020.1722020."
confidence: medium
source_text: LIKELY BLOCKED, publisher paywall
notes: >-
  The purest case for this node type: scholarship, no authority, read to author. Expect a
  403 from Taylor and Francis. Per /get-source-text, a paywall is a manual-paste finding
  and is never summarised from the abstract. The description above is drawn from the title
  and publication rather than from claims about the contents. Confirm the exact issue,
  volume and authors at fetch time before filling `citation`.
```

## 6. Deliberately excluded

- **The Library Accessibility Alliance.** Reclassified out of this guide on test 2. It is
  a program that funds third-party WCAG 2.1 AA evaluations of vendor e-resources and
  publishes them, run by the Big Ten Academic Alliance with ASERL, GWLA and WRLC. That is
  a service a library joins, not an idea a library reads. If the CSU or a campus library
  participates, that participation is a campus Implementation and the Alliance is its
  subject. **It is still worth asking about in the CSUEB library interview**, because SF
  State's library said it has no capacity to verify a 40-page conformance report and this
  is the standing arrangement other consortia built for exactly that. It belongs in the
  interview guide, not in the ontology as theory.
- **BTAA and TRLN model license language.** Dropped from the intellectual-source list on
  the same test, with less certainty. Model contract clauses obliging a vendor to warrant
  WCAG AA conformance, barring disclaimer, and seeking indemnification are read material a
  campus would draw on. But they are the output of a consortium's licensing operation
  rather than a theory, and the CSU's own licensing runs through the Chancellor's Office
  rather than through these consortia. **Flagged for your call**: if you want it, it is one
  node covering both, and the TRLN guide is a PDF the fetch will need directly.
- **GSA ART and SRT.** Folded into section 4.4 as tools within the federal program. They
  are software, not theory.
- **SF State's ATI procurement procedure, Sonoma's VPAT page, CSU Northridge's procurement
  pages.** Campus evidence. Putting a campus's practice in with the canon would let a
  campus cite itself as the standard it is measured against.
- **Vendor and consultancy content.** Level Access, accessiBe, TestPros, BarrierBreak.
  Accurate and commercial. Excluded on provenance, not accuracy.
- **Wikipedia.** Usable to confirm a date, not to ground a principle.

## 7. What the tab needs

The backend is now complete: node class with provenance, full CRUD in
`app/database/queries/intellectual_sources/`, a MethodView at `/intellectual-sources`, and
the API service functions in `services/api/{get,post,put}.js`.

Missing, in build order:

1. `components/graph_components/intellectual_sources/intellectualSourceTypes.js`, the
   structural field registry matching `principleTypes.js`. Eleven fields now, with
   `raw_text` as a `markdown` type so it gets the same editor the governance Source Text
   field uses.
2. `IntellectualSourceList.js`, `IntellectualSourceDetailPanel.js`,
   `IntellectualSourceForm.js`, following the principles trio.
3. `IntellectualSourceMasterContainer.js` in `ati_explorer_containers/`.
4. A third tab in `GovernanceArea.js`. The tab index is currently a binary
   (`activeTab === 'principles' ? 1 : 0`), so it and `handleTabChange` both become a
   lookup over three route slugs.
5. The `/:campus/ati-explorer/intellectual-sources` route in `App.js`.
6. Field descriptors. `seed_descriptors.py` line 62 already lists `IntellectualSource`
   among the described labels, but `FIELD_DESCRIPTORS` has no entries for its fields, so
   the form would render without prose. The seven new fields need descriptor text.
7. `PrincipleGroundingTags.js` and `PrincipleSourceBadge.js` already handle
   IntellectualSource as a `derives_from` target. Verify rather than rebuild.

## 8. Two principles this work would ground

Checked against the live graph on 2026-09-16. All 16 principles are grounded, and every
grounding is a Law, Directive, Memo or Guideline, because IntellectualSource has never had
an instance to point at.

**`graph-work-backlog.md` section 3 is stale here.** It says
`universal-design-over-accommodation` "remains ungrounded and without a `description_full`,
and it may want an `IntellectualSource` rather than a Law." That principle now has three
groundings and a full description. The principle with no `description_full` today is
`institution-wide-responsibility`. Correct the backlog when someone next touches it.

The instinct behind it was right, and the live graph sharpens it.

- **`principle:universal-design-over-accommodation`** is grounded in ADA Title II,
  California Government Code Section 7405, and Section 508. All three are statutes.
  Universal design is a design movement, not a statutory invention, so the principle cites
  the mandate that adopted the idea and not the idea itself. The source is not in this
  guide, because this guide is about procurement review. Ron Mace and the Center for
  Universal Design at NC State is the target for a separate pass.
- **`principle:vendor-leverage-procurement-as-accessibility-lever`** has exactly one
  grounding, the ATI Directive, the thinnest in the graph. It is also the principle this
  guide is about. Sections 5.1 and 5.4 ground it in method: judging a conformance claim
  and sizing review to reach are two ways of exercising the leverage the principle
  asserts. One CSU directive and nothing else understates what is known about how that
  leverage works.

## 9. Open decisions for the ETL

1. **BTAA and TRLN model license language: in or out?** Section 6. The only genuine
   borderline left after the routing rule was corrected.
2. **Impact tiering as one synthesized node or four?** Section 5.4.
3. **The duplicate Section 508 statute nodes.** Already on the backlog; this ETL is a
   reasonable moment to settle it.
4. **`derives_from` edges are a second pass.** After the nodes exist and their Source Text
   is in hand. Writing them from the descriptions above rather than from the sources would
   be reasoning from a summary, which the backlog already names as the thing not to do.
