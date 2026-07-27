// 07_principles_grounding.cypher
// Ground and activate the two inert principles the 2026-07-27 ontology-health scan
// flagged. All statements MATCH existing nodes only (the Guideline nodes for
// WCAG-EM 2.0 / WCAG 2.1 and the Title II Law node already exist in the graph)
// and MERGE plain edges, matching queries/principles/update.py (no edge
// properties). Each statement is a no-op if a target is missing; MERGE makes
// re-runs idempotent.

// ==== ground-conformance-principle-in-title-ii ==========================
// 'Conformance to an external technical standard' was fully ungrounded
// (derives_from nothing) despite its text resting on the Title II web rule.
MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
MATCH (t:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(t);

// ==== ground-conformance-principle-in-wcag21 ============================
// The principle names WCAG 2.1 AA as the binding floor.
MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
MATCH (t:Guideline {title: "Web Content Accessibility Guidelines (WCAG) 2.1"})
MERGE (p)-[:derives_from]->(t);

// ==== ground-conformance-principle-in-wcag-em ===========================
// WCAG-EM 2.0 operationalizes evaluation against the external standard —
// the methodology side of the same commitment.
MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
MATCH (t:Guideline {title: "WCAG Evaluation Methodology (WCAG-EM) 2.0"})
MERGE (p)-[:derives_from]->(t);

// ==== conformance-principle-shapes-guideline ============================
// The principle's own text: it grounds 'the separation between a fixed standard
// layer and the institution's own assessment' — i.e. the Guideline element.
MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Guideline"})
MERGE (p)-[:shapes]->(d);

// ==== conformance-principle-shapes-component ============================
// The principle's own text: 'WCAG as the authority that individuates
// components' — i.e. the Component element.
MATCH (p:Principle {handle: "principle:conformance-to-an-external-technical-standard"})
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Component"})
MERGE (p)-[:shapes]->(d);

// ==== ground-time-bound-alternative-principle-in-title-ii ===============
// 'Time-bound alternative access when full conformance is not yet achieved'
// was fully ungrounded; its text rests on the Title II framework.
MATCH (p:Principle {handle: "principle:time-bound-alternative-when-not-conformant"})
MATCH (t:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(t);

// ==== time-bound-alternative-principle-shapes-taap ======================
// The principle's own text: it 'grounds the alternate-access-plan instrument
// (its time-bound nature, annual review, and graded outcomes)' — yet it shaped
// nothing. It joins 'Equally effective access' on node_type:TAAP.
MATCH (p:Principle {handle: "principle:time-bound-alternative-when-not-conformant"})
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:TAAP"})
MERGE (p)-[:shapes]->(d);
