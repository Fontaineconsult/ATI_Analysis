import React from 'react';
import { Box, Button, Heading, HStack, List, ListItem, Text, VStack } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { WORKING_GROUP_LIST, getWorkingGroupIdentity } from '../../../../styles/workingGroupIdentity';
import { getPlanStatusColor, getPlanStatusLabel } from '../../../../styles/planStatusColors';
import { T } from '../../presentScale';

/**
 * The meeting's agenda: the plans on deck, attention-first, grouped by
 * working group, with a position counter so the room knows how far along
 * the meeting is. Rows carry only what a shared screen can read: name,
 * status, open and overdue counts, and the no-next-step flag.
 *
 * Collapsed, it becomes a strip of numbered buttons so the stage can take
 * the width. Selection is an APG listbox per section (Enter / Space); the
 * global j / k shortcuts step through the same order.
 *
 * The header carries one toggle per campus: the deck shows every campus's
 * plans by default and any campus can be switched off, down to one.
 *
 * Props:
 *   plans            Ordered plan objects (the shell has already filtered and sorted).
 *   selectedId       unique_id of the plan on stage.
 *   onSelect(plan)
 *   collapsed        Boolean; onToggle() flips it.
 *   campusOptions    [{ abbreviation, name }] from settings.
 *   selectedCampuses Abbreviations currently shown; onToggleCampus(abbrev) flips one.
 */
function AgendaRail({
    plans = [], selectedId, onSelect, collapsed = false, onToggle,
    campusOptions = [], selectedCampuses = [], onToggleCampus,
}) {
    const multiCampus = selectedCampuses.length > 1;
    const position = Math.max(0, plans.findIndex((p) => p.unique_id === selectedId)) + 1;

    if (collapsed) {
        return (
            <VStack as="nav" aria-label="Agenda" spacing={1} py={2} px={1} h="100%" overflowY="auto" bg="white"
                    borderRightWidth="1px" borderColor="gray.200">
                <Button size="xs" variant="outline" bg="white" colorScheme="teal" onClick={onToggle}
                        aria-label="Expand the agenda" title="Expand the agenda ([)" mb={1}>
                    <ChevronRightIcon />
                </Button>
                {plans.map((plan, i) => {
                    const selected = plan.unique_id === selectedId;
                    const status = getPlanStatusColor(plan);
                    return (
                        <Button
                            key={plan.unique_id}
                            size="sm"
                            w="40px"
                            variant={selected ? 'solid' : 'outline'}
                            colorScheme="teal"
                            bg={selected ? undefined : 'white'}
                            borderLeftWidth="4px"
                            borderLeftColor={status.solid}
                            onClick={() => onSelect && onSelect(plan)}
                            aria-label={`${i + 1}. ${plan.name || 'untitled plan'}`}
                            aria-current={selected ? 'true' : undefined}
                            title={plan.name}
                        >
                            {i + 1}
                        </Button>
                    );
                })}
            </VStack>
        );
    }

    const sections = WORKING_GROUP_LIST
        .map((w) => ({ key: w.slug, label: w.name, plans: plans.filter((p) => p.workingGroup === w.slug) }))
        .filter((s) => s.plans.length > 0);
    const known = new Set(WORKING_GROUP_LIST.map((w) => w.slug));
    const other = plans.filter((p) => !known.has(p.workingGroup));
    if (other.length) sections.push({ key: 'other', label: 'Other', plans: other });

    // Running index so the counter and the collapsed strip agree.
    let running = 0;

    return (
        <Box as="nav" aria-label="Agenda" h="100%" display="flex" flexDirection="column" bg="white"
             borderRightWidth="1px" borderColor="gray.200" minW="0">
            <HStack px={3} py={2} borderBottomWidth="1px" borderColor="gray.200" justify="space-between">
                <Heading as="h2" fontSize={T.section} textTransform="uppercase" letterSpacing="wide" color="teal.700">
                    Agenda
                </Heading>
                <HStack spacing={2}>
                    <Text fontSize={T.meta} color="gray.700" fontWeight="semibold" aria-live="polite">
                        {plans.length ? `${position} / ${plans.length}` : '0 plans'}
                    </Text>
                    <Button size="xs" variant="outline" bg="white" colorScheme="teal" onClick={onToggle}
                            aria-label="Collapse the agenda" title="Collapse the agenda ([)">
                        <ChevronLeftIcon />
                    </Button>
                </HStack>
            </HStack>

            {campusOptions.length > 1 && (
                <HStack px={3} py={1.5} spacing={1.5} borderBottomWidth="1px" borderColor="gray.200" bg="gray.50"
                        role="group" aria-label="Campuses shown" wrap="wrap">
                    {campusOptions.map((c) => {
                        const on = selectedCampuses.includes(c.abbreviation);
                        const last = on && selectedCampuses.length === 1;
                        return (
                            <Button
                                key={c.abbreviation}
                                size="xs"
                                variant={on ? 'solid' : 'outline'}
                                colorScheme="teal"
                                bg={on ? undefined : 'white'}
                                onClick={() => onToggleCampus && onToggleCampus(c.abbreviation)}
                                aria-pressed={on}
                                cursor={last ? 'default' : 'pointer'}
                                title={last ? `${c.name} (at least one campus stays on)` : c.name}
                                textTransform="uppercase"
                            >
                                {c.abbreviation}
                            </Button>
                        );
                    })}
                </HStack>
            )}

            <Box flex="1" overflowY="auto" minH="0">
                {plans.length === 0 && (
                    <Text p={4} fontSize={T.body} color="gray.700" fontStyle="italic">
                        No plans in progress for the campuses and working group shown.
                    </Text>
                )}
                {sections.map((section) => {
                    const identity = getWorkingGroupIdentity(section.key);
                    return (
                        <Box key={section.key}>
                            <HStack position="sticky" top={0} zIndex={1} px={3} py={1.5} bg="gray.100"
                                    borderBottomWidth="1px" borderColor="gray.300" justify="space-between">
                                <HStack spacing={2}>
                                    <Box w="8px" h="8px" borderRadius="full" bg={identity.accent} aria-hidden="true" />
                                    <Heading as="h3" fontSize={T.section} textTransform="uppercase" letterSpacing="wide" color="teal.700">
                                        {section.label}
                                    </Heading>
                                </HStack>
                                <Text fontSize={T.meta} fontWeight="semibold" color="gray.700">{section.plans.length}</Text>
                            </HStack>
                            <List role="listbox" aria-label={`${section.label} plans`} spacing={0}>
                                {section.plans.map((plan) => {
                                    running += 1;
                                    const index = running;
                                    const selected = plan.unique_id === selectedId;
                                    const status = getPlanStatusColor(plan);
                                    const overdue = plan.tasks_overdue || 0;
                                    return (
                                        <ListItem
                                            key={plan.unique_id}
                                            role="option"
                                            aria-selected={selected}
                                            tabIndex={0}
                                            px={3} py={3}
                                            cursor="pointer"
                                            bg={selected ? 'teal.50' : 'white'}
                                            borderLeftWidth="6px"
                                            borderLeftColor={selected ? 'teal.500' : status.solid}
                                            borderBottomWidth="1px"
                                            borderBottomColor="gray.200"
                                            _hover={{ bg: selected ? 'teal.50' : 'gray.50' }}
                                            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
                                            onClick={() => onSelect && onSelect(plan)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    if (onSelect) onSelect(plan);
                                                }
                                            }}
                                        >
                                            <HStack align="start" spacing={2}>
                                                <Text fontSize={T.meta} color="gray.700" fontWeight="semibold" minW="1.6em" pt="0.15em">
                                                    {index}.
                                                </Text>
                                                <Box flex="1" minW="0">
                                                    <Text fontSize={T.body} fontWeight={selected ? 'bold' : 'medium'}
                                                          color="gray.800" lineHeight="1.3" noOfLines={3}>
                                                        {plan.name || '(untitled plan)'}
                                                    </Text>
                                                    <HStack spacing={3} mt={1} wrap="wrap">
                                                        <Text fontSize={T.meta} fontWeight="bold" textTransform="uppercase"
                                                              letterSpacing="wide" color={status.fg}>
                                                            {getPlanStatusLabel(plan)}
                                                        </Text>
                                                        <Text fontSize={T.meta} color="gray.700">
                                                            {plan.tasks_open || 0} open
                                                        </Text>
                                                        {overdue > 0 && (
                                                            <Text fontSize={T.meta} color="red.700" fontWeight="semibold">
                                                                {overdue} overdue
                                                            </Text>
                                                        )}
                                                        {plan.no_next_step && (
                                                            <Text fontSize={T.meta} color="orange.800" fontWeight="semibold">
                                                                no next step
                                                            </Text>
                                                        )}
                                                        {multiCampus && (plan.campuses || []).length > 0 && (
                                                            <Text fontSize={T.meta} color="gray.700" textTransform="uppercase"
                                                                  letterSpacing="wide" aria-label={`Campuses: ${plan.campuses.join(', ')}`}>
                                                                {plan.campuses.join(' · ')}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                </Box>
                                            </HStack>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

export default AgendaRail;
