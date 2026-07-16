import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    HStack,
    IconButton,
    Spinner,
    Text,
    Tooltip,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { unassignPersonAsImplementor } from '../../../services/api/put';
import { getStatusColor, getStatusBackgroundColor } from '../../../services/utils/statusColors';

/**
 * Read + unassign view of the YSEs a person implements, grouped by campus →
 * working group (inferred from the indicator composite_key suffix). Each row
 * surfaces the implementation nodes attached to the YSE so the reader can see
 * "what is this person actually working on". Compact rows; inline icon remove.
 *
 * Props:
 *   yses             Enriched YSE objects from get_person_implementation_details.
 *   personEmployeeId Required for the unassign action.
 *   onChange()       Called after a successful unassign so the parent refetches.
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
                title: 'Removed from YSE', description: yse.year_identifier,
                status: 'success', duration: 2000, isClosable: true, position: 'top-right',
            });
            if (onChange) await onChange();
        } catch (error) {
            toast({
                title: 'Failed to unassign', description: error?.message || 'Please try again.',
                status: 'error', duration: 3000, isClosable: true, position: 'top-right',
            });
        } finally {
            setPendingId(null);
        }
    };

    if (!yses || yses.length === 0) {
        return <Text fontSize="xs" color="gray.600" fontStyle="italic">Not assigned to any YSEs.</Text>;
    }

    return (
        <VStack align="stretch" spacing={3}>
            {grouped.map((campusGroup) => (
                <Box key={campusGroup.campusKey}>
                    <HStack mb={2} spacing={2} align="center">
                        <Badge colorScheme="teal" variant="outline" textTransform="uppercase" fontSize="2xs">
                            {campusGroup.campusAbbrev || '—'}
                        </Badge>
                        <Text fontSize="2xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">
                            {campusGroup.campusName || 'Unknown campus'}
                        </Text>
                    </HStack>

                    <VStack align="stretch" spacing={2}>
                        {campusGroup.workingGroups.map((wg) => (
                            <Box key={wg.name}>
                                <Text fontSize="2xs" color="teal.700" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                                    {wg.name}
                                </Text>
                                <VStack align="stretch" spacing={1}>
                                    {wg.yses.map((yse) => (
                                        <HStack
                                            key={yse.year_identifier}
                                            align="start"
                                            spacing={2}
                                            px={2}
                                            py={1.5}
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                        >
                                            <VStack align="stretch" spacing={1} flex="1" minW={0}>
                                                <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                    <Text fontFamily="mono" fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        {yse.indicator_composite_key || yse.year_identifier}
                                                    </Text>
                                                    {yse.status_level && (
                                                        <Badge
                                                            bg={getStatusBackgroundColor(yse.status_level)}
                                                            color={getStatusColor(yse.status_level)}
                                                            fontSize="2xs"
                                                            px={2}
                                                            borderRadius="md"
                                                        >
                                                            {yse.status_level}
                                                        </Badge>
                                                    )}
                                                    {yse.administrative_review_complete && (
                                                        <Badge colorScheme="green" variant="subtle" fontSize="2xs">reviewed</Badge>
                                                    )}
                                                </HStack>
                                                {yse.indicator_description && (
                                                    <Text fontSize="2xs" color="gray.600" noOfLines={1}>{yse.indicator_description}</Text>
                                                )}
                                                {Array.isArray(yse.implementations) && yse.implementations.length > 0 && (
                                                    <Wrap spacing={1}>
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
                                            <Tooltip label="Remove implementor assignment">
                                                <IconButton
                                                    aria-label="Remove implementor assignment"
                                                    icon={pendingId === yse.year_identifier ? <Spinner size="xs" /> : <CloseIcon boxSize={2} />}
                                                    size="xs"
                                                    variant="ghost"
                                                    colorScheme="gray"
                                                    flexShrink={0}
                                                    isDisabled={pendingId !== null}
                                                    onClick={() => handleUnassign(yse)}
                                                />
                                            </Tooltip>
                                        </HStack>
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
