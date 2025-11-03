import React, { useContext, useMemo } from 'react';
import {
    Box,
    VStack,
    Text,
    Checkbox,
    CheckboxGroup,
    Stack,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import { DataContext } from '../../context/DataContext';

/**
 * Reusable Year Success Evidence (YSE) Checkbox Selector Component
 *
 * @param {Array} value - Array of selected YSE identifiers
 * @param {Function} onChange - Callback function when selection changes
 * @param {boolean} isDisabled - Whether the checkboxes should be disabled
 * @param {string} label - Optional custom label (defaults to "Related Year Success Indicators (Select All That Apply)")
 * @param {number} maxHeight - Optional max height for scrollable area (defaults to 200px)
 * @param {boolean} showCount - Whether to show the count of selected items (defaults to true)
 */
function YSECheckboxSelector({
    value = [],
    onChange,
    isDisabled = false,
    label = "Related Year Success Indicators (Select All That Apply)",
    maxHeight = 200,
    showCount = true
}) {
    const { data } = useContext(DataContext);

    // Memoize the expensive YSE extraction to avoid recalculation on every render
    const availableYSEs = useMemo(() => {
        const yses = [];
        const seenIdentifiers = new Set();

        // Check the new data structure with yearSuccessEvidence (primary source)
        if (data.yearSuccessEvidence) {
            Object.entries(data.yearSuccessEvidence).forEach(([year, yseList]) => {
                if (Array.isArray(yseList)) {
                    yseList.forEach(yse => {
                        if (yse.year_identifier && !seenIdentifiers.has(yse.year_identifier)) {
                            seenIdentifiers.add(yse.year_identifier);
                            yses.push({
                                identifier: yse.year_identifier,
                                year: year,
                                indicatorNumber: yse.indicator_number,
                                indicatorDescription: yse.success_indicator,
                                workingGroup: yse.working_group || 'Unknown'
                            });
                        }
                    });
                }
            });
        }

        // ALSO check the legacy structure from goals/indicators/evidences
        // This ensures we get ALL available YSEs from both sources
        ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
            if (data[wg]?.goals) {
                data[wg].goals.forEach(goal => {
                    if (goal.indicators) {
                        goal.indicators.forEach(indicator => {
                            if (indicator.evidences) {
                                indicator.evidences.forEach(evidence => {
                                    const identifier = evidence.evidence?.properties?.year_identifier;
                                    if (identifier && !seenIdentifiers.has(identifier)) {
                                        seenIdentifiers.add(identifier);
                                        yses.push({
                                            identifier: identifier,
                                            workingGroup: wg,
                                            goalNumber: goal.goal?.properties?.goal_number,
                                            indicatorKey: indicator.indicator?.properties?.composite_key,
                                            indicatorDescription: indicator.indicator?.properties?.success_indicator
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // Sort by identifier for consistency
        return yses.sort((a, b) => {
            // First sort by year if available
            if (a.year && b.year && a.year !== b.year) {
                return b.year.localeCompare(a.year); // Newest first
            }
            // Then by identifier
            return a.identifier.localeCompare(b.identifier);
        });
    }, [data]);

    return (
        <FormControl>
            {label && (
                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                    {label}
                </FormLabel>
            )}
            <Box
                maxHeight={`${maxHeight}px`}
                overflowY="auto"
                borderWidth="1px"
                borderColor="gray.300"
                borderRadius="md"
                p={2}
                bg="white"
            >
                {availableYSEs.length > 0 ? (
                    <CheckboxGroup
                        value={value}
                        onChange={onChange}
                        isDisabled={isDisabled}
                    >
                        <Stack spacing={2}>
                            {availableYSEs.map(yse => (
                                <Checkbox
                                    key={yse.identifier}
                                    value={yse.identifier}
                                    size="sm"
                                    colorScheme="teal"
                                >
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="semibold">
                                            {yse.identifier}
                                        </Text>
                                        {yse.indicatorDescription && (
                                            <Text fontSize="xs" color="gray.600">
                                                {yse.indicatorNumber && `${yse.indicatorNumber}. `}
                                                {yse.indicatorDescription}
                                            </Text>
                                        )}
                                    </VStack>
                                </Checkbox>
                            ))}
                        </Stack>
                    </CheckboxGroup>
                ) : (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                        No Year Success Indicators available
                    </Text>
                )}
            </Box>
            {showCount && value.length > 0 && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                    {value.length} indicator{value.length !== 1 ? 's' : ''} selected
                </Text>
            )}
        </FormControl>
    );
}

export default YSECheckboxSelector;