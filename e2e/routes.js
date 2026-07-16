// Route manifest — every statically-addressable page the axe sweep scans.
//
// All paths live under the /ati basename and a campus segment. Detail routes
// that need a real graph ID (implementations/:type/:id, plans/:planId,
// governance/:id, …) are exercised by interaction specs instead, since IDs
// vary by database state.
const CAMPUS = process.env.E2E_CAMPUS || 'sfsu';

const p = (path) => `/ati/${CAMPUS}${path}`;

const ROUTES = [
    // Dashboard area
    { name: 'dashboard: report master list', path: p('/dashboard') },
    { name: 'dashboard: web goal view', path: p('/dashboard/web/goal/1') },
    { name: 'dashboard: instructional materials goal view', path: p('/dashboard/instructional-materials/goal/1') },
    { name: 'dashboard: procurement goal view', path: p('/dashboard/procurement/goal/1') },
    { name: 'dashboard: reports', path: p('/dashboard/reports') },
    { name: 'dashboard: report overview (copy report)', path: p('/dashboard/report-overview') },
    { name: 'dashboard: implementations', path: p('/dashboard/implementations') },
    { name: 'dashboard: plans', path: p('/dashboard/plans') },
    { name: 'dashboard: campus plan', path: p('/dashboard/campus-plan') },
    { name: 'dashboard: settings', path: p('/dashboard/settings') },
    { name: 'dashboard: settings status levels', path: p('/dashboard/settings/status-levels') },
    { name: 'dashboard: settings success indicators', path: p('/dashboard/settings/success-indicators') },
    { name: 'dashboard: settings ontology browser', path: p('/dashboard/settings/ontology-browser') },

    // ATI Explorer area
    { name: 'explorer: implementations', path: p('/ati-explorer/implementations') },
    { name: 'explorer: plans', path: p('/ati-explorer/plans') },
    { name: 'explorer: people', path: p('/ati-explorer/people') },
    { name: 'explorer: governance', path: p('/ati-explorer/governance') },
    { name: 'explorer: principles', path: p('/ati-explorer/principles') },
    { name: 'explorer: assets', path: p('/ati-explorer/assets') },
    { name: 'explorer: assets taaps tab', path: p('/ati-explorer/assets/taaps') },
    { name: 'explorer: assets vendors tab', path: p('/ati-explorer/assets/vendors') },
    { name: 'explorer: assets interfaces tab', path: p('/ati-explorer/assets/interfaces') },
    { name: 'explorer: assets tools tab', path: p('/ati-explorer/assets/tools') },
    { name: 'explorer: assets components tab', path: p('/ati-explorer/assets/components') },

    // About area (static content — no graph data required)
    { name: 'about: overview', path: p('/about/overview') },
    { name: 'about: executive summary', path: p('/about/executive-summary') },
    { name: 'about: core model', path: p('/about/core-model') },
    { name: 'about: evidence & implementations', path: p('/about/evidence') },
    { name: 'about: plans & progress', path: p('/about/plans') },
    { name: 'about: assets & interfaces', path: p('/about/assets') },
    { name: 'about: adding data', path: p('/about/adding-data') },
    { name: 'about: glossary', path: p('/about/glossary') },
];

module.exports = { ROUTES, CAMPUS, campusPath: p };
