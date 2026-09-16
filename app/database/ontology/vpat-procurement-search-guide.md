# Search guide: VPAT, ACR review, and ICT procurement review

Compiled 2026-09-16. Scope is the external canon around accessibility conformance
reporting and procurement review. This is deliberately NOT campus evidence. Nothing
here is an Implementation, a Document, or a Webpage hanging off a campus YSE. These
are the instruments and the methods the campuses are measured against, which is why
they belong in the Governance area rather than in evidence.

The findings below come from web search, not from fetching each page. Every entry is
marked for whether its Source Text still has to be pulled. The ETL fetches; this guide
decides what to fetch and where it lands.

## 1. The routing rule

Governance and IntellectualSource are both `derives_from` targets for a Principle.
Governance grounds a principle in mandate. IntellectualSource grounds it in theory or
method. The line that decides which one a source is:

> **Does this instrument have authority over the CSU, or is it a method we borrow?**

A source that binds us is Governance, under the type that matches its force. A source
that teaches a way of working, with no authority over us, is an IntellectualSource,
however official it is in its own jurisdiction. Massachusetts publishes an ACR review
checklist that binds Commonwealth agencies. It does not bind the CSU. For this graph it
is a borrowed method, so it lands as an IntellectualSource, and the guide says so out
loud rather than inflating it into a directive.

Two corollaries worth stating, because both are easy to get wrong.

- **A federal standard binds us; federal implementation guidance mostly does not.** The
  Revised Section 508 Standards are a rule. Section508.gov's buying guidance is GSA
  telling federal agencies how to comply. The CSU is not a federal agency, so that
  guidance is a method, not a mandate.
- **A template is not a standard.** The VPAT is an industry template published by a trade
  association. It carries no legal force anywhere. It is in the Governance area as a
  Guideline only because procurement practice treats it as the required artifact, and
  because EN 301 549 and Section 508 are what it reports against.

## 2. A schema gap the ETL will hit

`IntellectualSource` carries `unique_id`, `name` (unique, required), `description_short`
and `description_full`. It has no URL field and no `raw_text`.

Every source in this guide is a web document. Without a URL the node cannot be traced
back to what it says, and without `raw_text` it is unreadable to `/maturity-status-reviewer`
and to vector search, which is the whole reason Governance types carry Source Text.

The proposal, which the ETL depends on and which is not yet written:

```
class IntellectualSource(StructuredNode):
    ...
    url        = StringProperty()   # where the source lives
    raw_text   = StringProperty()   # agent-readable mirror, same contract as Governance
    raw_text_captured = DateTimeProperty()   # stamped by the query layer, moves only on change
```

That mirrors the `RAW_TEXT_FIELD` the six Governance types already share, and it makes
`/get-source-text` work against intellectual sources without a second code path. Until it
lands, the ETL can only write `name` and the two descriptions, and every source text has
to be re-fetched later.

Decide this before the ETL, not after. Adding `url` afterwards means backfilling by hand.

## 3. What is already in the graph

70 governance items exist. Zero IntellectualSource nodes exist. Four governance items
carry Source Text.

Already present, so the ETL must MERGE rather than create:

- Revised Section 508 Standards (36 CFR Part 1194) (2017), a Guideline.
- Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh), a Directive.
- EN 301 549 (V3.2.1, 2021), a Guideline.
- WCAG 2.0, 2.1 and 2.2, Guidelines.
- WCAG Evaluation Methodology (WCAG-EM) 2.0, a Guideline.
- Section 508 of the Rehabilitation Act of 1973, a Law. Note the duplicate:
  "Rehabilitation Act of 1973, Section 508" is a second node for the same statute. The
  ETL should not add a third, and the duplicate is already on the graph work backlog.
- TAAP Authoring Template, a Guideline, with 18,612 characters of Source Text.

Absent, which is the gap this guide fills: the VPAT itself, anything from Section508.gov,
the ICT Testing Baseline, WCAG2ICT, and every ACR review method.

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
  revises this without renaming the page. The template is distributed as .doc, so the
  fetch will need the document rather than the landing page. This node is the anchor
  every ACR review method below points back at.
```

### 4.2 Section 508 ICT Testing Baseline

```yaml
type: Guideline
merge_key: title
properties:
  title: "Section 508 ICT Testing Baseline"
  description: "The minimum tests and evaluation guidance that determine whether content meets Section 508 requirements. Maintained by the U.S. Access Board. Covers a Baseline for Web and a Baseline for Documents, with software and hardware baselines in development. Reduces ambiguity about what a conformance claim was actually tested against."
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
  Access Board authorship is what makes this Governance rather than method. It is the
  test procedure behind a credible ACR, so it is the instrument an ACR review cites when
  asking how a vendor tested. Pairs with WCAG-EM, already in the graph.
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
  Borderline case, resolved toward Governance because W3C is the body that publishes the
  standard the CSU is measured against, and because WCAG 2.0 through 2.2 are already
  Guideline nodes here. The note is explicitly informative, and the description says so,
  which is the honest version. It matters for procurement because most purchased ICT is
  not a website, and WCAG2ICT is what makes a WCAG claim meaningful for a desktop
  application or a PDF.
```

### 4.4 Section 508 program guidance on buying accessible ICT

```yaml
type: Directive
merge_key: title
properties:
  title: "Section508.gov Guidance on Accessibility in Procurement"
  description: "The U.S. federal Section 508 program's guidance for buying accessible ICT, covering how to define accessibility criteria in solicitations, pre-solicitation and post-solicitation review, and the tools that support it. Administered by GSA."
sources:
  - url: "https://www.section508.gov/buy/define-accessibility-criteria/"
    title: "Define Accessibility Criteria in Contracts, Section508.gov"
    accessed: "2026-09-16"
  - url: "https://www.section508.gov/buy/accessibility-in-procurement-pre-solicitation-2/"
    title: "Accessibility in Procurement II: Solicitation and Post-Solicitation"
    accessed: "2026-09-16"
confidence: medium
source_text: REQUIRED, not yet fetched
notes: >-
  Filed as Directive because it is an official instruction guiding implementation, which
  is the type's definition, and because GSA administers the federal 508 program. The
  reservation, which the description should not hide: it instructs federal agencies, and
  the CSU is a state entity. If the working group would rather not imply it binds us,
  the alternative filing is IntellectualSource. Flagged for a decision rather than
  decided here.
```

## 5. IntellectualSource candidates

These teach a method. None has authority over the CSU. This is the first content the new
tab would hold, and it is also the honest answer to the question the CSUEB and SF State
library interviews both raised, which is what a campus is actually expected to DO with a
conformance report once it has one.

### 5.1 Accessibility Requirements Tool and Solicitation Review Tool

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "GSA Accessibility Requirements Tool (ART) and Solicitation Review Tool (SRT)"
  description_short: "Two federal tools that generate accessibility requirement language for a solicitation and then check a draft solicitation for it."
  description_full: >-
    ART produces the accessibility requirement statements that belong in a solicitation,
    selected by the kind of ICT being bought. SRT checks a drafted solicitation for
    sufficient accessibility requirements before it goes out. Together they turn "include
    accessibility requirements" from an instruction into a generated artifact, which is
    the step most campus procurement processes are missing. The method transfers even
    though the federal contracting vocabulary does not.
sources:
  - url: "https://www.section508.gov/tools/list-of-art-requirements/"
    title: "Accessibility Requirements Tool (ART) Requirements Statements by ICT"
    accessed: "2026-09-16"
confidence: medium
source_text: REQUIRED, not yet fetched
notes: >-
  Grounds a principle about requirements being generated rather than remembered. Relevant
  to 1.9-pro and 4.6-pro.
```

### 5.2 Commonwealth of Massachusetts ACR Review Checklist

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Commonwealth of Massachusetts Accessibility Conformance Report Review Checklist"
  description_short: "A yes/no checklist for judging whether a vendor's ACR is credible, published by the Commonwealth of Massachusetts."
  description_full: >-
    Each check is a yes/no question where "yes" supports the report's validity. The checks
    cover who completed the report and whether they had accessibility expertise or were a
    reputable third party, whether it measures conformance against WCAG 2.1 or 2.2 levels
    A and AA, and whether the Remarks and Explanations column carries detail for every
    criterion marked Partially Supports or Does Not Support. It is the clearest published
    answer to the question of what reviewing an ACR means beyond collecting it.
sources:
  - url: "https://www.mass.gov/info-details/accessibility-conformance-report-review"
    title: "Accessibility Conformance Report Review, Mass.gov"
    accessed: "2026-09-16"
  - url: "https://www.mass.gov/doc/accessibility-conformance-report-review-checklist/download"
    title: "Accessibility Conformance Report Review Checklist (download)"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  The routing rule's worked example. This binds Massachusetts agencies and has no force
  here, so it is method rather than mandate despite being a government instrument. The
  highest-value item in this guide for the library and procurement interviews, because
  SF State's library stated plainly that it performs no substantive review of conformance
  reports, and this document is what substantive review would look like.
```

### 5.3 Harvard, How to Interpret a VPAT

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Harvard University Digital Accessibility Services, How to Interpret a VPAT"
  description_short: "A university guide to reading a conformance report, including the patterns that indicate a report was not taken seriously."
  description_full: >-
    Written for non-specialist buyers. Names the red flags directly: an empty Remarks
    column, a bare "Partially Supports" with no context, a document where nearly every row
    reads Supports or Not Applicable, missing version numbers, and an outdated report.
    Peer-institution provenance makes it usable as a template for campus guidance.
sources:
  - url: "https://accessibility.huit.harvard.edu/interpret-vpat"
    title: "How to Interpret a VPAT, Harvard Digital Accessibility Services"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
```

### 5.4 University of Michigan, Evaluate Compliance Documentation

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "University of Michigan, Evaluate Compliance Documentation"
  description_short: "Michigan's published criteria for whether a VPAT is current, relevant, and sufficient for the product being bought."
  description_full: >-
    Sets three tests a report must pass before it counts: created or updated within the
    past year, written against WCAG, and specific to the product and version under
    consideration. The version test is the one campuses most often skip, because vendors
    supply a report for a product line rather than the release being licensed.
sources:
  - url: "https://accessibility.umich.edu/how-to/procurement-vendors/evaluate-compliance"
    title: "Evaluate Compliance Documentation, accessibility.umich.edu"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
```

### 5.5 Impact tiering and the review committee model

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Impact-tiered ICT accessibility review"
  description_short: "The practice of sizing an accessibility review to a product's reach, so that high-impact purchases get independent testing and low-impact ones do not."
  description_full: >-
    High-impact products get an in-depth review, including testing that validates rather
    than accepts the vendor's claims. Medium-impact products are reviewed at a committee's
    discretion. Where barriers are found and the purchase proceeds, it proceeds on an
    Equally Effective Alternate Access Plan naming the barriers, the workaround, how
    barriers are communicated, the resources required, and who is responsible. The model
    appears in substantially the same form at several universities, which is what makes it
    a pattern rather than one campus's local arrangement.
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
confidence: medium
source_text: REQUIRED for at least two of the four, not yet fetched
notes: >-
  A synthesized node rather than one document, which is a judgment call the ETL should
  surface for approval. The alternative is four nodes, one per campus, which multiplies
  near-identical content. Directly relevant to 4.6-pro, where CSUEB's own campus-level
  EAP process is retired.
```

### 5.6 Library Accessibility Alliance

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Library Accessibility Alliance"
  description_short: "A library consortium that funds independent third-party accessibility evaluations of vendor e-resources and publishes the results with vendor responses."
  description_full: >-
    Formed from the Big Ten Academic Alliance e-resource accessibility group, which began
    in 2015, partnered with ASERL in 2019, and expanded in 2021 with the Greater Western
    Library Alliance and the Washington Research Library Consortium. Evaluations are
    performed by outside firms against WCAG 2.1 AA, supplied to vendors at no charge, and
    vendors may respond and attend a consultation. It is the working answer to the problem
    a single library cannot solve, which is that verifying a vendor's accessibility claim
    costs more expertise than any one library has.
sources:
  - url: "https://btaa.org/library/programs-and-services/reports"
    title: "Library Accessibility Alliance, Big Ten Academic Alliance"
    accessed: "2026-09-16"
  - url: "https://btaa.org/library/programs-and-services/reports/library-e-resource-accessibility--testing"
    title: "Library E-Resource Accessibility, Testing"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  The single most useful item for 7.11-ins. SF State's library said it has no independent
  capacity to verify a 40-page conformance report. This is the standing arrangement other
  consortia built for exactly that, and the published evaluations are usable evidence
  about named products. Ask in the CSUEB library interview whether the CSU participates.
```

### 5.7 Standardized e-resource accessibility license language

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Standardized accessibility license language for library e-resources"
  description_short: "Model contract clauses obliging a vendor to warrant accessibility conformance, developed by library consortia."
  description_full: >-
    The clause obliges the licensor to warrant that licensed materials conform to WCAG at
    level AA and comply with applicable federal and state disability law, bars the vendor
    from disclaiming that warranty elsewhere in the contract, seeks indemnification for
    breach, and requires a current completed VPAT. It moves accessibility from a document
    collected before purchase to a term enforceable after it, which is a different and
    stronger position than conformance reporting alone.
sources:
  - url: "https://btaa.org/library/reports/library-e-resource-accessibility---standardized-license-language"
    title: "Library E-Resource Accessibility, Standardized License Language, BTAA"
    accessed: "2026-09-16"
  - url: "https://trln.org/wp-content/uploads/2022/12/TRLN-Guide-to-Negotiating-Accessibility-in-E-Resource-Licenses_December-2022.pdf"
    title: "TRLN Guide to Negotiating Accessibility in E-Resource Licenses (2022)"
    accessed: "2026-09-16"
confidence: high
source_text: REQUIRED, not yet fetched
notes: >-
  The TRLN guide is a PDF, so /get-source-text will need the document path rather than the
  page. Relevant to 7.11-ins and to 1.9-pro, since consortial and systemwide database
  licensing is where this language would be applied.
```

### 5.8 VPATs in the e-resource procurement lifecycle (peer-reviewed)

```yaml
type: IntellectualSource
merge_key: name
properties:
  name: "Prioritizing Accessibility in the E-Resources Procurement Lifecycle"
  description_short: "Peer-reviewed treatment of VPATs as a working tool across acquisition and remediation in academic libraries."
  description_full: >-
    Published in Serials Review. Treats the conformance report as an instrument used
    throughout an acquisition lifecycle rather than a gate passed once at purchase, and
    connects acquisition decisions to the remediation work that follows them. It is the
    only scholarly item in this guide, which makes it the clearest example of what
    IntellectualSource was built for.
sources:
  - url: "https://www.tandfonline.com/doi/full/10.1080/0361526X.2020.1722020"
    title: "Prioritizing Accessibility in the E-Resources Procurement Lifecycle, Serials Review (2020)"
    accessed: "2026-09-16"
confidence: medium
source_text: LIKELY BLOCKED, publisher paywall
notes: >-
  Expect a 403 from Taylor and Francis. Per /get-source-text, a paywall is reported as a
  manual-paste finding and never summarized from the abstract. The node is still worth
  creating, because a citable scholarly grounding for a principle is exactly the case the
  node type exists for, and the description above is drawn from the title and publication
  rather than from claims about its contents.
```

## 6. Deliberately excluded

- **SF State's ATI procurement procedure and Sonoma's VPAT page.** Both surfaced in the
  search. Both are campus evidence, already the subject of Implementation nodes, and they
  belong on a YSE rather than in the Governance area. Putting a campus's own practice in
  with the external canon would let a campus cite itself as the standard it is measured
  against.
- **Vendor and consultancy marketing.** Level Access, accessiBe, TestPros, BarrierBreak,
  and similar pages ranked well and describe the VPAT accurately. They are commercial
  content promoting a service. Excluded on provenance, not on accuracy.
- **CSU Northridge and other CSU campus procurement pages.** Same reason as SF State and
  Sonoma, with the added problem that a sibling CSU campus's practice reads as systemwide
  when it is not.
- **Wikipedia.** Usable to confirm a date, not to ground a principle.

## 7. What the tab needs

The backend is done. `IntellectualSource` has the node class, full CRUD in
`app/database/queries/intellectual_sources/`, and a MethodView registered at
`/intellectual-sources`. The API service functions exist in `services/api/{get,post,put}.js`.

Missing, in the order it has to be built:

1. `components/graph_components/intellectual_sources/intellectualSourceTypes.js`, the
   structural field registry, matching `principleTypes.js`. Add `url` and `raw_text` once
   section 2 is decided.
2. `IntellectualSourceList.js`, `IntellectualSourceDetailPanel.js`, `IntellectualSourceForm.js`,
   following the principles trio.
3. `IntellectualSourceMasterContainer.js` in `ati_explorer_containers/`.
4. A third tab in `GovernanceArea.js`. The tab index is currently a binary, so
   `activeTab === 'principles' ? 1 : 0` and the matching `handleTabChange` both need to
   become a lookup over three route slugs.
5. The `/:campus/ati-explorer/intellectual-sources` route in `App.js`, rendering
   `GovernanceArea` with `activeTab="intellectual-sources"`.
6. `PrincipleGroundingTags.js` and `PrincipleSourceBadge.js` already handle
   IntellectualSource as a `derives_from` target. Verify rather than rebuild.

## 8. Open decisions for the ETL

1. **Does `IntellectualSource` get `url` and `raw_text`?** Section 2. Everything else
   waits on this, because without it these nodes are names without sources.
2. **Is Section508.gov procurement guidance a Directive or an IntellectualSource?**
   Section 4.4. It turns on whether we are willing to imply federal buying guidance
   instructs the CSU.
3. **Is impact tiering one synthesized node or four campus nodes?** Section 5.5.
4. **Does the VPAT node supersede or sit beside the two duplicate Section 508 statute
   nodes?** Neither, but the duplicate is on the graph work backlog and this ETL is a
   reasonable moment to settle it.
5. **Which of these ground which Principle?** No Principle currently derives from
   anything in this guide, and no IntellectualSource exists to derive from. The
   `derives_from` edges are a second pass, after the nodes exist and their Source Text is
   in hand. Writing the edges from these descriptions instead of from the sources would
   be reasoning from a summary, which the graph work backlog already names as the thing
   not to do.
