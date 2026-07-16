import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    List,
    ListItem,
    Select,
    Text,
    VStack,
} from '@chakra-ui/react';
import { getPlanStatusColor, getPlanStatusLabel } from '../../styles/planStatusColors';

// Lifecycle-aligned status ordering — "fresh" first, terminal states last.
const STATUS_ORDER = {
    'In Progress': 0,
    'Not Started': 1,
    'On Hold': 2,
    'Completed': 3,
    'Abandoned': 4,
};

// Fixed working-group sections, in display order. Keys match the web-safe
// values getAllPlans() stamps onto plan.workingGroup (workingGroupWebSafe).
const WG_SECTIONS = [
    { key: 'procurement', label: 'Procurement' },
    { key: 'web', label: 'Web' },
    { key: 'instructional-materials', label: 'Instructional Materials' },
];

const SORT_OPTIONS = [
    { value: 'name', label: 'Name (A→Z)' },
    { value: 'status', label: 'Status' },
    { value: 'campus', label: 'Campus plans first' },
];

/**
 * Reusable selectable plan list for the 1/3 column of the plans split view.
 * Caller owns the plans array and the selection callback so the same list
 * can be reused elsewhere.
 *
 * Props:
 *   plans              Array of plan objects (already filtered by year-scope
 *                      and dedup-ed by the parent — see PlansAccomplishmentsManager.getAllPlans).
 *   selectedId         unique_id of the currently selected plan, or null.
 *   onSelect(plan)     Called with the full plan object when a row is clicked.
 *   emptyMessage       Shown when plans is empty. Defaults to a neutral msg.
 */
function PlansList({ plans = [], selectedId, onSelect, emptyMessage = 'No plans to show.' }) {
    const [sortBy, setSortBy] = useState('name');
    // Default view: only plans actively being worked. The `abandoned` flag
    // overrides plan_status (same rule as getPlanStatusLabel).
    const [inProgressOnly, setInProgressOnly] = useState(true);

    const sorted = useMemo(() => {
        const arr = inProgressOnly
            ? plans.filter((p) => !p.abandoned && (p.plan_status || 'Not Started') === 'In Progress')
            : [...plans];
        if (sortBy === 'status') {
            arr.sort((a, b) => {
                // `abandoned` flag should land in the Abandoned bucket even
                // if plan_status doesn't say so.
                const aKey = a.abandoned ? 'Abandoned' : (a.plan_status || 'Not Started');
                const bKey = b.abandoned ? 'Abandoned' : (b.plan_status || 'Not Started');
                const aRank = STATUS_ORDER[aKey] ?? 99;
                const bRank = STATUS_ORDER[bKey] ?? 99;
                if (aRank !== bRank) return aRank - bRank;
                return (a.name || '').localeCompare(b.name || '');
            });
        } else if (sortBy === 'campus') {
            arr.sort((a, b) => {
                const aCampus = a.is_campus_plan ? 0 : 1;
                const bCampus = b.is_campus_plan ? 0 : 1;
                if (aCampus !== bCampus) return aCampus - bCampus;
                return (a.name || '').localeCompare(b.name || '');
            });
        } else {
            arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        return arr;
    }, [plans, sortBy, inProgressOnly]);

    // Bucket the sorted plans into the three fixed working-group sections.
    // Anything with an unrecognized workingGroup lands in a trailing "Other"
    // section (only rendered when non-empty) so no plan silently disappears.
    const sections = useMemo(() => {
        const known = WG_SECTIONS.map((s) => ({
            ...s,
            plans: sorted.filter((p) => p.workingGroup === s.key),
        }));
        const knownKeys = new Set(WG_SECTIONS.map((s) => s.key));
        const leftover = sorted.filter((p) => !knownKeys.has(p.workingGroup));
        if (leftover.length > 0) {
            known.push({ key: 'other', label: 'Other', plans: leftover });
        }
        return known;
    }, [sorted]);

    if (!plans || plans.length === 0) {
        return (
            <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                {emptyMessage}
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <HStack spacing={2}>
                <Text fontSize="xs" color="gray.600" fontWeight="semibold" flexShrink={0}>
                    Sort by
                </Text>
                <Select
                    size="sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort plans by"
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    flexShrink={0}
                    colorScheme="blue"
                    variant={inProgressOnly ? 'solid' : 'outline'}
                    onClick={() => setInProgressOnly((v) => !v)}
                    aria-pressed={inProgressOnly}
                >
                    In Progress Only
                </Button>
            </HStack>

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
            >
                {sorted.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                        {emptyMessage}
                    </Box>
                ) : (
                    sections.map((section) => (
                        <Box key={section.key}>
                            {/* Section header — sticky so the group stays labeled while scrolling */}
                            <HStack
                                position="sticky"
                                top={0}
                                zIndex={1}
                                px={3}
                                py={2}
                                bg="gray.50"
                                borderBottomWidth="1px"
                                borderBottomColor="gray.200"
                                justify="space-between"
                                align="center"
                            >
                                <Heading
                                    as="h3"
                                    size="xs"
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                    color="teal.700"
                                >
                                    {section.label}
                                </Heading>
                                <Text fontSize="2xs" fontWeight="semibold" color="gray.600">
                                    {section.plans.length}
                                </Text>
                            </HStack>

                            {section.plans.length === 0 ? (
                                <Box px={3} py={2.5} color="gray.600" fontSize="xs" fontStyle="italic">
                                    No plans
                                </Box>
                            ) : (
                                <List spacing={0} aria-label={`${section.label} plans`}>
                                    {section.plans.map((plan) => {
                                        const isSelected = plan.unique_id === selectedId;
                                        const statusColor = getPlanStatusColor(plan);
                                        const statusLabel = getPlanStatusLabel(plan);
                                        return (
                                            <ListItem
                                                key={plan.unique_id}
                                                px={3}
                                                py={2.5}
                                                cursor="pointer"
                                                bg={statusColor.bg}
                                                borderLeftWidth="6px"
                                                borderLeftColor={statusColor.solid}
                                                borderTopWidth="1px"
                                                borderTopColor="gray.300"
                                                borderBottomWidth="1px"
                                                borderBottomColor="gray.300"
                                                boxShadow={isSelected ? 'inset 0 0 0 1px var(--chakra-colors-teal-500)' : 'none'}
                                                _hover={{ filter: 'brightness(0.96)' }}
                                                onClick={() => onSelect && onSelect(plan)}
                                            >
                                                {/* Title */}
                                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={2}>
                                                    {plan.name || '(untitled)'}
                                                </Text>

                                                {/* Meta row: quiet status text + key/campus flags */}
                                                <HStack justify="space-between" align="center" mt={1.5}>
                                                    <Text
                                                        fontSize="2xs"
                                                        fontWeight="bold"
                                                        textTransform="uppercase"
                                                        letterSpacing="wide"
                                                        color={statusColor.fg}
                                                    >
                                                        {statusLabel}
                                                    </Text>
                                                    <HStack spacing={1.5}>
                                                        {plan.is_key_plan && (
                                                            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">Key</Badge>
                                                        )}
                                                        {plan.is_campus_plan && (
                                                            <Badge colorScheme="green" variant="subtle" fontSize="2xs">Campus</Badge>
                                                        )}
                                                    </HStack>
                                                </HStack>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </Box>
                    ))
                )}
            </Box>
        </VStack>
    );
}

export default PlansList;
