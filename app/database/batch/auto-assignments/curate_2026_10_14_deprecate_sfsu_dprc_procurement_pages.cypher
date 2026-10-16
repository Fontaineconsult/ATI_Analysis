// curate_2026_10_14_deprecate_sfsu_dprc_procurement_pages.cypher
//
// Why: two SF State procurement pages describe a review process run by DPRC. DPRC no
// longer does this work. Both pages are still live on access.sfsu.edu and still name
// DPRC (checked 2026-10-14), and two live implementations cite them as current
// evidence. The companion page "Accessible Procurement Process" (/procedure) was
// already deprecated on 2026-06-15.
//
// What it does: marks both Webpage nodes depreciated with today's date. This is the
// same pair of properties update_webpage sets, and nothing else changes: the
// is_documented_by edges, year curation and Source Text stay as they are, so the
// record of what the pages said is kept.
//
// What it does not do: it does not retire the implementations that cite the pages
// ("VPAT/ACR Guidances", "Primary ATI Public Resources Regarding Accessible
// Procurement"). Each still has other documentation. Whether they need new evidence
// is a separate curation decision. The pages themselves still need to be taken down
// or redirected on the SF State site.
//
// Sections:
//   1. Deprecate "Determining Impact of a Technology Acquisition" (/ati/procurement/impact)
//   2. Deprecate "Common Questions on Accessible Procurement" (/ati/procurement/faq)

// 1.
MATCH (w:Webpage {url: "https://access.sfsu.edu/ati/procurement/impact"})
WHERE coalesce(w.depreciated, false) = false
SET w.depreciated = true, w.depreciated_date = date("2026-10-14");

// 2.
MATCH (w:Webpage {url: "https://access.sfsu.edu/ati/procurement/faq"})
WHERE coalesce(w.depreciated, false) = false
SET w.depreciated = true, w.depreciated_date = date("2026-10-14");
