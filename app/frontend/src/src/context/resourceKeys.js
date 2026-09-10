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
    followUps: 'follow-ups:',
    documentation: 'documentation:',
    minutes: 'minutes:',
    queries: 'queries:',
    asana: 'asana:',
    settings: 'settings:',
    ontology: 'ontology:',
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

    // --- Follow-ups ---
    // Keyed by the meeting they chase, since that is the only way in. The table
    // is a live derivation and the list is the saved record, so they invalidate
    // together whenever a follow-up is written.
    followUpTable: (meetingId) => `follow-ups:table:${meetingId}`,
    followUpsForMeeting: (meetingId) => `follow-ups:for-meeting:${meetingId}`,
    followUpBoard: (campus) => `follow-ups:board:${campus || 'all'}`,
    plansBoard: (campus, year) => `plans:board:${campus}:${year}`,
    plansTasks: (campus, year) => `plans:tasks:${campus}:${year}`,
    accomplishmentsBoard: 'accomplishments:board',

    // --- Reference vocabularies ---
    rolesAll: 'roles:all',
    dimensionsAll: 'dimensions:all',

    // --- Year success evidence ---
    // fetchYsesByCampusForYear takes ONLY the year despite its name: it returns
    // every campus and callers filter client-side. So the key is year-scoped, and
    // the three components that call it genuinely share one request.
    ysesByCampus: (academicYear) => `yse:by-campus:${academicYear}`,
    planYses: (planId) => `yse:for-plan:${planId}`,

    // --- Governance ---
    /** The picker pool of goals + success indicators an instrument can link to. */
    governanceLinkTargets: 'governance:link-targets',
    /**
     * Governance for one indicator. `withCandidates` is IN THE KEY because it
     * changes the payload — the picker pool is about 93% of it — so the collapsed
     * and expanded reads are two entries and expanding is a one-time cost.
     */
    governanceForIndicator: (compositeKey, withCandidates) =>
        `governance:for-indicator:${compositeKey}:${withCandidates ? 'full' : 'compact'}`,

    // --- Legacy documentation lists ---
    // The bare-array /documents/<type> routes, distinct from the Documentation
    // index (documentation:index) which returns {items, summary, meta}. Same
    // namespace so a documentation write drops both.
    documentsList: 'documentation:documents-list',
    webpagesList: 'documentation:webpages-list',

    // --- Meeting minutes and queries ---
    // Both panels of each pair read one key: the campus plan's working-group
    // section and the standalone panel show the same records.
    minutesForPlan: (planIdentifier) => `minutes:for-plan:${planIdentifier}`,
    queriesForPlan: (planIdentifier) => `queries:for-plan:${planIdentifier}`,
    /** The plan-less variant, when a working group has no plan record yet. */
    queriesForWorkingGroup: (campus, year, workingGroup) =>
        `queries:for-wg:${campus}:${year}:${workingGroup}`,

    // --- Plans ---
    /** Communities grouped by working group — a different shape from
     *  communities:all, but the same underlying records, so a community write
     *  drops both. */
    communitiesByWorkingGroup: 'communities:by-working-group',
    /** Asana is an external system; its own namespace, so refreshing subtasks
     *  never drags the campus-plan cache with it. */
    planAsanaSubtasks: (planUniqueId) => `asana:subtasks:${planUniqueId}`,

    // --- Settings and ontology ---
    /** The whole settings payload; several forms want one vocabulary out of it. */
    settingsAll: 'settings:all',
    /** Existing nodes of one descriptor category, for the status-level linker. */
    settingsSubNodes: (category) => `settings:sub-nodes:${category}`,
    ontologyTree: 'ontology:tree',
    ontologyHealth: 'ontology:health',
    /** Org units for one campus — distinct from the type-scoped catalogues. */
    localOrgUnits: (campus) => `orgunits:local:${campus}`,

    // --- Implementations ---
    implementationsByType: (type) => `implementations:by-type:${type}`,

    // --- Indicators ---
    /** ICT stewarded under one year's evidence. */
    stewardedIct: (yearIdentifier) => `assets:stewarded-ict:${yearIdentifier}`,

    /** The legacy five-way documentation bundle behind the older Documents area. */
    documentationBundle: 'documentation:legacy-bundle',

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
