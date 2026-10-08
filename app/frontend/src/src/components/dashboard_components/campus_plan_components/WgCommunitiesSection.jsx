import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Badge, Box, Button, HStack, Link, Text } from '@chakra-ui/react';
import { getGoalViewUrlFromCompositeKey, getPersonUrl } from '../../../services/utils/tools';
import { InlineList, ListEntry, StackList } from './lists';

const MICRO = {
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'gray.600',
    letterSpacing: 'wide',
    whiteSpace: 'nowrap',
};

const COLLAPSED_COUNT = 5;

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}

function Avatar({ name, size = '22px' }) {
    return (
        <Box
            w={size}
            h={size}
            borderRadius="full"
            bg="teal.50"
            color="teal.800"
            fontSize="10px"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
        >
            {initials(name)}
        </Box>
    );
}

// A person's name, linked to their People-explorer page when there is an
// employee_id and a campus to route under; plain text otherwise.
function PersonName({ person, campusAbbrev, color = 'gray.600', suffix = '' }) {
    const style = { fontSize: '13px', whiteSpace: 'nowrap' };
    if (!person?.employee_id || !campusAbbrev) {
        return <Text {...style} color={color}>{person?.name}{suffix}</Text>;
    }
    return (
        <Text {...style} color={color}>
            <Link
                as={RouterLink}
                to={getPersonUrl(person.employee_id, campusAbbrev)}
                color="teal.700"
                _hover={{ textDecoration: 'underline' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', borderRadius: 'sm' }}
            >
                {person.name}
            </Link>
            {suffix}
        </Text>
    );
}

/**
 * The people at the top of a working-group card: the WGP's group leads, then
 * the group's other members at this campus. The card's section header owns the
 * heading and the Manage button.
 *
 * Props:
 *   leads          [{unique_id, name, employee_id}] — the WGP's group_leads
 *                  (every name links to the person's page by employee_id)
 *   members        [{name, title, employee_id, campus}] — participates_in roster
 *                  for the working group, all campuses; filtered here to
 *                  campusAbbrev, with leads removed so nobody is listed twice
 *   campusAbbrev   current campus
 */
export function campusMembersOf(leads = [], members = [], campusAbbrev) {
    const leadNames = new Set(leads.map((l) => l.name));
    return members.filter((m) =>
        (!campusAbbrev || m.campus === campusAbbrev) && !leadNames.has(m.name));
}

// A community's members active at this campus. active_campuses is the
// server-resolved effective scope (the membership's own campus list when set,
// else the member's home campus). An empty effective list is a data gap, not
// evidence they work elsewhere, so those members stay visible.
export function communityMembersAt(community, campusAbbrev) {
    const all = community?.leads || [];
    if (!campusAbbrev) return all;
    const eff = (m) => m.active_campuses ?? (m.campus ? [m.campus] : []);
    return all.filter((m) => eff(m).length === 0 || eff(m).includes(campusAbbrev));
}

export function WgPeopleSection({ leads = [], members = [], campusAbbrev }) {
    const campusMembers = campusMembersOf(leads, members, campusAbbrev);
    const here = campusAbbrev ? campusAbbrev.toUpperCase() : 'this campus';

    const personEntry = (p, key) => (
        <ListEntry key={key} gap={1} title={p.title || undefined}>
            <Avatar name={p.name} />
            <PersonName person={p} campusAbbrev={campusAbbrev} />
        </ListEntry>
    );

    return (
        <Box px={5} py={3}>
            <HStack spacing={3} align="flex-start">
                <Text {...MICRO} minW="64px" lineHeight="22px">Leads</Text>
                {leads.length === 0 ? (
                    <Text fontSize="13px" color="gray.600" fontStyle="italic">none</Text>
                ) : (
                    <InlineList flex="1" minW={0} aria-label="Leads">
                        {leads.map((l) => personEntry(l, l.unique_id))}
                    </InlineList>
                )}
            </HStack>

            <HStack spacing={3} mt={2} align="flex-start">
                <Text {...MICRO} minW="64px" lineHeight="22px">Members ({campusMembers.length})</Text>
                {campusMembers.length === 0 ? (
                    <Text fontSize="13px" color="gray.600" fontStyle="italic">none at this campus</Text>
                ) : (
                    <InlineList flex="1" minW={0} aria-label={`Members at ${here}`}>
                        {campusMembers.map((m) => personEntry(m, m.employee_id || m.name))}
                    </InlineList>
                )}
            </HStack>
        </Box>
    );
}

/**
 * The community-of-practice stack of a working-group card: the communities
 * whose indicator stakes land in this working group (strongest fit first), each
 * with its members at this campus and its stakes. The card's section header owns
 * the heading and count.
 *
 * Props:
 *   communities    [{name, stake_count, stakes: [{composite_key, success_indicator}],
 *                    leads: [{name, employee_id, campus, title, note}]}]
 *                  each stake renders as a link to the indicator's goal view,
 *                  each member as a link to their person page
 *   accentColor    the working group's accent (campusPlanConfig)
 *   campusAbbrev   current campus — the roster shows ONLY this campus's members
 *                  (communities are cross-campus; a campus plan is not)
 */
function WgCommunitiesSection({ communities = [], accentColor, campusAbbrev }) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? communities : communities.slice(0, COLLAPSED_COUNT);
    const hidden = communities.length - visible.length;

    return (
        <Box px={5} py={3}>
            {communities.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No community holds a stake in this group's indicators.
                </Text>
            ) : (
                <>
                    <StackList spacing={1.5}>
                        {visible.map((c) => {
                            const allMembers = c.leads || [];
                            const members = communityMembersAt(c, campusAbbrev);
                            return (
                            <Box
                                as="li"
                                key={c.name}
                                borderWidth="1px"
                                borderColor="gray.300"
                                borderLeftWidth="3px"
                                borderLeftColor={accentColor}
                                borderRadius="md"
                                bg="gray.100"
                                px={3}
                                py={1.5}
                            >
                                <HStack spacing={2} flexWrap="wrap">
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.800" whiteSpace="nowrap">
                                        {c.name}
                                    </Text>
                                    <Badge colorScheme="gray" variant="outline" bg="white" fontSize="2xs" flexShrink={0}>
                                        {c.stake_count} stake{c.stake_count === 1 ? '' : 's'}
                                    </Badge>
                                    {allMembers.length === 0 ? (
                                        <Text fontSize="13px" color="gray.600" fontStyle="italic">
                                            no members recorded — people derive from the working group
                                        </Text>
                                    ) : members.length === 0 ? (
                                        <Text fontSize="13px" color="gray.600" fontStyle="italic">
                                            no members at this campus
                                        </Text>
                                    ) : (
                                        <InlineList gap={1} aria-label={`${c.name} people`}>
                                            {members.map((m, i) => (
                                                <ListEntry key={`${m.name}-${i}`} whiteSpace="nowrap" title={m.title || undefined}>
                                                    <PersonName
                                                        person={m}
                                                        campusAbbrev={campusAbbrev}
                                                        color="gray.700"
                                                        suffix={i < members.length - 1 ? ',' : ''}
                                                    />
                                                </ListEntry>
                                            ))}
                                        </InlineList>
                                    )}
                                </HStack>
                                {/* The indicators behind the stake count, each linking to its goal view */}
                                {(c.stakes || []).length > 0 && (
                                    <InlineList gap={1} rowGap={1} mt={1} aria-label={`${c.name} indicator stakes`}>
                                        {c.stakes.map((s) => {
                                            const chip = {
                                                fontFamily: 'mono',
                                                fontSize: '11px',
                                                px: 1.5,
                                                borderWidth: '1px',
                                                borderColor: 'gray.300',
                                                borderRadius: 'sm',
                                                bg: 'white',
                                                whiteSpace: 'nowrap',
                                                title: s.success_indicator || undefined,
                                            };
                                            return (
                                                <ListEntry key={s.composite_key}>
                                                {campusAbbrev ? (
                                                <Link
                                                    as={RouterLink}
                                                    to={getGoalViewUrlFromCompositeKey(s.composite_key, campusAbbrev)}
                                                    aria-label={`${s.composite_key}: ${s.success_indicator || ''}`}
                                                    color="teal.700"
                                                    _hover={{ textDecoration: 'underline', borderColor: 'teal.500' }}
                                                    _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
                                                    {...chip}
                                                >
                                                    {s.composite_key}
                                                </Link>
                                            ) : (
                                                <Text color="gray.700" {...chip}>
                                                    {s.composite_key}
                                                </Text>
                                                )}
                                                </ListEntry>
                                            );
                                        })}
                                    </InlineList>
                                )}
                            </Box>
                            );
                        })}
                    </StackList>
                    {hidden > 0 && (
                        <Button size="xs" variant="outline" colorScheme="teal" bg="white" mt={1.5} onClick={() => setShowAll(true)}>
                            + {hidden} more
                        </Button>
                    )}
                    {showAll && communities.length > COLLAPSED_COUNT && (
                        <Button size="xs" variant="outline" colorScheme="teal" bg="white" mt={1.5} onClick={() => setShowAll(false)}>
                            Show fewer
                        </Button>
                    )}
                </>
            )}
        </Box>
    );
}

export default WgCommunitiesSection;
