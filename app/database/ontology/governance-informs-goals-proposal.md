# Proposed `(Governance)-[:informs]->(Goal)` mapping

**Status:** proposal for review. Nothing written to the graph.
**Date:** 2026-08-05
**Scope:** 69 eligible instruments (Law, Case, Directive, Memo, Guideline, ExternalPolicy) → 26 Goals.
`InternalPolicy` is excluded: it has no `informed_goals` relationship — it is an implementation node.

---

## Why this matters

`informs` currently has **zero edges**. All 26 goals are unattached. The rest of the
walk is populated (`Goal -[:supported_by]-> SuccessIndicator` = 155 edges), so this one
hop is the only break in the path from an implementation to the authority behind it.

---

## Mapping rule used

An instrument informs a goal when the instrument **creates or specifies the obligation
the goal exists to satisfy**. Two consequences:

1. **No spraying.** ADA Title II underwrites everything, so attaching it to all 26 goals
   would carry no information. It is attached only where it is the operative authority
   rather than the background condition.
2. **Silence is a finding.** An instrument that informs no goal is not a gap. Roughly a
   third of the corpus is context, precedent from other sectors, or comparative material.
   Those are listed explicitly at the end so the absence is a decision on record.

Target density: 2–5 instruments per goal.

---

## BLOCKERS — resolve before writing edges

Wiring `informs` on top of duplicated nodes wires half the edges to an arbitrary twin.

### Confirmed

**1. Section 508 exists twice as a `Law`.**
- `Section 508 of the Rehabilitation Act of 1973` — `2d9ef551…` — **has an inbound
  `derives_from` from `principle:closest-to-capacity`**
- `Rehabilitation Act of 1973, Section 508` — `df2cce7f…` — no inbound edges

Recommend keeping `2d9ef551` (already load-bearing) and retiring the other.

**2. Goals `ins-1` and `ins-4` have identical text.**
- `0ef34370…` goal_number 1
- `233ad436…` goal_number 4
Both carry 4 SIs. Either they are genuinely distinct goals with a copy-paste error in the
text, or one is a duplicate. This needs a human call — the SIs attached to each will show
which.

### Probable — needs your call

**3. The ATI instrument appears as both a Directive and a Memo.**
- `Directive: Accessible Technology Initiative` — `ae8c836e…` — 6 principles derive from it
- `Memo: Accessible Technology Initiative (ATI)` — `4dfefd81…` — 6 principles derive from it

Both are load-bearing on the Principle layer. If they are one instrument, the principle
groundings need consolidating too.

**4. Executive Order 1111 appears twice as a Directive.**
- `Executive Order 1111` — `e6f402d1…`
- `CSU Executive Order 1111: Board of Trustees Policy on Disability Support and Accommodations` — `ae342354…`

Related but distinct: `ExternalPolicy: CSU Board of Trustees Policy on Disability Support
and Accommodations` is the policy the EO enacts, so that one is correctly separate.

The mapping below uses the **longer, more specific title** in each pair.

---

## GOV — governance and oversight

### gov-1 · Establish Clear Roles and Responsibilities for Accessibility Oversight (7 SIs)
- `CSU Coded Memorandum AA-2010-13` — explicitly "added guidance on ATI governance and roles"
- `CSU Executive Order 1111` — Board of Trustees policy assigning institutional responsibility
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy` — establishes the program structure
- `Americans with Disabilities Act Title II` — the duty that oversight exists to discharge

### gov-2 · Formalize Accessibility-Related Policies and Procedures (4 SIs)
- `CSU Coded Memorandum AA-2013-03` — updated and consolidated ATI policy, superseding prior memos
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`
- `CSU Board of Trustees Policy on Disability Support and Accommodations`

### gov-3 · Embed Accessibility into Institutional Planning Cycles (1 SI)
- `CSU Coded Memorandum AA-2015-22` — directs campuses to develop and update ATI plans; this is
  the planning-cycle mandate almost verbatim
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

---

## COM — culture and communication

### com-1 · Promote a Campus-Wide Culture of Accessibility (4 SIs)
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`
- `CSU Coded Memorandum AA-2013-03`

### com-2 · Ongoing Role-Specific Accessibility Training (5 SIs)
- `CSU Coded Memorandum AA-2007-04` — set tasks and deliverables across all three priority areas
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

---

## INS — instructional materials

### ins-1 and ins-4 · Timely adoption of instructional materials, incl. late-hire/adjunct (4 SIs each)
*(pending the duplicate-goal decision above — same mapping either way)*
- `California Education Code Section 67302` — requires publishers to supply electronic versions
  for conversion; this is the statutory basis for timely adoption
- `CSU Coded Memorandum AA-2013-03`

### ins-2 · Identification of IM for Late-Hire Faculty (1 SI)
- `California Education Code Section 67302`
- `CSU Coded Memorandum AA-2013-03`

### ins-5 · Multimedia, interactive content, emerging instructional technologies (7 SIs)
- `21st Century Communications and Video Accessibility Act of 2010` — captioning of
  internet-delivered video
- `National Association of the Deaf v. Harvard University` — captioning of online course content
- `National Association of the Deaf v. Massachusetts Institute of Technology` — parallel holding
- `United States v. Regents of the University of California (Berkeley)` — consent decree on
  free online content and captions
- `Web Content Accessibility Guidelines (WCAG) 2.1`

### ins-6 · Course review and remediation process (7 SIs)
- `Payan v. Los Angeles Community College District` — inaccessible course materials and
  instructional technology; the closest CSU-adjacent precedent
- `United States v. Miami University` — consent decree covering classroom and instructional technology
- `CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)`

### ins-7 · Support faculty in creating and adopting accessible IM (5 SIs)
- `CSU Memorandum: Recommended Campus Actions to Improve Accessibility of Online Education (2013)`
- `Joint Dear Colleague Letter on Electronic Book Readers (2010)` — requiring inaccessible
  reading technology may violate Title II / §504
- `OCR Frequently Asked Questions on the June 29, 2010 Dear Colleague Letter` — the applied guidance
- `CSU Coded Memorandum AA-2013-03`

### ins-8 · Broad-based ATI awareness campaign and training infrastructure (6 SIs)
- `CSU Coded Memorandum AA-2007-04`
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

### ins-9 · Annually review and update the ATI Instructional Materials Accessibility Plan (3 SIs)
- `CSU Coded Memorandum AA-2015-22` — the plan-update mandate
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

---

## PRO — procurement

### pro-1 · Procurement processes follow §508 for all acquired ICT (11 SIs)
- `California Government Code Section 7405` — binds state entities when they develop, procure,
  maintain, or use ICT, and obliges contractors to resolve; the operative California mandate
- `Section 508 of the Rehabilitation Act of 1973`
- `Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)` — the technical
  requirements procurement is testing against
- `EN 301 549 (V3.2.1, 2021)` — contains the procurement test procedures and evaluation methodology
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

### pro-2 · ATI procurement team staffed with defined roles (1 SI)
- `CSU Coded Memorandum AA-2010-13` — ATI governance and roles
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

### pro-4 · Alternate access plans created for ICT not fully §508 compliant (5 SIs)
*The goal behind the entire Library / TAAP workstream.*
- `ADA Title II Regulation (28 CFR Part 35), 2010 Revision` — the fundamental-alteration and
  undue-burden limits that bound the duty
- `DOJ Title II Web and Mobile Accessibility Final Rule (2024)` — the minimal-impact provision
  the alternate-access instrument relies on
- `Revised Section 508 Standards and Section 255 Guidelines (ICT Refresh)` — carries the
  Alternative Means provision (E202.7.2)
- `Americans with Disabilities Act Title II`

### pro-5 · Training and outreach for ICT procurement stakeholders (8 SIs)
- `CSU Coded Memorandum AA-2007-04`
- `California Government Code Section 7405`

### pro-6 · All purchasers knowledgeable about §508 in E&IT procurement (2 SIs)
- `California Government Code Section 7405`
- `Section 508 of the Rehabilitation Act of 1973`

### pro-8 · "Experience/Implementation" (6 SIs)
**LOW CONFIDENCE — the goal text is a placeholder.** Cannot be mapped responsibly until the
goal is written. Provisionally `CSU Systemwide ATI Policy`, but recommend leaving unattached
and fixing the goal text instead.

### pro-9 · Annually review and update the ATI Procurement Plan (2 SIs)
- `CSU Coded Memorandum AA-2015-22`
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

---

## WEB — web and digital content

### web-1 · Identify and repair or replace inaccessible websites, applications, digital content (20 SIs)
- `DOJ Title II Web and Mobile Accessibility Final Rule (2024)` — the operative rule
- `Web Content Accessibility Guidelines (WCAG) 2.1` — the incorporated standard
- `WCAG Evaluation Methodology (WCAG-EM) 2.0` — the method for the "identify" half of the goal
- `California Government Code Section 11546.7` — biennial certification, which forces identification
- `South Carolina Technical College System (OCR Compliance Review)` — compliance review of campus
  websites including library resources
- `National Federation of the Blind v. Pennsylvania State University` — resolution agreement on
  inaccessible campus EIT

### web-2 · New website/application/content development complies with §508 (10 SIs)
- `DOJ Title II Web and Mobile Accessibility Final Rule (2024)`
- `Web Content Accessibility Guidelines (WCAG) 2.1`
- `Revised Section 508 Standards (36 CFR Part 1194) (2017)`
- `Authoring Tool Accessibility Guidelines (ATAG) 2.0` — governs the tools content is built with

### web-3 · Updating and maintenance comply with §508 (9 SIs)
- `DOJ Title II Web and Mobile Accessibility Final Rule (2024)`
- `Web Content Accessibility Guidelines (WCAG) 2.1`
- `California Government Code Section 11546.7`
- `California Assembly Bill 434 (2017)` — created the biennial certification requirement

### web-5 · Professional development training incorporating §508 into development (11 SIs)
- `Revised Section 508 Standards (36 CFR Part 1194) (2017)`
- `Web Content Accessibility Guidelines (WCAG) 2.1`
- `CSU Coded Memorandum AA-2007-04`

### web-6 · Campus community aware of §508 for web-based information (7 SIs)
- `Section 508 of the Rehabilitation Act of 1973`
- `California Government Code Section 7405`
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

### web-7 · Annually review and update the ATI Web Accessibility Plan (5 SIs)
- `CSU Coded Memorandum AA-2015-22`
- `CSU Systemwide Accessible Technology Initiative (ATI) Policy`

---

## Deliberately NOT attached to any goal

These are context, precedent from other sectors, or comparative material. Recording the
reason so the absence reads as a decision rather than an omission.

**Title III / private-sector precedent** — binds public accommodations, not a public entity.
Useful for risk framing, not a source of CSU obligation.
`ADA Title III Regulation (28 CFR Part 36)` · `Gil v. Winn-Dixie` · `Robles v. Domino's Pizza` ·
`National Federation of the Blind v. Target Corp.` · `National Association of the Deaf v. Netflix`

**Federal employment law** — governs federal agencies and contractors, not CSU program access.
`Rehabilitation Act §501` · `Rehabilitation Act §503` · `Executive Order 13548`

**Out of sector** — `Individuals with Disabilities Education Act` (K-12) ·
`Assistive Technology Act of 1998` (state AT grant programs) ·
`Telecommunications Act §255` (equipment manufacturers)

**Definitional or background** — `ADA Amendments Act of 2008` (defines disability) ·
`Americans with Disabilities Act of 1990` (Title II is the operative part and is separate) ·
`Unruh Civil Rights Act` (business establishments) ·
`California Government Code Section 11135` and `ARTICLE 9.5 Discrimination [11135-11139]`
(these two overlap; both route to Title II protections — consider consolidating)

**Comparative campus/system policy** — held for reference, not binding here.
`University of California IT Accessibility Policy (IMT-1300)` ·
`San José State University Access to EIT Policy (Presidential Directive 2007-02)`

**Superseded** — `CSU Executive Order 926` (superseded by EO 1111)

**Format-specific technical standards** — real but narrower than any current goal. Candidates
for attachment if a format-specific goal is ever authored, or for `shapes` edges to
component-kind descriptors instead.
`EPUB Accessibility 1.0` · `EPUB Accessibility 1.1` · `PDF/UA (ISO 14289-1)` ·
`WAI-ARIA 1.2` · `UAAG 2.0` · `WCAG 2.0` · `WCAG 2.2`

**Unresolved** — `Authors Guild v. HathiTrust` establishes fair use for producing accessible
formats from library collections. That is directly relevant to alternate-media production but
no current goal covers the legality of format conversion. Flagging rather than forcing.

**CSU OCR precedent, currently unattached** — `California State University, Long Beach
(OCR 09-99-2041)` and `California State University, Los Angeles (OCR 09-97-2002)`. The Los
Angeles matter specifically concerned access to **library resources**. These are the closest
in-system precedent to the current Library work and arguably belong on `ins-6` or a library
goal. Held back because both are 1990s voluntary resolutions and I would rather you decide
whether historical OCR resolutions should carry `informs` weight.

---

## Counts

- Goals receiving edges: **24 of 26** (`pro-8` blocked on placeholder text; `ins-1`/`ins-4`
  pending the duplicate decision)
- Instruments used: **~30 of 69**
- Proposed edges: **~85**
- Most-reused instruments: `CSU Systemwide ATI Policy` (11 goals), `CSU Coded Memorandum
  AA-2015-22` (4 goals, all plan-review), `WCAG 2.1` (4), `Cal. Gov. Code §7405` (4)

The concentration on the ATI Policy is expected and correct — it is the instrument that
creates the program the goals decompose.
