# Graph work backlog

Picked up from the 2026-08-05 Library / TAAP session. Ordered by what unblocks what.

---

## 1. Populate `(Governance)-[:informs]->(Goal)` — IN PROGRESS, BLOCKED

**Proposal:** `app/database/ontology/governance-informs-goals-proposal.md`
~85 edges, 24 of 26 goals, ~30 of 69 eligible instruments. Reviewed by nobody yet.

**Why it is first.** `informs` has **zero** edges today. Every other link in the walk is
populated — `Goal -[:supported_by]-> SuccessIndicator` has 155 edges, and the YSE and
implementation hops work. This single missing hop is why "what authority backs this
implementation?" is currently a manual reading exercise. Reconstructing that answer by hand
consumed most of the 2026-08-05 session.

**Blocked on four decisions.** Duplicated nodes must be resolved first or half the edges
land on an arbitrary twin.

| # | Decision | State |
|---|---|---|
| 1 | Section 508 exists twice as `Law`. `Section 508 of the Rehabilitation Act of 1973` (`2d9ef551`) has an inbound `derives_from` from `principle:closest-to-capacity`; `Rehabilitation Act of 1973, Section 508` (`df2cce7f`) has none. Recommend keeping the former. | Confirmed duplicate |
| 2 | Goals `ins-1` (`0ef34370`) and `ins-4` (`233ad436`) have identical text, 4 SIs each. Distinct goals with a copy-paste error, or a true duplicate? The attached SIs will show which. | Confirmed collision |
| 3 | The ATI instrument exists as both `Directive: Accessible Technology Initiative` (`ae8c836e`) and `Memo: Accessible Technology Initiative (ATI)` (`4dfefd81`). Each grounds 6 principles. If they are one instrument the principle groundings consolidate too. | Probable duplicate |
| 4 | `Executive Order 1111` (`e6f402d1`) and `CSU Executive Order 1111: Board of Trustees Policy…` (`ae342354`) are both Directives. (The `ExternalPolicy` BOT Policy is correctly separate — it is the policy the order enacts.) | Probable duplicate |

**Also awaiting a call, recorded in the proposal:**
- `pro-8` has placeholder goal text ("Experience/Implementation") and cannot be mapped
  responsibly. Fix the goal text rather than guessing.
- `Authors Guild v. HathiTrust` establishes fair use for producing accessible formats from
  library collections. No current goal covers the legality of format conversion.
- The two CSU OCR resolutions (Long Beach, Los Angeles) are the closest in-system precedent
  to the Library work — the LA matter concerned access to library resources specifically.
  Held back pending a decision on whether 1990s voluntary resolutions carry `informs` weight.
- `Cal. Gov. Code §11135` and `ARTICLE 9.5 Discrimination [11135-11139]` are the same statute
  entered twice under different titles.

**Next action:** mark up the proposal file, then generate Cypher from the marked-up version.

---

## 2. `Determination` node

The Phase 2 stub referenced at `graph_schema.py:95` (`Determinations' concerned_by will join
here too`). Blocked three separate things in one session:

- A stakeholder asked which specific accessibility findings led each pending request to be
  designated inaccessible. The graph has nowhere to hold the answer.
- The per-acquisition register that would replace individual TAAPs has no home.
- "Why was this called inaccessible" is unanswerable after the fact.

Shape needed: subject resource, flagged WCAG criteria, severity classification, evidence
source (conformance report vs demonstration vs testing), who determined it, date, outcome.

---

## 3. Wire `shapes` edges

**14 of 16 principles are inert** — only `equally-effective-access → TAAP` exists. The
meta-scaffold is built and points nowhere, so "which principles bear on Asset stewardship /
alternative access / this indicator?" is recall rather than traversal.

The 2026-08-05 purity pass was the precondition: with instruments cited in principle prose
rather than on `derives_from` edges, traversal returned nothing useful anyway. That is now
fixed (15 of 16 grounded; only `universal-design-over-accommodation` remains ungrounded and
without a `description_full`, and it may want an `IntellectualSource` rather than a Law).

---

## 4. Extend `raw_text` coverage

Done: `Document`, `Webpage`, and all six governance types.

Not done:
- **`InternalPolicy`** (24 nodes) — despite the name it is an implementation node, managed by
  the implementation UI, so it was outside the governance registry change.
- **Implementation nodes** (`Process` / `Procedure` / `Service` / `Guidance`). The SFBRN
  CSUBuy procedure's full text reached us only because someone attached it as a `Document`.
  That worked by luck of attachment, not by structure.

**Standing rule this established:** for any instrument bearing on a decision, read `raw_text`
or do not assert. Reasoning from a `description` summary produced a materially wrong reading
of the CSUBuy procedure in this session, corrected only once the full text was pasted in.

---

## 5. Aggregate Asset for the licensed-database long tail

Decided, unbuilt. One `Asset` covering the 200+ licensed research databases, campus scope,
`third_party_service`, procured and used by `J. Paul Leonard Library`, no develop/maintain.

Justified by the Asset model's own rule — "where authority splits, the asset splits." Across
all of them remediation authority is identical (none), so the authority does not split and
neither should the asset. Needed because `TAAP.covers_asset` takes exactly one asset, so a
blanket alternative-access plan needs a single coherent thing to cover.

Named platforms already modeled individually on 2026-08-05: `alma-primo-systemwide`,
`scholarworks-systemwide`, `csu-digital-archives-systemwide`, `quartex-sfsu`,
`springshare-sfsu`. The aggregate covers the tail.

---

## 6. Cheap registry queries

Each would have saved round trips in this session. `app/database/cypher_runner/query_registry.yaml`.

- **SI coverage gaps** — SIs with no YSE at a campus/year. Would have caught `1.21-web`,
  `1.7-gov`, and `2.4-com` missing at SFSU *before* they were written into an argument.
- **Keyword search over SI text** — the most common lookup in this kind of work and there is
  no curated query for it. Note the property is `success_indicator`, not `indicator`.
- **Governance missing `raw_text`** — which instruments are still only summarized.
- **Inert / ungrounded principles** — run ad hoc twice on 2026-08-05.
- **Data hygiene** — whitespace-padded names (`"Michael McCourt "` was found by accident),
  duplicate titles across governance labels, duplicate goal text.

---

## Not a graph task, but pending

`Guideline: TAAP Authoring Template` (`f27b3d02`) should be relabeled to `ExternalPolicy`.
Governance types are node labels, so there is no UI path:

```cypher
MATCH (n:Guideline {unique_id: "f27b3d0274b14aa19ff7492b68b073bb"})
REMOVE n:Guideline SET n:ExternalPolicy;
```

`Access Board E202.7.2 Alternative Means` is named in that template's own legal-framework
list and does not exist in the graph. It is the §508 provision authorizing alternative means
when conformance is not achievable — arguably the most on-point missing grounding for the
whole alternative-access pathway.
