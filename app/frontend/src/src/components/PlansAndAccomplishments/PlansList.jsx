import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
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

    const sorted = useMemo(() => {
        const arr = [...plans];
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
    }, [plans, sortBy]);

    if (!plans || plans.length === 0) {
        return (
            <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">
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
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            </HStack>

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                overflowY="auto"
                flex="1"
                maxH="75vh"
            >
                {sorted.length === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">
                        {emptyMessage}
                    </Box>
                ) : (
                    <List spacing={0}>
                        {sorted.map((plan) => {
                            const isSelected = plan.unique_id === selectedId;
                            const statusColor = getPlanStatusColor(plan);
                            const statusLabel = getPlanStatusLabel(plan);
                            return (
                                <ListItem
                                    key={plan.unique_id}
                                    p={0}
                                    cursor="pointer"
                                    bg={isSelected ? 'teal.50' : 'white'}
                                    borderLeftWidth="3px"
                                    borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                    borderBottomWidth="1px"
                                    borderBottomColor="gray.100"
                                    _hover={{ bg: isSelected ? 'teal.50' : 'gray.50' }}
                                    onClick={() => onSelect && onSelect(plan)}
                                >
                                    {/* Status band — full-width, colored per status */}
                                    <Box
                                        px={3}
                                        py={1}
                                        bg={statusColor.bg}
                                        color={statusColor.fg}
                                        borderLeftWidth="3px"
                                        borderLeftColor={statusColor.solid}
                                    >
                                        <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                                            {statusLabel}
                                        </Text>
                                    </Box>

                                    {/* Body */}
                                    <Box px={3} py={2.5}>
                                        {/* Title */}
                                        <Box pb={2} mb={2} borderBottomWidth="1px" borderBottomColor={isSelected ? 'teal.100' : 'gray.100'}>
                                            <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={2}>
                                                {plan.name || '(untitled)'}
                                            </Text>
                                        </Box>

                                        {/* Single line: WG on left, key/campus flags on right */}
                                        <HStack justify="space-between" align="center">
                                            {plan.workingGroup ? (
                                                <Badge colorScheme="teal" variant="subtle" fontSize="2xs" textTransform="uppercase">
                                                    {plan.workingGroup}
                                                </Badge>
                                            ) : (
                                                <Box />
                                            )}
                                            <HStack spacing={1.5}>
                                                {plan.is_key_plan && (
                                                    <Badge colorScheme="purple" variant="subtle" fontSize="2xs">Key</Badge>
                                                )}
                                                {plan.is_campus_plan && (
                                                    <Badge colorScheme="green" variant="subtle" fontSize="2xs">Campus</Badge>
                                                )}
                                            </HStack>
                                        </HStack>
                                    </Box>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>
        </VStack>
    );
}

export default PlansList;
