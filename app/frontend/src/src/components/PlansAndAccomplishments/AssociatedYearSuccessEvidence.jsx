import React, { useContext } from 'react';
import {
    Badge,
    Box,
    HStack,
    Text,
    VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';
import { getEditUrlFromCompositeKey } from '../../services/utils/tools';

// Local color mapping for ATI StatusLevel values. Returns Chakra colorScheme
// keys (not hex) because Chakra <Badge colorScheme> expects names. Distinct
// from services/utils/statusColors.js which returns hex codes for inline CSS.
function getStatusColor(status) {
    switch (status) {
        case 'Optimized':   return 'green';
        case 'Managed':     return 'blue';
        case 'Established': return 'cyan';
        case 'Defined':     return 'yellow';
        case 'Initiated':   return 'orange';
        case 'Not Started': return 'red';
        default:            return 'gray';
    }
}

/**
 * Sidebar listing the Year Success Evidence nodes a plan furthers. Uses
 * DataContext to walk the working group → goal → indicator → evidence tree
 * and find every evidence that contains this plan in its `plans` array.
 *
 * The first item is highlighted as PRIMARY (most recent year by default,
 * since the list is sorted desc by yearIdentifier).
 *
 * Props:
 *   plan       The plan object. Must have `workingGroup` and `unique_id`.
 */
function AssociatedYearSuccessEvidence({ plan }) {
    const { data } = useContext(DataContext);
    const navigate = useNavigate();
    const { campus } = useParams();

    // Mirrors the click handler in ImplementationTypeOverview.js — builds the
    // explorer URL via the shared helper, navigates, and scrolls the hash
    // target into view with one retry. Don't reinvent here.
    const handleYseClick = (compositeKey) => {
        if (!compositeKey) return;
        const editUrl = getEditUrlFromCompositeKey(compositeKey, campus);
        const [pathname, hash] = editUrl.split('#');
        navigate(pathname + (hash ? '#' + hash : ''));
        if (!hash) return;
        setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            setTimeout(() => {
                const retry = document.getElementById(hash);
                if (retry) retry.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }, 100);
    };

    const relatedEvidences = React.useMemo(() => {
        if (!plan?.unique_id) return [];
        const wg = plan.workingGroup;
        const evidences = [];

        if (data?.[wg]?.goals) {
            data[wg].goals.forEach((goal) => {
                if (goal.indicators) {
                    goal.indicators.forEach((indicatorObj) => {
                        if (indicatorObj.evidences) {
                            indicatorObj.evidences.forEach((evidence) => {
                                const planExists = evidence.plans?.some(
                                    (p) => p.properties?.unique_id === plan.unique_id,
                                );
                                if (planExists && evidence.evidence?.properties) {
                                    evidences.push({
                                        yearIdentifier: evidence.evidence.properties.year_identifier,
                                        uniqueId: evidence.evidence.properties.unique_id,
                                        indicatorKey: indicatorObj.indicator?.properties?.composite_key,
                                        indicatorDescription: indicatorObj.indicator?.properties?.success_indicator,
                                        goalNumber: goal.goal?.properties?.goal_number,
                                        statusLevel: evidence.statusLevel?.properties?.status_level,
                                        planCount: evidence.plans?.length || 0,
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        return evidences.sort((a, b) => (b.yearIdentifier || '').localeCompare(a.yearIdentifier || ''));
    }, [plan, data]);

    return (
        <Box maxHeight="50vh" overflowY="auto">
            {relatedEvidences.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {relatedEvidences.map((evidence, index) => (
                        <Box
                            key={evidence.uniqueId}
                            p={2}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={index === 0 ? 'teal.400' : 'gray.300'}
                            bg={index === 0 ? 'teal.50' : 'white'}
                            boxShadow={index === 0 ? 'sm' : 'none'}
                            transition="all 0.2s"
                            _hover={{ boxShadow: 'sm', borderColor: index === 0 ? 'teal.500' : 'gray.400' }}
                        >
                            <HStack justify="space-between" mb={1}>
                                <Text
                                    fontWeight="bold"
                                    color={index === 0 ? 'teal.800' : 'gray.800'}
                                    fontSize="sm"
                                    cursor="pointer"
                                    _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                                    onClick={() => handleYseClick(evidence.indicatorKey)}
                                    role="link"
                                    title="Open in the explorer"
                                >
                                    {evidence.yearIdentifier}
                                </Text>
                                <HStack spacing={1}>
                                    {index === 0 && (
                                        <Badge colorScheme="teal" fontSize="xs">PRIMARY</Badge>
                                    )}
                                    {evidence.statusLevel && (
                                        <Badge colorScheme={getStatusColor(evidence.statusLevel)} fontSize="xs">
                                            {evidence.statusLevel}
                                        </Badge>
                                    )}
                                </HStack>
                            </HStack>
                            <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                                {evidence.indicatorKey}
                            </Text>
                            <Text color="gray.600" fontSize="xs" mt={1}>
                                {evidence.indicatorDescription}
                            </Text>
                            <HStack mt={2} justify="space-between">
                                <Text color="gray.500" fontSize="xs">
                                    Goal {evidence.goalNumber}
                                </Text>
                                {evidence.planCount > 1 && (
                                    <Text color="purple.600" fontSize="xs" fontWeight="semibold">
                                        {evidence.planCount} plans total
                                    </Text>
                                )}
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="sm" color="gray.700" textAlign="center" mt={4}>
                    This plan is not associated with any Year Success Evidence
                </Text>
            )}
        </Box>
    );
}

export default AssociatedYearSuccessEvidence;
