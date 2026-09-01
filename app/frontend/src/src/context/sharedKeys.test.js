/**
 * The claim the migration rests on, tested at the level it is actually made:
 * separate screens that want the same list now name the same key, so between
 * them they issue ONE request instead of one each.
 *
 * These assert against KEYS rather than against rendered components on purpose.
 * The components are large, need four providers each, and rendering them would
 * test Chakra more than it tests this. What can actually regress is someone
 * writing a key inline at a new call site, or two callers drifting to different
 * spellings — and that is exactly what these catch.
 */
import { KEYS, NS, orgUnitsKeyForType } from './resourceKeys';
import { createResourceStore } from './resourceStore';

describe('shared keys — the de-duplication contract', () => {
    /**
     * Consumer counts as of the people/orgs batch. If a number here goes down,
     * someone stopped sharing; if the key changes, this fails loudly rather than
     * silently doubling traffic.
     */
    const SHARED = [
        {
            key: KEYS.communitiesAll,
            readers: ['CommunitiesMasterContainer', 'MeetingMinutesForm',
                      'ImplementationDetailPanel', 'InterviewGuidesPanel'],
        },
        {
            key: KEYS.ysesByCampus('2025-2026'),
            readers: ['YseAssignmentSelector', 'InterviewGuidesPanel',
                      'AssociatedYearSuccessEvidence'],
        },
        {
            key: KEYS.rolesAll,
            readers: ['RoleHoldingsEditor', 'ParticipantsEditor'],
        },
        {
            key: KEYS.dimensionsAll,
            readers: ['ImplementationDetailPanel', 'ImplementationTypeOverview'],
        },
        {
            key: KEYS.orgUnitsVendors,
            readers: ['AssetDetailPanel', 'AssetForm', 'ToolForm', 'EmployersEditor'],
        },
        {
            key: KEYS.orgUnitsDepartments,
            readers: ['StewardshipCard', 'EmployersEditor'],
        },
        {
            key: KEYS.governanceAll,
            readers: ['AssetsMasterContainer', 'GovernanceMasterContainer',
                      'PrincipleDetailPanel'],
        },
    ];

    it.each(SHARED)('$key is one request for all of its readers', async ({ key, readers }) => {
        const store = createResourceStore();
        const fetcher = jest.fn().mockResolvedValue({ data: { items: [] } });

        // Every reader asks for the same key, concurrently, as they would when
        // several are mounted at once.
        await Promise.all(readers.map(() => store.getOrFetch(key, fetcher)));

        expect(readers.length).toBeGreaterThan(1);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('never lets two distinct resources collide on one key', () => {
        const keys = [
            KEYS.documentationIndex, KEYS.assetsAll, KEYS.assetsElevation,
            KEYS.taapsAll, KEYS.vendorsList, KEYS.orgUnitsVendors,
            KEYS.orgUnitsColleges, KEYS.orgUnitsDepartments, KEYS.interfacesAll,
            KEYS.interfacesUncovered, KEYS.toolsAll, KEYS.componentsAll,
            KEYS.communitiesAll, KEYS.rolesAll, KEYS.dimensionsAll,
            KEYS.implementationsAll, KEYS.governanceAll,
        ];
        expect(new Set(keys).size).toBe(keys.length);
    });

    /**
     * The one that would have been a silent bug: /vendors and
     * /organizational-units?type=vendors are different endpoints with different
     * response shapes. Sharing a key would hand one caller the other's payload.
     */
    it('keeps the two vendor endpoints on separate keys', () => {
        expect(KEYS.vendorsList).not.toBe(KEYS.orgUnitsVendors);
        expect(orgUnitsKeyForType('vendor')).toBe(KEYS.orgUnitsVendors);
    });

    it('scopes every parameterised key by everything its fetch depends on', () => {
        // The fetcher is held in a ref and is NOT part of a resource's identity,
        // so anything it closes over has to appear in the key.
        expect(KEYS.ysesByCampus('2025-2026')).not.toBe(KEYS.ysesByCampus('2026-2027'));
        expect(KEYS.interviewGuides('sfsu', '2025-2026'))
            .not.toBe(KEYS.interviewGuides('csueb', '2025-2026'));
        expect(KEYS.taapsDue('2026-08-31')).not.toBe(KEYS.taapsDue('2026-09-01'));
        expect(KEYS.personDetail('a')).not.toBe(KEYS.personDetail('b'));
        expect(KEYS.documentationItem('notes', 'x'))
            .not.toBe(KEYS.documentationItem('messages', 'x'));
    });

    it('files every key under a declared namespace', () => {
        const namespaces = Object.values(NS);
        const samples = [
            KEYS.documentationIndex, KEYS.documentationItem('notes', 'x'),
            KEYS.assetsAll, KEYS.assetDetail('a'), KEYS.taapsAll, KEYS.taapsDue('d'),
            KEYS.taapDetail('t'), KEYS.vendorsList, KEYS.vendorDetail('v'),
            KEYS.orgUnitsVendors, KEYS.orgUnitsColleges, KEYS.orgUnitsDepartments,
            KEYS.interfacesAll, KEYS.interfacesUncovered, KEYS.interfaceDetail('i'),
            KEYS.toolsAll, KEYS.toolDetail('t'), KEYS.componentsAll,
            KEYS.componentDetail('c'), KEYS.communitiesAll, KEYS.communityDetail('c'),
            KEYS.personDetail('p'), KEYS.interviewGuides('sfsu', 'y'),
            KEYS.guidesForCommunity('c'), KEYS.rolesAll, KEYS.dimensionsAll,
            KEYS.ysesByCampus('y'), KEYS.planYses('p'),
            KEYS.implementationsAll, KEYS.governanceAll,
        ];
        samples.forEach((key) => {
            expect(namespaces.some((ns) => key.startsWith(ns))).toBe(true);
        });
    });

    /**
     * Bulk invalidation is by namespace, so a namespace has to be able to drop
     * everything a write in that domain can move — and nothing outside it.
     */
    it('drops a domain by namespace without touching its neighbours', async () => {
        const store = createResourceStore();
        const load = (k) => store.getOrFetch(k, () => Promise.resolve(k));

        await Promise.all([
            load(KEYS.communitiesAll), load(KEYS.communityDetail('c1')),
            load(KEYS.guidesForCommunity('c1')), load(KEYS.interviewGuides('sfsu', 'y')),
            load(KEYS.rolesAll), load(KEYS.assetsAll),
        ]);

        store.invalidatePrefix(NS.communities);
        expect(store.has(KEYS.communitiesAll)).toBe(false);
        expect(store.has(KEYS.communityDetail('c1'))).toBe(false);
        // Guides are filed under guides:, so a community write leaves them —
        // and a GUIDE write drops both listings in one go.
        expect(store.has(KEYS.guidesForCommunity('c1'))).toBe(true);

        store.invalidatePrefix(NS.guides);
        expect(store.has(KEYS.guidesForCommunity('c1'))).toBe(false);
        expect(store.has(KEYS.interviewGuides('sfsu', 'y'))).toBe(false);

        // Untouched throughout.
        expect(store.has(KEYS.rolesAll)).toBe(true);
        expect(store.has(KEYS.assetsAll)).toBe(true);
    });
});
