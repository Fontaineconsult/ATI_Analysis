// =============================================================================
// INGEST — Principle layer: purity pass + alternative-access commitments
// Date:   2026-08-05
// Target: meta-scaffold (Principle), not campus/year data
// =============================================================================
//
// TWO CHANGES, ONE PASS
//
// 1. PURITY. A Principle is a rule of understanding. Its prose must state the
//    commitment itself, never cite the instrument the commitment came from —
//    that is what `derives_from` is for. Eight principles violated this, opening
//    with "The memo commits to...", "The CSU commits to...", "The Title II web
//    rule fixes...". One hardcoded a compliance DATE, which is how a principle
//    goes stale: instruments move, rules of understanding do not.
//
//    Where stripping a citation would have lost real information (a named
//    standard, a named statute), the information is MOVED ONTO a `derives_from`
//    edge rather than deleted. Two principles that were entirely ungrounded are
//    grounded here for exactly that reason — otherwise purity would destroy
//    what the prose was carrying.
//
// 2. NEW COMMITMENTS about alternative access, drawn from the systemwide
//    alternative-access-planning framework now held in the governance layer.
//    Stated as rules, with the source instrument on the edge.
//
// WHAT THE FRAMEWORK CONTRIBUTED (as rules, not citations)
//   - Formal alternative-access planning is reserved for barriers that block
//     essential functions. Minor conformance failures do not trigger it.
//   - Equal effectiveness is a CONJUNCTIVE test of six independent conditions,
//     not a gradient. Independence (access without having to ask for help) is
//     one of them, which makes request-gated alternatives categorically lesser.
//   - A time-bound exception's validity is CONDITIONAL on demonstrable
//     remediation progress by the party with capacity. Absent progress it
//     lapses, and the residual risk must be accepted explicitly at the level of
//     authority that bears it.
//   - A remedy nobody affected knows about is not a remedy.
//   - Local adaptation of a shared framework is bounded by an invariant core.
//
// NOT DONE (previously declined, re-raised in the report)
//   - A principle requiring determinations to be specific, evidenced, and
//     consistently applied. The framework independently justifies it now.
//
// IDEMPOTENCE: every statement is a MERGE or a SET written as a complete
// literal. No description is built by concatenation.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. PURITY PASS — strip instrument citations from principle prose
// -----------------------------------------------------------------------------

MATCH (p:Principle {handle: "principle:continuous-sustained-remediation"})
SET p.description_full = "Accessibility barriers accumulate over years, and their removal often takes years to complete. The commitment is about the temporal nature of accessibility rather than any particular schedule: it is a sustained process that is never finished, so the institution's obligation is to achieve incremental barrier removal each year rather than to arrive at a single point of compliance. This is the basis for the annual evidence cycle, for tracking progress across academic years, and for treating the trajectory of an effort as meaningful independent of its absolute status.";

MATCH (p:Principle {handle: "principle:capability-maturity-over-binary-compliance"})
SET p.description_full = "Accessibility is evaluated through graded levels of organizational capability rather than as a binary judgment of compliance. This is a substantive claim about what accessibility is: an institutionalized, continuously improving organizational capability, not a static endpoint that is either reached or not. It reflects a capability-maturity strategy aimed at reliably and sustainably delivering accessible services. This is the conceptual basis for representing status as graded maturity levels rather than a pass or fail flag, and for treating movement between levels as the unit of progress.";

MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
SET p.description_full = "Digital accessibility is measured against a fixed, externally maintained technical standard incorporated by reference, not against an internal or negotiable judgment of accessible enough. The significance is that conformance is assessment against a published, versioned, third-party criterion set the institution does not control and cannot quietly relax. A specific version is the binding floor. Later versions may be adopted but do not lower that floor. This grounds the treatment of the external standard as the authority that individuates components and defines what conformance means, the separation between a fixed standard layer and the institution's own assessment of where it stands against it, and the need to track which version governs as the standard evolves. The governing standard and version are carried on this principle's grounding edges, not in this text, so that a change of version does not require a change of principle.";

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"})
SET p.description_full = "The institution must make its programs, services, and activities, viewed in their entirety, readily accessible to and usable by people with disabilities. The defining feature of this duty is that it is proactive and systemic: accessibility must be built into the institution's digital presence ahead of need and for the general population of users, not produced reactively in response to a particular person's request. Two consequences follow. Program accessibility is a standing obligation on the interfaces and assets the institution offers, distinct from and never satisfied by individual accommodation. And because the duty attaches to the program viewed in its entirety, the program is the natural unit at which it is assessed and answered, rather than any single artifact considered alone. Compliance dates and the instruments that set them belong on the governance nodes this principle derives from, never in this text.";

MATCH (p:Principle {handle: "principle:local-adaptation-flexibility"})
SET p.description_full = "Implementation is locally adapted rather than uniformly imposed. Shared goals and success indicators are fixed, but the means of achieving them are adapted to local conditions, with those who carry out the work helping shape how it is done. Adaptation is bounded rather than open: a shared framework may be reshaped to fit local circumstance only so long as its core elements are retained, so that what varies is method and not substance. The boundary matters in both directions. A standard or threshold against which work is judged is substance and does not vary locally. The procedure for meeting and evidencing it is method and does. This is the basis for keeping the schema substrate-independent and multiply realizable, with shared structure in the model and local particulars in the data.";

MATCH (p:Principle {handle: "principle:prioritization-by-impact"})
SET p.description_full = "Accessibility work is triaged toward the barriers with the greatest impact rather than pursued uniformly, in explicit recognition that staffing, time, and tools are finite in any given period. The underlying commitment is a value choice about allocation, made through an impact, probability, and capacity framework. Two corollaries follow. Effort spent uniformly is effort withheld from where it would matter most. And the access cost of a control is weighable on the same ledger as the barriers that control exists to prevent, since a measure that withholds a resource from everyone imposes its own loss of access. This is the basis for priority levels on tracked work and connects to the minimal-impact reasoning that governs whether non-conforming technology may remain in use while remediation proceeds.";

MATCH (p:Principle {handle: "principle:vendor-leverage-procurement-as-accessibility-lever"})
SET p.description_full = "Accessibility can and should be advanced upstream, at the point of acquisition, rather than only remediated after a product is in use. The institution's purchasing power is a legitimate instrument for improving the accessibility of the market it buys from, exercised through the procurement process and through partnership with vendors and publishers. The lever has a cost, and the principle is only accurate when that cost is stated. Gatekeeping can consume the thing it protects. A review that blocks acquisition without producing product-specific findings, a stated threshold, or a path to approval stops functioning as a lever and becomes a blockade, and the resulting loss of access is itself an access harm. Leverage is also unevenly distributed. It is strongest for competitive, substitutable products and weakest for sole-source or centrally licensed platforms already embedded across the market, where declining to buy forfeits the resource without moving the vendor. The commitment is therefore not to gatekeeping as such, but to upstream influence exercised through findings, thresholds, and timelines the reviewed unit can act on.";

MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"})
SET p.description_full = "The obligation to remediate or to provide an alternative is bounded. Where making a program accessible would fundamentally alter its nature or impose undue financial and administrative burdens, the institution is not required to take that particular action. The duty is bounded, not extinguished. It must still take any other action that would not produce such alteration or burden, and must ensure that people with disabilities receive the benefits and services it provides to the fullest extent possible. The limit is invoked by a documented determination made at the level of authority accountable for the program, supported by a written statement of reasons, never by an operating unit's assertion that the work is hard. This principle matters because without it the alternative-access commitment reads as absolute, implying that every non-conformant resource must be paired with an equally effective substitute however large the resource is. At sufficient scale no equivalent substitute can be constructed by the unit that subscribes to a resource, and the honest institutional answer is a documented bounded-duty determination with residual mitigation, not an unmeetable demand and not a silent exception.";

MATCH (p:Principle {handle: "principle:closest-to-capacity"})
SET p.description_full = "The heuristic has two steps, and only the first is intuitive. First, responsibility to remediate an interface or asset sits with the party closest to the capacity to fix it, normally the unit that builds, hosts, or maintains it. Second, and decisively, where the closest party cannot remediate, responsibility does not stop there. It rises to the institution. A unit that selects, subscribes to, and reports problems with a product it cannot modify holds stewardship without remediation capacity, and the duty passes upward rather than resting on a party unable to discharge it. Capacity is therefore decoupled from liability. The institution remains the liable party throughout, and the heuristic allocates work, not blame. A separate allocation runs alongside it: while capacity determines who remediates, the choice to deploy a non-conformant technology determines who bears the cost of accommodating the people it excludes. This is the conceptual basis for modeling stewardship (procure, develop, maintain, use) separately from remediation accountability, and for treating a stewarded asset with no remediating work as an elevation signal to be surfaced rather than a data gap to be filled.";


// -----------------------------------------------------------------------------
// 2. GROUNDING — move the stripped specifics onto derives_from edges
// -----------------------------------------------------------------------------
// Both principles below were entirely ungrounded, so their prose was the ONLY
// place the governing instrument was named. Purity without these edges would
// destroy information rather than relocate it.

MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"}), (g:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.1"})
MERGE (p)-[:derives_from]->(g);

MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"}), (d:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (p)-[:derives_from]->(d);

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"}), (d:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// 3. equally-effective-access — the conjunctive test (was missing a full text)
// -----------------------------------------------------------------------------

MATCH (p:Principle {handle: "principle:equally-effective-access"})
SET p.description_full = "Accessible technology must afford the same result, benefit, or opportunity, not merely some alternative. Equal effectiveness is a conjunctive test of independent conditions rather than a gradient: an alternative qualifies only if it delivers the same information, engagement, and services, offers the same availability, can be used independently without additional assistance, imposes no disparate burden on the person using it, has substantially equivalent ease of use, and protects their privacy. Failing any one condition does not make an alternative mostly equally effective. It moves it into a lesser category carrying different and heavier obligations, which is why the outcome of an alternative-access assessment is one of three states rather than a score: equally effective, a non-equal alternative that may still require individual accommodation, or no viable alternative at all, where accommodation must be arranged case by case. Independence deserves particular weight. An alternative reachable only by asking someone for help is by definition not independent, so any request-gated route is categorically a lesser outcome no matter how well it is staffed.";


// -----------------------------------------------------------------------------
// 4. time-bound-alternative — validity is conditional, and it can lapse
// -----------------------------------------------------------------------------

MATCH (p:Principle {handle: "principle:time-bound-alternative-when-not-conformant"})
SET p.description_full = "Where content does not meet the governing standard, the institution's obligation is to provide an effective means of access while remediation proceeds, with the exception kept time-bound rather than permanent. Non-conformance is a temporary, managed state carrying an affirmative duty to provide alternative access, not a resting state. The time-bound quality is substantive, not procedural. An exception's validity is CONDITIONAL on demonstrable remediation progress by the party with the capacity to remediate. Where a review finds no measurable progress, the exception lapses rather than renewing by default, and continuing to rely on the non-conformant technology becomes an explicit acceptance of residual risk that must be recorded at the level of authority that bears it. An exception that renews indefinitely without evidence of progress has become a permanent exemption wearing a temporary label. This grounds the alternate-access-plan instrument, its annual review and graded outcomes, the modeling of non-conformance as an active condition requiring a covering plan, and the elevation signal when a non-conformant asset has no remediating work or covering alternative.";


// -----------------------------------------------------------------------------
// 5. NEW — proportionality of remedy to barrier severity
// -----------------------------------------------------------------------------

MERGE (p:Principle {handle: "principle:proportionate-remedy"})
ON CREATE SET p.unique_id = randomUUID(),
              p.name = "Remedy proportionate to barrier severity",
              p.description_short = "The weight of the remedial instrument must match the severity of the barrier. Formal alternative-access planning attaches to barriers that block essential functions, not to every conformance imperfection.",
              p.description_full = "Not every departure from a technical standard calls for the same response. Formal alternative-access planning is the institution's answer to barriers severe enough to prevent people from performing essential functions. Conformance failures that do not prevent core functionality do not trigger it, and treating them as though they do is not extra rigor but a misallocation. The reason is practical and follows from finite capacity: a process applied uniformly to every imperfection consumes the attention that severe barriers require, and produces documentation whose volume obscures rather than demonstrates the institution's actual position. It also has a legal edge. Non-conformance whose impact on access is minimal, leaving people able to obtain the same information, engage in the same interactions, complete the same transactions, and otherwise benefit from the same services, is treated differently from non-conformance that excludes. Proportionality is what keeps the distinction operative rather than collapsing every finding into a single undifferentiated category.";

MATCH (p:Principle {handle: "principle:proportionate-remedy"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:proportionate-remedy"}), (d:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// 6. NEW — notice is part of access
// -----------------------------------------------------------------------------

MERGE (p:Principle {handle: "principle:notice-as-part-of-access"})
ON CREATE SET p.unique_id = randomUUID(),
              p.name = "Notice is part of access, not administration around it",
              p.description_short = "A remedy the affected person cannot discover is not a remedy. Disclosing known barriers and the route around them is constitutive of providing access, not paperwork that follows it.",
              p.description_full = "An alternative route only functions for someone who knows it exists before they need it. A plan held on file, unannounced, leaves the person it was written for to encounter the barrier unwarned, spend effort against it, and conclude that nothing is available. On that view disclosure is not administrative overhead attached to a remedy, it is a constituent of the remedy: an undiscoverable alternative and no alternative are indistinguishable in experience. Two obligations follow. Known barriers are stated proactively at the point where the technology is encountered, together with the alternative and a named route to help, rather than disclosed on request after someone has already been blocked. And the people positioned to relay that information, those who support and advise the affected population, are told directly rather than expected to find it. The commitment also has a limit: notice is owed to those who need it and to those who support them, which is not the same as broadcasting an inventory of institutional weaknesses to everyone.";

MATCH (p:Principle {handle: "principle:notice-as-part-of-access"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:notice-as-part-of-access"}), (d:Directive {title: "ADA Title II Regulation (28 CFR Part 35), 2010 Revision"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// 7. Purity of the SHORT descriptions too
// -----------------------------------------------------------------------------
// A post-run audit caught these: both full texts were purified above, but their
// one-line summaries still named the governing instrument. The short text is
// what the UI renders by default, so it is the MORE visible of the two.

MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
SET p.description_short = "Digital accessibility is measured against a fixed, externally defined technical standard incorporated by reference, not against an internal or subjective judgment of accessible enough.";

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"})
SET p.description_short = "The institution must make its programs, services, and activities accessible in advance and as a whole, independent of any individual request.";


// -----------------------------------------------------------------------------
// 8. Ground time-bound-alternative
// -----------------------------------------------------------------------------
// Its prose previously opened "The Title II framework recognizes...". Section 4
// stripped that, and the principle had NO derives_from edge, so the instrument
// would have been lost outright. Relocated here rather than deleted.

MATCH (p:Principle {handle: "principle:time-bound-alternative-when-not-conformant"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:time-bound-alternative-when-not-conformant"}), (d:Directive {title: "DOJ Title II Web and Mobile Accessibility Final Rule (2024)"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// STILL OPEN
// -----------------------------------------------------------------------------
// - universal-design-over-accommodation and institution-wide-responsibility
//   still have no description_full, and universal-design remains ungrounded.
// - 14 of 16 principles remain inert (no `shapes` edge to a descriptor). The two
//   created here are inert as well.
// - The determinations principle (findings must be specific, evidenced, and
//   consistently applied) is still not created.
// =============================================================================
