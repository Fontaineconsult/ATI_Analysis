// SSU instructional materials 2025-2026: corrections found by the full web sweep.
// Read-only sweep ran 2026-10-30 over all 32 URLs behind SSU instructional evidence.
// Source text writes (three pages) are run separately through neo4j-cli --rw with the
// text passed as a parameter, because raw_text does not belong in a batch literal.

// ---------------------------------------------------------------------------
// 1. Unwire the QLT Accessibility Checklist from the SSU indicators.
// ---------------------------------------------------------------------------
// The checklist is an SF State CPaGE artifact. Its owner Ash Klein works at
// SF State (atklein@sfsu.edu, CPaGE), its only documentation is "QLT Guide Use
// for CPaGE course Review", and its description is a copy of its own title.
// It was wired to SSU 6.2, 6.4 and 6.5 across two years and to no SFSU
// indicator. The owner record is correct; the Sonoma wiring is not.
// Effect: 6.2 returns to nothing wired, 6.4 drops to two items, 6.5 to one.
MATCH (i:Procedure {unique_id: '21258d7911144e8d850c7755358ae6c2'})-[e:is_evidence_for]->(yse:YearSuccessEvidence)
WHERE yse.year_identifier IN [
  '2025-2026-6.2-ins-ssu', '2025-2026-6.4-ins-ssu', '2025-2026-6.5-ins-ssu',
  '2026-2027-6.2-ins-ssu', '2026-2027-6.4-ins-ssu', '2026-2027-6.5-ins-ssu'
]
DELETE e;

// ---------------------------------------------------------------------------
// 2. Clear two wrong "no longer exists" flags.
// ---------------------------------------------------------------------------
// Both policies are Active. They moved to PolicyStat, and policies.sonoma.edu
// redirects to the new record. The earlier flag came from a 403, which on these
// hosts is a Cloudflare challenge rather than a missing page.
//   Sonoma Syllabus Policy        -> PolicyStat 16518497, Active, review due 03/2023
//   Disabilty Policy for Faculty  -> PolicyStat 16553982, Active, review due 07/2016
MATCH (w:Webpage)
WHERE w.unique_id IN ['45da99c3f18843fc978dc90f75ce2267', '93d5d33eca9e4b0e9bb783311b9e4673']
SET w.no_longer_exists = false;

// ---------------------------------------------------------------------------
// 3a. Correct four addresses that have moved.
// ---------------------------------------------------------------------------
// CSUEB ICT Purchases: csueastbay.edu/ict now redirects to the SFBRN site. The
// 9/16 procurement minutes record this consolidation as deliberate.
MATCH (w:Webpage {unique_id: '9c96868d740c470a9f9e9849951e5071'})
SET w.url = 'https://www.sfbrn.calstate.edu/technology-purchases';

// DSS FAQ: /faq now redirects to the narrower "Technology FAQs" page.
MATCH (w:Webpage {unique_id: 'ab73f97702a1417e97b2557982d74083'})
SET w.url = 'https://dss.sonoma.edu/faqs/technology-faqs';

// EquatIO: /faq/equatio now redirects to /equatio.
MATCH (w:Webpage {unique_id: 'a369ae1a36444920a5f0225b9242d5dc'})
SET w.url = 'https://dss.sonoma.edu/equatio';

// SSU Syllabus Policy: the cited catalog is an archived edition. The current
// catalog is catoid 13 (2026-2027) and Regulations and Policies is navoid 1696.
// The stored text was captured from the archived edition and should be recaptured.
MATCH (w:Webpage {unique_id: '7d7c6479904f4a8095066b1d6c5a0609'})
SET w.url = 'https://catalog.sonoma.edu/content.php?catoid=13&navoid=1696#syllabus-policy';

// ---------------------------------------------------------------------------
// 3b. Merge the duplicate Alternate Media page.
// ---------------------------------------------------------------------------
// dss.sonoma.edu/services/alternate-media redirects to
// dss.sonoma.edu/accommodations/alternate-media. Two nodes hold the same live
// page. Keep the one on the canonical address, which also holds more text.
// SSU Alternative Services is documented only by the duplicate, and that edge
// carries 2024-2025 year curation, so the properties move with it.
MATCH (s:Service {unique_id: 'cbe53aaed6f546bbaa209a5b4316065f'})-[old:is_documented_by]->(dup:Webpage {unique_id: 'bea50e6124084418ae1a7e98b793833f'})
MATCH (canon:Webpage {unique_id: '38d122ae88b34ef49fd4cb50824980eb'})
MERGE (s)-[new:is_documented_by]->(canon)
ON CREATE SET new.added_date = old.added_date,
              new.included_in_years = old.included_in_years,
              new.excluded_from_years = old.excluded_from_years,
              new.modified_date = date()
DELETE old;

MATCH (dup:Webpage {unique_id: 'bea50e6124084418ae1a7e98b793833f'})
DETACH DELETE dup;

// ---------------------------------------------------------------------------
// 4. Record that the QLT rubric has a new edition.
// ---------------------------------------------------------------------------
// Filed on the three indicators where QLT carries the accessibility claim.
// include_in_report is false: this asks CTET to confirm which edition the
// current review uses, which is a verification step rather than a finding.
UNWIND ['2025-2026-6.4-ins-ssu', '2025-2026-6.5-ins-ssu', '2025-2026-8.12-ins-ssu'] AS yid
MATCH (yse:YearSuccessEvidence {year_identifier: yid})
CREATE (n:Note {
  unique_id: replace(toString(randomUUID()), '-', ''),
  name: 'qlt-rubric-4th-edition-oct-2026-yse:' + yid + '-' + substring(replace(toString(randomUUID()), '-', ''), 0, 8),
  content: "The Chancellor's Office published the QLT Rubric 4th Edition in 2026. It holds 51 objectives across 9 sections. A committee of 16 people from 14 CSU campuses wrote it. The 3rd Edition from 2022 holds 52 objectives, and that is the edition attached to Sonoma's QLT evidence. Courses reach Level 3 of the CTET ladder by scoring 85 percent or better against this rubric, so which edition applies changes what the review tests. The rubric page was captured from the Chancellor's Office site on 2026-10-30. Ask CTET which edition the Level 3 review now uses.",
  include_in_report: false,
  date_created: date()
})
MERGE (yse)-[:has_note]->(n);
