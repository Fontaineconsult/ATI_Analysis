// =============================================================================
// INGEST — Principle amendments arising from the Library BuyIT/CSUBUY pushback
// Date:   2026-08-05
// Target: meta-scaffold (Principle layer), not campus/year data
// =============================================================================
//
// SOURCE
//   Message "Re: BuyIT / CSU Buy reviews" (uid bf3b0defbe0941f8b866ff7c4f38a7de),
//   Dean Christy Stevens, attached to YSE 2025-2026-7.11-ins-sfsu. Her letter was
//   read against the 13 existing Principle nodes. Four items approved by the user
//   from that comparison. Structural findings (inert principles, ungrounded
//   principles, missing description_full, possible duplicate ATI grounding nodes)
//   were explicitly DEFERRED and are not touched here.
//
// WHAT THIS CHANGES
//   1. Rewrites principle:closest-to-capacity — adds the missing elevation half
//      of the heuristic, adds description_full, fixes the "closet" typo, and
//      grounds it additionally in ADA Title II.
//   2. Creates principle:bounded-duty-burden-limits with three derives_from
//      groundings (statute, general regulation, web rule).
//   3. Rewrites principle:vendor-leverage-procurement-as-accessibility-lever's
//      description_full to state the cost of the gate.
//   4. Strips the trailing space from Person "Michael McCourt ".
//
// CITATION CAUTION — READ BEFORE PUBLISHING ANY OF THIS EXTERNALLY
//   Prose here cites at the level of the statute and part (ADA Title II, 28 CFR
//   Part 35) and names 35.164 (general limits) and 35.204 (web-rule duties).
//   Project docs elsewhere cite 35.205 for the minimal-impact / elevation
//   reasoning (see the SFBRN Policy Briefing on the Distribution of Digital
//   Accessibility Responsibility, Fontaine, May 2026). Subsection numbers were
//   NOT re-verified against the regulation in this pass. Confirm against the
//   briefing before any of this text leaves the app.
//
// IDEMPOTENCE
//   Every statement is a MERGE or a MATCH-on-old-value SET. No description_full
//   is built by concatenation (that would duplicate text on re-run) — each is
//   written as a complete literal.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. principle:closest-to-capacity — restore the elevation half
// -----------------------------------------------------------------------------
// Was: "Responsibility to remediate sits closet to the entity that maintains an
// interface or asset." — half the heuristic, and it reads AGAINST the Library:
// "you hold it, you fix it." The elevation clause is what the Asset model's
// elevation_signal actually computes.

MATCH (p:Principle {handle: "principle:closest-to-capacity"})
SET p.description_short = "Responsibility to remediate sits closest to the party with the capacity to remediate. Where that party has no such capacity, responsibility rises to the institution.",
    p.description_full = "The heuristic has two steps, and only the first is intuitive. First, responsibility to remediate an interface or asset sits with the party closest to the capacity to fix it, normally the unit that builds, hosts, or maintains it. Second, and decisively, where the closest party cannot remediate, responsibility does not stop there. It rises to the institution. A unit that selects, subscribes to, and reports problems with a vendor-hosted product it cannot modify holds stewardship without remediation capacity, and the duty passes upward rather than resting on a party unable to discharge it. Capacity is therefore decoupled from liability. The institution remains the liable party throughout, and the heuristic allocates work, not blame. This is the conceptual basis for modeling Section 508 stewardship (procure, develop, maintain, use) separately from remediation accountability, and for treating a stewarded asset with no remediating implementation as an elevation signal to be surfaced rather than a data gap to be filled.";

// Ground it in Title II as well as Section 508. The elevation half is a Title II
// program-access proposition (the duty runs to the public entity as a whole),
// not a Section 508 procurement proposition.
MATCH (p:Principle {handle: "principle:closest-to-capacity"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);


// -----------------------------------------------------------------------------
// 2. NEW principle:bounded-duty-burden-limits
// -----------------------------------------------------------------------------
// Nothing in the 13 existing principles carried the fundamental-alteration /
// undue-burden limit. Recon confirmed those terms appear on exactly one node in
// the whole graph (Directive "Executive Order 1111") and on no Principle. Its
// absence makes principle:time-bound-alternative-when-not-conformant read as
// absolute, which is precisely what the Library's scale objection pushes on.

MERGE (p:Principle {handle: "principle:bounded-duty-burden-limits"})
ON CREATE SET p.unique_id = randomUUID(),
              p.name = "The duty is bounded by fundamental alteration and undue burden",
              p.description_short = "The obligation to remediate or to provide an equally effective alternative is bounded. It does not require a fundamental alteration of the program or undue financial and administrative burdens, though a residual duty to take other action remains.",
              p.description_full = "ADA Title II and its implementing regulation limit what compliance can demand. Where making a program accessible would result in a fundamental alteration of its nature or in undue financial and administrative burdens, the public entity is not required to take that particular action. The duty is bounded, not extinguished. The entity must still take any other action that would not result in such alteration or burden, and must ensure that people with disabilities receive the benefits and services it provides to the fullest extent possible. The limit is invoked by a documented determination made by the head of the entity or a designee, supported by a written statement of reasons, not by an operating unit's assertion that the work is hard. This principle matters because without it the alternative-access principle reads as absolute, implying that every non-conformant resource must be paired with an equally effective substitute however large the resource is. For resources at scale, such as a licensed database of millions of articles or media objects, no equivalent substitute can be recreated by the subscribing unit, and the honest institutional answer is a documented bounded-duty determination with residual mitigation, not an unmeetable demand and not a silent exception. It is the counterweight that keeps time-bound alternative access from becoming a requirement nobody can satisfy, and it is the instrument through which a scale objection is answered on the record rather than by stalling the purchase.";

// Grounding: the statute, the general regulation (where the fundamental
// alteration / undue burden limit lives at 35.164), and the 2024 web rule
// (whose duties provision at 35.204 carries the limit forward for web content).
MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"}), (d:Directive {title: "ADA Title II Regulation (28 CFR Part 35), 2010 Revision"})
MERGE (p)-[:derives_from]->(d);

MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"}), (d:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// 3. principle:vendor-leverage-procurement-as-accessibility-lever — state the cost
// -----------------------------------------------------------------------------
// Original text read as an unqualified good and had no account of what the gate
// costs when it blocks without producing findings. Paragraph one is the original
// wording, preserved verbatim. Paragraph two is the amendment.

MATCH (p:Principle {handle: "principle:vendor-leverage-procurement-as-accessibility-lever"})
SET p.description_full = "The memo commits to driving improvements in product accessibility by leveraging the procurement process and by partnering with vendors and publishers. The underlying commitment is that accessibility can and should be advanced upstream, at the point of acquisition, rather than only remediated after a product is in use, and that the institution's purchasing power is a legitimate instrument for improving the accessibility of the market it buys from. This principle is the basis for treating procurement as a distinct priority area, for the vendor and supplier relationships in the model, and for the upstream gatekeeping function that reviews ICT before it enters the environment. The lever has a cost, and the principle is only accurate when that cost is stated. Gatekeeping can consume the thing it protects. A review that blocks acquisition without producing product-specific findings, a stated threshold, or a path to approval stops functioning as a lever and becomes a blockade, and the resulting loss of access is itself an access harm, weighable on the same impact ledger as the barriers the review exists to prevent. Leverage is also unevenly distributed. It is strongest for competitive, substitutable products and weakest for sole-source or systemwide-licensed platforms already embedded across the market, where declining to buy forfeits the resource without moving the vendor. The principle therefore commits not to gatekeeping as such, but to upstream influence exercised through findings, thresholds, and timelines that the reviewed unit can actually act on.";


// Rename so the recognizable term leads. The original name buried "undue burden"
// at the end of the string, which made the principle unfindable by scanning.
// `handle` is the identity field and is deliberately unchanged.
MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"})
SET p.name = "Undue burden and fundamental alteration bound the duty";


// -----------------------------------------------------------------------------
// 4. Person "Michael McCourt " — strip the trailing space
// -----------------------------------------------------------------------------
// 16 characters where 15 were intended. Silently breaks any future
// MERGE (p:Person {name: "Michael McCourt"}). No collision: no node holds the
// trimmed form. Idempotent — a re-run matches nothing.

MATCH (p:Person {name: "Michael McCourt "})
SET p.name = "Michael McCourt";


// -----------------------------------------------------------------------------
// DEFERRED, NOT FORGOTTEN
// -----------------------------------------------------------------------------
// - 12 of 13 principles are inert (one shapes edge in the whole meta-graph:
//   equally-effective-access -> TAAP). The two principles touched here are also
//   inert and were NOT wired to descriptors in this pass.
// - Ungrounded: conformance-to-an-external-technical-standard,
//   program-accessibility-as-proactive-duty, universal-design-over-accommodation.
// - Missing description_full: institution-wide-responsibility,
//   equally-effective-access, universal-design-over-accommodation.
// - Possible duplicate grounding: Directive "Accessible Technology Initiative"
//   and Memo "Accessible Technology Initiative (ATI)" ground 6 principles each.
// - Not created: the determinations principle (specific, evidenced, consistently
//   applied findings) — item 3 of the four proposed, not selected.
// - Michael McCourt still holds no role. role:procurement-team is the candidate.
// =============================================================================
