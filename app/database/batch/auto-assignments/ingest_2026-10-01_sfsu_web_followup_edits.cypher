// ingest_2026-10-01_sfsu_web_followup_edits.cypher
//
// Follow-up edits to existing nodes from the 2026-10-01 SF State web editor training ingest
// (MeetingMinutes 012948ca9c604c90b89cb4e6cb4c138e). Approved by Daniel Fontaine 2026-10-01.
//
// 1. Shawn Hicks departed SF State (minutes: "following Sean's departure"). Set inactive.
// 2. The two "Reach out to Shawn" plans are moot: Shawn has left and the Drupal Community of
//    Practice is becoming the Web Content Community. Mark abandoned.
// 3. "Prepare Popetech for new SFSU Website" description rewritten to state the work and the
//    done-condition.
// 4. Alexis Cabrerra -> Alexis Cabrera (matches email cabrera@sfsu.edu). The misspelling also
//    appears in prose on four nodes written by today's ingest; those are corrected too.

MATCH (p:Person {unique_id: "9244ea3b-b97a-4317-8c9b-550c3f0d9660"})
SET p.active = false, p.ati_role = "Former SF State Director of Web and Mobile Applications. Left SF State before October 2026.";

MATCH (pl:Plan) WHERE pl.unique_id IN ["a14d356384c44be4a3a0c11f5f8b2699", "3d0c3d3c21e64cd4a53b3db474446f10"]
SET pl.abandoned = true, pl.plan_status = "Abandoned",
  pl.abandoned_notes = "Shawn Hicks has left SF State. The Drupal Community of Practice is being renamed the Web Content Community, and Alexis Cabrera will invite Daniel Fontaine to it (web editor training meeting, 2026-10-01).";

MATCH (pl:Plan {unique_id: "9f79b21f9f7e47de9227269996ce2a77"})
SET pl.description = "Reconfigure Pope Tech for the new SF State site after the November 9, 2026 launch. Rebuild scan groups for the new URL structure and assign them to match the site's permission tiers. Done when scheduled scans run against the live site and each scan group has a named owner.";

MATCH (p:Person {unique_id: "0279792e7b914bcd93b0f968b222ffc0"})
SET p.name = "Alexis Cabrera";

MATCH (n:Note) WHERE n.content CONTAINS "Cabrerra"
SET n.content = replace(n.content, "Cabrerra", "Cabrera");

MATCH (n:Plan) WHERE n.description CONTAINS "Cabrerra"
SET n.description = replace(n.description, "Cabrerra", "Cabrera");

MATCH (n:Query) WHERE n.detail CONTAINS "Cabrerra"
SET n.detail = replace(n.detail, "Cabrerra", "Cabrera");
