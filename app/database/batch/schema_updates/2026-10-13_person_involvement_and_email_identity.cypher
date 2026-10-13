// =====================================================================================
// Person: involvement scoping and email identity.
// Run 2026-10-13 by Daniel Fontaine, on branch refining-people-schema.
//
// WHY
//   People pickers listed everyone with `active OR non_committee_member_active`. The TAAP
//   importer created every signer with both flags true, so 32 department heads who only
//   signed a TAAP appeared as candidate members across the app. The two booleans could
//   not say "appears in our records but is not part of the ATI". Person.ati_involvement
//   replaces non_committee_member_active: member, contributor, or contact
//   (data_config.ati_involvement_levels). Person.active keeps its meaning: still in role.
//
// CLASSIFICATION
//   contact      a TAAP is the person's only ATI tie (32), or they are vendor staff
//                with no committee, community, role or lead seat (2: Joyce Bold and
//                Misty Nicholson, Follett account contacts flagged as committee).
//   member       otherwise, where non_committee_member_active was false.
//   contributor  otherwise, where it was true.
//   Hand-set flags on people with no ties at all (Serena Kohgadai, Gr Keer) are kept.
//   Previewed before writing: 34 contacts, 20 contributors, 67 members.
//
// EMAIL IDENTITY
//   Email becomes the unique identity key, stored trimmed and lowercased. Two fixes
//   first: Dan Legate's email is lowercased, and Ian Carlson's email and title were
//   swapped at entry. The uniqueness constraint is a schema command, which cannot share
//   a transaction with these writes, so it is created separately after this file:
//     CREATE CONSTRAINT constraint_unique_Person_email IF NOT EXISTS
//     FOR (p:Person) REQUIRE p.email IS UNIQUE
//   The name constraint stays.
//
// NOT DONE
//   non_committee_member_active is left on the nodes. The deployed app still reads it;
//   remove it in a cleanup after this branch is deployed.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/schema_updates/2026-10-13_person_involvement_and_email_identity.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/schema_updates/2026-10-13_person_involvement_and_email_identity.cypher --execute
// =====================================================================================


// --- 1. Email fixes ----------------------------------------------------------------------
MATCH (p:Person {name: "Dan Legate"}) WHERE p.email = "Dan.LeGate@csueastbay.edu" SET p.email = "dan.legate@csueastbay.edu";

MATCH (p:Person {name: "Ian Carlson"}) WHERE p.title = "carlsoni@sonoma.edu" SET p.email = "carlsoni@sonoma.edu", p.title = "Lead Web & Mobile Developer";


// --- 2. Involvement ----------------------------------------------------------------------
MATCH (p:Person)
WITH p,
     EXISTS { (p)-[:participates_in|member_of_community|holds_role]->() } OR
     EXISTS { (p)<-[:has_group_lead|has_executive_sponsor]-() } AS seat,
     EXISTS { (p)-[r]-(o) WHERE NOT type(r) IN ['works_at_campus', 'employs'] AND NOT o:TAAP } AS ati_tie,
     EXISTS { (p)--(:TAAP) } AS taap_tie,
     EXISTS { (p)<-[:employs]-(:Vendor) } AS vendor_staff
SET p.ati_involvement = CASE
       WHEN taap_tie AND NOT ati_tie THEN 'contact'
       WHEN vendor_staff AND NOT seat THEN 'contact'
       WHEN NOT coalesce(p.non_committee_member_active, false) THEN 'member'
       ELSE 'contributor' END;


// --- 3. Descriptors ----------------------------------------------------------------------
UNWIND [
  {h: "field:Person.ati_involvement", kind: "field", field: "ati_involvement", value: null, title: "Person.ati_involvement",
   short: "How the person takes part in the ATI: member, contributor, or contact.",
   full: "One of the `ati_involvement_levels` vocabulary. Independent of active, which says only whether the person is still in their role. People pickers offer members and contributors. Contacts stay reachable from the records they appear on, such as a TAAP or a vendor. Imports create contacts and never change an existing person's involvement."},
  {h: "field:Person.email", kind: "field", field: "email", value: null, title: "Person.email",
   short: "The person's identity key when known, unique and stored lowercased.",
   full: "Email is unique across Person nodes and stored trimmed and lowercased, so one address cannot become two people. A person without an email, such as a TAAP signer, is matched on name plus campus. It is also the link between a login account and its Person."},
  {h: "field_value:ati_involvement.member", kind: "field_value", field: "ati_involvement", value: "member", title: "Member",
   short: "Sits on an ATI committee or working group.", full: "Sits on an ATI committee or working group."},
  {h: "field_value:ati_involvement.contributor", kind: "field_value", field: "ati_involvement", value: "contributor", title: "Contributor",
   short: "Does ATI work without a committee seat.", full: "Does ATI work, such as owning or working on an implementation, without a committee seat."},
  {h: "field_value:ati_involvement.contact", kind: "field_value", field: "ati_involvement", value: "contact", title: "Contact",
   short: "Appears in ATI records without taking part in the ATI.", full: "Appears in ATI records, for example by signing a TAAP, maintaining a page, or working for a vendor, without taking part in the ATI."}
] AS d
MERGE (u:UniversalDescriptor {descriptor_handle: d.h})
ON CREATE SET u.unique_id = replace(randomUUID(), "-", ""), u.include_in_report = false
SET u.descriptor_kind = d.kind, u.target_label = CASE WHEN d.kind = "field" THEN "Person" ELSE null END,
    u.target_field = d.field, u.target_value = d.value, u.title = d.title,
    u.description_short = d.short, u.description_full = d.full,
    u.search_text = toLower(d.title + " " + d.short + " " + d.full + " " + d.field + coalesce(" " + d.value, "")),
    u.last_updated = date("2026-10-13");
