import React, { useState } from 'react';
import { Badge, Box, Button, HStack, Text, VStack } from '@chakra-ui/react';

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

/**
 * The people band of a working-group card: the WGP's group leads on top as
 * their own area, then a vertical stack of community-of-practice boxes — the
 * communities whose indicator stakes land in this working group (strongest fit
 * first), each with its explicit members. The broader body of people derives
 * from the working group itself, so the boxes stay lead-sized by design.
 *
 * Props:
 *   leads          [{unique_id, name}] — the WGP's group_leads
 *   onManageLeads  opens the manage-leads modal (owned by the card)
 *   communities    [{name, stake_count, leads: [{name, campus, title, note}]}]
 *   accentColor    the working group's accent (campusPlanConfig)
 *   campusAbbrev   current campus — the roster shows ONLY this campus's members
 *                  (communities are cross-campus; a campus plan is not)
 */
function WgCommunitiesSection({ leads = [], onManageLeads, communities = [], accentColor, campusAbbrev }) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? communities : communities.slice(0, COLLAPSED_COUNT);
    const hidden = communities.length - visible.length;

    return (
        <Box px={5} py={3} borderBottomWidth="1px" borderColor="gray.100">
            {/* Leads — their own area on top */}
            <HStack spacing={3} flexWrap="wrap">
                <Text {...MICRO}>Leads</Text>
                {leads.length === 0 ? (
                    <Text fontSize="13px" color="gray.600" fontStyle="italic">none</Text>
                ) : (
                    leads.map((l) => (
                        <HStack key={l.unique_id} spacing={1}>
                            <Avatar name={l.name} />
                            <Text fontSize="13px" color="gray.600" whiteSpace="nowrap">{l.name}</Text>
                        </HStack>
                    ))
                )}
                <Box flex="1" minW="12px" />
                <Button size="xs" variant="outline" colorScheme="teal" onClick={onManageLeads}>Manage</Button>
            </HStack>

            {/* Communities of practice — vertical stack, strongest fit first */}
            {communities.length > 0 && (
                <>
                    <Text {...MICRO} mt={3} mb={1.5}>
                        Communities of Practice ({communities.length})
                    </Text>
                    <VStack align="stretch" spacing={1.5}>
                        {visible.map((c) => {
                            const allMembers = c.leads || [];
                            // Campus context: only this campus's members. A member with no
                            // campus recorded stays visible — a missing works_at_campus edge
                            // is a data gap, not evidence they work elsewhere.
                            const members = campusAbbrev
                                ? allMembers.filter((m) => !m.campus || m.campus === campusAbbrev)
                                : allMembers;
                            return (
                            <Box
                                key={c.name}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderLeftWidth="3px"
                                borderLeftColor={accentColor}
                                borderRadius="md"
                                bg="gray.50"
                                px={3}
                                py={1.5}
                            >
                                <HStack spacing={2} flexWrap="wrap">
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.800" whiteSpace="nowrap">
                                        {c.name}
                                    </Text>
                                    <Badge colorScheme="gray" variant="subtle" fontSize="2xs" flexShrink={0}>
                                        {c.stake_count} stake{c.stake_count === 1 ? '' : 's'}
                                    </Badge>
                                    {allMembers.length === 0 ? (
                                        <Text fontSize="13px" color="gray.500" fontStyle="italic">
                                            no members recorded — people derive from the working group
                                        </Text>
                                    ) : members.length === 0 ? (
                                        <Text fontSize="13px" color="gray.500" fontStyle="italic">
                                            no members at this campus
                                        </Text>
                                    ) : (
                                        members.map((m, i) => (
                                            <HStack key={`${m.name}-${i}`} spacing={1} whiteSpace="nowrap">
                                                <Text fontSize="13px" color="gray.700">
                                                    {m.name}{i < members.length - 1 ? ',' : ''}
                                                </Text>
                                            </HStack>
                                        ))
                                    )}
                                </HStack>
                            </Box>
                            );
                        })}
                    </VStack>
                    {hidden > 0 && (
                        <Button size="xs" variant="ghost" colorScheme="teal" mt={1.5} onClick={() => setShowAll(true)}>
                            + {hidden} more
                        </Button>
                    )}
                    {showAll && communities.length > COLLAPSED_COUNT && (
                        <Button size="xs" variant="ghost" colorScheme="teal" mt={1.5} onClick={() => setShowAll(false)}>
                            Show fewer
                        </Button>
                    )}
                </>
            )}
        </Box>
    );
}

export default WgCommunitiesSection;
