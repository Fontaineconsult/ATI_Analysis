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
    hasRoleNotInPd,
    filterPeople,
    summarizePeople,
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
