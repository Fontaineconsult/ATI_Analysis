/**
 * Cache keys for the shared resource store, in one place.
 *
 * A key IS the identity of a fetched resource: two components asking for the
 * same key get one request and one cached answer, and a mutation invalidates by
 * key. Both of those only work if everyone spells the key the same way, which is
 * why they are not written inline at the call sites.
 *
 * NAMING: `<namespace>:<what>[:<scope>]`. The namespace is what invalidation
 * works in bulk on — `invalidateNamespace(NS.assets)` after any asset write
 * drops the list, the elevation signal and every asset detail together, which is
 * correct because a rename shows up in all three.
 *
 * SCOPE BELONGS IN THE KEY. The fetcher is held in a ref by useResource and is
 * NOT part of a resource's identity, so anything the fetch depends on — an id, a
 * date, a campus, a year — has to appear in the key or two different requests
 * will share one cache entry.
 *
 * A CAVEAT WORTH KNOWING: fetchVendors and fetchVendorsList are different
 * endpoints (/organizational-units?type=vendors and /vendors) returning
 * different shapes. They get different keys deliberately; collapsing them would
 * hand one caller the other's payload.
 */

/** Namespaces — the unit of bulk invalidation. */
export const NS = {
    assets: 'assets:',
    taaps: 'taaps:',
    vendors: 'vendors:',
    orgUnits: 'orgunits:',
    interfaces: 'interfaces:',
    tools: 'tools:',
    components: 'components:',
    implementations: 'implementations:',
    governance: 'governance:',
    communities: 'communities:',
    people: 'people:',
    roles: 'roles:',
    dimensions: 'dimensions:',
    yse: 'yse:',
    guides: 'guides:',
    documentation: 'documentation:',
    report: 'report:',
    plan: 'plan:',
};

export const KEYS = {
    // --- Documentation (read-only area; nothing invalidates these) ---
    documentationIndex: 'documentation:index',
    documentationItem: (docType, uniqueId) => `documentation:item:${docType}:${uniqueId}`,

    // --- Assets ---
    assetsAll: 'assets:all',
    assetsElevation: 'assets:elevation',
    assetDetail: (identifier) => `assets:detail:${identifier}`,

    // --- TAAPs ---
    taapsAll: 'taaps:all',
    /** Scoped by date: "due for review as of" is a different answer tomorrow. */
    taapsDue: (isoDate) => `taaps:due:${isoDate}`,
    taapDetail: (title) => `taaps:detail:${title}`,

    // --- Vendors (the /vendors endpoint) ---
    vendorsList: 'vendors:list',
    vendorDetail: (name) => `vendors:detail:${name}`,

    // --- Organizational units (the /organizational-units endpoint) ---
    orgUnitsVendors: 'orgunits:vendors',
    orgUnitsColleges: 'orgunits:colleges',
    orgUnitsDepartments: 'orgunits:departments',

    // --- Interfaces ---
    interfacesAll: 'interfaces:all',
    interfacesUncovered: 'interfaces:uncovered',
    interfaceDetail: (identifier) => `interfaces:detail:${identifier}`,

    // --- Tools ---
    toolsAll: 'tools:all',
    toolDetail: (identifier) => `tools:detail:${identifier}`,

    // --- Components ---
    componentsAll: 'components:all',
    componentDetail: (identifier) => `components:detail:${identifier}`,

    // --- Communities of practice ---
    communitiesAll: 'communities:all',
    communityDetail: (uniqueId) => `communities:detail:${uniqueId}`,

    // --- People ---
    /** The roster itself lives in UserContext; this is the per-person detail read. */
    personDetail: (employeeId) => `people:detail:${employeeId}`,

    // --- Interview guides ---
    // Filed under guides:, not communities:, even though the community panel shows
    // them: a guide WRITE should drop both listings, and one namespace does that.
    interviewGuides: (campus, year) => `guides:campus:${campus}:${year}`,
    guidesForCommunity: (communityId) => `guides:for-community:${communityId}`,

    // --- Reference vocabularies ---
    rolesAll: 'roles:all',
    dimensionsAll: 'dimensions:all',

    // --- Year success evidence ---
    // fetchYsesByCampusForYear takes ONLY the year despite its name: it returns
    // every campus and callers filter client-side. So the key is year-scoped, and
    // the three components that call it genuinely share one request.
    ysesByCampus: (academicYear) => `yse:by-campus:${academicYear}`,
    planYses: (planId) => `yse:for-plan:${planId}`,

    // --- Cross-domain reads ---
    implementationsAll: 'implementations:all',
    governanceAll: 'governance:all',
};

/**
 * The org-unit list for one unit type. EmployersEditor picks its fetcher from a
 * type dropdown, so it needs the key by the same token rather than by name.
 */
export const orgUnitsKeyForType = (unitType) => ({
    department: KEYS.orgUnitsDepartments,
    college: KEYS.orgUnitsColleges,
    vendor: KEYS.orgUnitsVendors,
}[unitType] || null);

export default KEYS;
