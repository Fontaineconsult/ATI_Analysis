/**
 * Pure config tests for the People domain vocabulary — working-group mapping,
 * composite-key inference, diagnostic predicates, and the stat-strip summary.
 */
import {
    WORKING_GROUPS,
    WORKING_GROUP_ORDER,
    getWorkingGroupColor,
    getWorkingGroupAbbrev,
    workingGroupFromCompositeKey,
    personWorkingGroups,
    personCommunities,
    hasRoleNotInPd,
    filterPeople,
    filterCommunities,
    summarizePeople,
    summarizeCommunities,
} from './peopleConfig';

const person = (overrides = {}) => ({
    unique_id: 'u1',
    name: 'Test Person',
    can_approve_yse: false,
    workingGroups: [],
    roles: [],
    ...overrides,
});

describe('working-group vocabulary', () => {
    it('orders the three groups web → ins → pro', () => {
        expect(WORKING_GROUP_ORDER).toEqual(['web', 'ins', 'pro']);
        expect(WORKING_GROUP_ORDER.map((k) => WORKING_GROUPS[k].name)).toEqual([
            'Web', 'Instructional Materials', 'Procurement',
        ]);
    });

    it('carries the brand identity trio as colorSchemes', () => {
        expect(getWorkingGroupColor('Web')).toBe('teal');
        expect(getWorkingGroupColor('Instructional Materials')).toBe('purple');
        expect(getWorkingGroupColor('Procurement')).toBe('coral');
        expect(getWorkingGroupColor('Unknown Group')).toBe('gray');
    });

    it('abbreviates known groups and passes unknowns through uppercased', () => {
        expect(getWorkingGroupAbbrev('Instructional Materials')).toBe('IM');
        expect(getWorkingGroupAbbrev('Steering')).toBe('STEERING');
    });
});

describe('workingGroupFromCompositeKey', () => {
    it.each([
        ['7.6-web', 'Web'],
        ['1-ins', 'Instructional Materials'],
        ['2-pro', 'Procurement'],
        ['3-instructional-materials', 'Instructional Materials'],
    ])('maps %s → %s', (key, expected) => {
        expect(workingGroupFromCompositeKey(key)).toBe(expected);
    });

    it('title-cases unrecognized suffixes and falls back to Other', () => {
        expect(workingGroupFromCompositeKey('4-steering')).toBe('Steering');
        expect(workingGroupFromCompositeKey('nosuffix')).toBe('Other');
        expect(workingGroupFromCompositeKey(null)).toBe('Other');
    });
});

describe('person predicates', () => {
    it('normalizes workingGroups of objects and strings', () => {
        expect(personWorkingGroups(person({ workingGroups: [{ name: 'Web' }, 'Procurement'] })))
            .toEqual(['Web', 'Procurement']);
        expect(personWorkingGroups(person({ workingGroups: undefined }))).toEqual([]);
    });

    it('flags a held role missing from the position description', () => {
        expect(hasRoleNotInPd(person({ roles: [{ handle: 'r', in_position_description: false }] }))).toBe(true);
        expect(hasRoleNotInPd(person({ roles: [{ handle: 'r', in_position_description: true }] }))).toBe(false);
        expect(hasRoleNotInPd(person({ roles: [] }))).toBe(false);
    });
});

describe('filterPeople / summarizePeople', () => {
    const roster = [
        person({ unique_id: 'a', can_approve_yse: true, workingGroups: [{ name: 'Web' }] }),
        person({ unique_id: 'b', workingGroups: [] }),
        person({ unique_id: 'c', workingGroups: [{ name: 'Procurement' }], roles: [{ handle: 'r', in_position_description: false }] }),
    ];

    it('summarizes the diagnostic counts', () => {
        expect(summarizePeople(roster)).toEqual({
            total: 3,
            approvers: 1,
            noWorkingGroup: 1,
            roleNotInPd: 1,
        });
    });

    it('filters by each diagnostic slice and passes everyone for all', () => {
        expect(filterPeople(roster, 'all').map((p) => p.unique_id)).toEqual(['a', 'b', 'c']);
        expect(filterPeople(roster, 'approvers').map((p) => p.unique_id)).toEqual(['a']);
        expect(filterPeople(roster, 'noWorkingGroup').map((p) => p.unique_id)).toEqual(['b']);
        expect(filterPeople(roster, 'roleNotInPd').map((p) => p.unique_id)).toEqual(['c']);
    });

    it('falls back to all on an unknown filter key', () => {
        expect(filterPeople(roster, 'nonsense')).toHaveLength(3);
    });
});

describe('communities', () => {
    const communities = [
        { unique_id: 'c1', name: 'Library', member_count: 2, campuses: ['SFSU'] },
        { unique_id: 'c2', name: 'Alternative Media', member_count: 0, campuses: [] },
    ];
    const roster = [
        person({ unique_id: 'a', communities: [{ unique_id: 'c1', name: 'Library', note: null }] }),
        person({ unique_id: 'b', communities: [] }),
        person({ unique_id: 'c' }),
    ];

    it('normalizes person.communities and tolerates its absence', () => {
        expect(personCommunities(roster[0]).map((c) => c.name)).toEqual(['Library']);
        expect(personCommunities(roster[2])).toEqual([]);
        expect(personCommunities(null)).toEqual([]);
    });

    it('filters empty communities and passes everything for all', () => {
        expect(filterCommunities(communities, 'empty').map((c) => c.unique_id)).toEqual(['c2']);
        expect(filterCommunities(communities, 'all')).toHaveLength(2);
    });

    it('summarizes community + membership-coverage counts', () => {
        expect(summarizeCommunities(communities, roster)).toEqual({
            total: 2,
            emptyCommunities: 1,
            peopleInCommunity: 1,
            peopleInNone: 2,
            totalStakes: 0,
        });
        expect(summarizeCommunities(
            [{ unique_id: 'c3', stake_count: 2 }, { unique_id: 'c4', stake_count: 3 }], [],
        ).totalStakes).toBe(5);
    });
});
