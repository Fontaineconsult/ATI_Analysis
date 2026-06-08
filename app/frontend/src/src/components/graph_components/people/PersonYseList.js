import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Spacer,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { unassignPersonAsImplementor } from '../../../services/api/put';
import { getStatusColor, getStatusBackgroundColor } from '../../../services/utils/statusColors';

/**
 * Read + unassign view of the YSEs a person is linked to as implementor.
 * Groups by campus → working group (inferred from the indicator composite_key
 * suffix, e.g. "7.6-web"). Each row surfaces the implementation nodes
 * attached to the YSE via :is_evidence_for so the reader can see "what is
 * this person actually working on".
 *
 * Props:
 *   yses                Array of enriched YSE objects from
 *                       get_person_implementation_details.
 *   personEmployeeId    Required for the unassign action.
 *   onChange()          Called after a successful unassign so the parent
 *                       can refetch.
 */
function PersonYseList({ yses = [], personEmployeeId, onChange }) {
    const [pendingId, setPendingId] = useState(null);
    const toast = useToast();

    const grouped = useMemo(() => groupByCampusWorkingGroup(yses), [yses]);

    const handleUnassign = async (yse) => {
        setPendingId(yse.year_identifier);
        try {
            await unassignPersonAsImplementor(personEmployeeId, yse.year_identifier);
            toast({
                title: 'Removed from YSE',
                description: yse.year_identifier,
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            if (onChange) await onChange();
        } catch (error) {
            toast({
                title: 'Failed to unassign',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setPendingId(null);
        }
    };

    if (!yses || yses.length === 0) {
        return (
            <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">
                Not assigned to any YSEs.
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4}>
            {grouped.map((campusGroup) => (
                <Box
                    key={campusGroup.campusKey}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    p={4}
                >
                    <HStack mb={3} spacing={2} align="baseline">
                        <Badge colorScheme="teal" textTransform="uppercase" fontSize="xs" px={2} py={1} borderRadius="md">
                            {campusGroup.campusAbbrev || '—'}
                        </Badge>
                        <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                            {campusGroup.campusName || 'Unknown campus'}
                        </Heading>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                        {campusGroup.workingGroups.map((wg) => (
                            <Box key={wg.name}>
                                <Text fontSize="xs" color="teal.700" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                                    {wg.name}
                                </Text>
                                <VStack align="stretch" spacing={2} pl={2}>
                                    {wg.yses.map((yse) => (
                                        <Box
                                            key={yse.year_identifier}
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                            borderRadius="lg"
                                            p={3}
                                            bg="gray.50"
                                        >
                                            <HStack align="start">
                                                <VStack align="stretch" spacing={1} flex="1">
                                                    <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                        <Text fontFamily="mono" fontSize="xs" color="gray.700" fontWeight="bold">
                                                            {yse.indicator_composite_key || yse.year_identifier}
                                                        </Text>
                                                        {yse.status_level && (
                                                            <Badge
                                                                bg={getStatusBackgroundColor(yse.status_level)}
                                                                color={getStatusColor(yse.status_level)}
                                                                fontSize="2xs"
                                                                px={2}
                                                                py={0.5}
                                                                borderRadius="md"
                                                            >
                                                                {yse.status_level}
                                                            </Badge>
                                                        )}
                                                        {yse.administrative_review_complete && (
                                                            <Badge colorScheme="green" variant="subtle" fontSize="2xs">
                                                                reviewed
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                    {yse.indicator_description && (
                                                        <Text fontSize="xs" color="gray.700">
                                                            {yse.indicator_description}
                                                        </Text>
                                                    )}
                                                    {Array.isArray(yse.implementations) && yse.implementations.length > 0 && (
                                                        <Wrap spacing={1} pt={1}>
                                                            {yse.implementations.map((impl) => (
                                                                <WrapItem key={impl.unique_id || `${impl.type}-${impl.title}`}>
                                                                    <Badge colorScheme="orange" variant="outline" fontSize="2xs">
                                                                        {impl.type}: {impl.title}
                                                                    </Badge>
                                                                </WrapItem>
                                                            ))}
                                                        </Wrap>
                                                    )}
                                                </VStack>
                                                <Spacer />
                                                <Button
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => handleUnassign(yse)}
                                                    isLoading={pendingId === yse.year_identifier}
                                                    isDisabled={pendingId !== null}
                                                >
                                                    Remove
                                                </Button>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
}

// Composite key format observed elsewhere: "7.6-web" → working group = "web".
// Falls back to "Other" when the suffix is missing or unrecognized.
function inferWorkingGroupFromCompositeKey(compositeKey) {
    if (!compositeKey) return 'Other';
    const suffix = compositeKey.split('-').slice(1).join('-').trim().toLowerCase();
    if (suffix === 'web') return 'Web';
    if (suffix === 'ins' || suffix === 'instructional-materials' || suffix === 'instructional materials') return 'Instructional Materials';
    if (suffix === 'pro' || suffix === 'procurement') return 'Procurement';
    return suffix ? suffix.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Other';
}

function groupByCampusWorkingGroup(yses) {
    const byCampus = new Map();
    for (const yse of yses) {
        const campusAbbrev = yse.campus?.abbreviation || '__no_campus__';
        const campusKey = campusAbbrev;
        if (!byCampus.has(campusKey)) {
            byCampus.set(campusKey, {
                campusKey,
                campusAbbrev: yse.campus?.abbreviation || null,
                campusName: yse.campus?.name || null,
                workingGroupMap: new Map(),
            });
        }
        const entry = byCampus.get(campusKey);
        const wgName = inferWorkingGroupFromCompositeKey(yse.indicator_composite_key);
        if (!entry.workingGroupMap.has(wgName)) {
            entry.workingGroupMap.set(wgName, { name: wgName, yses: [] });
        }
        entry.workingGroupMap.get(wgName).yses.push(yse);
    }
    return Array.from(byCampus.values()).map((c) => ({
        ...c,
        workingGroups: Array.from(c.workingGroupMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export default PersonYseList;
