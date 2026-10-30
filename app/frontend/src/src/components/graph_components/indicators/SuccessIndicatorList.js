import React from 'react';
import { Box, VStack, HStack, Text, Badge, Icon, Tooltip } from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { getIndicatorSummary, getStatusColor } from './indicatorHelpers';
import { IndicatorMetaRow, IndicatorWarningFlags } from './IndicatorFlags';
import { strengthConfig } from '../implementation/implementationConfig';
import { reviewWashClass } from '../../../styles/reviewWash';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import useListboxNavigation from '../../../hooks/useListboxNavigation';

/**
 * Left column of the goal view: one row per success indicator, with the overview badges
 * (status, counts, review/year flags). Selection is owned by the parent.
 *
 * Keyboard model — an ARIA listbox with roving tabindex: the list takes a single tab
 * stop (the selected row, else the first), and Up/Down/Home/End move focus between
 * options while Enter/Space selects the focused one. Moving focus does NOT select, so
 * arrowing through the list doesn't thrash the detail panel / URL.
 *
 * Props: indicators (sorted wrappers), selectedKey, onSelect(compositeKey)
 */
function SuccessIndicatorList({ indicators = [], selectedKey, onSelect }) {
    // Keyboard contract lives in the shared hook (APG Listbox — this component
    // was the reference implementation it was extracted from).
    const { getItemProps } = useListboxNavigation({
        itemCount: indicators.length,
        selectedIndex: indicators.findIndex((w) => getIndicatorSummary(w).compositeKey === selectedKey),
        onActivate: (i) => onSelect && onSelect(getIndicatorSummary(indicators[i]).compositeKey),
    });

    if (indicators.length === 0) {
        return (
            <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
                <Text fontSize="sm" color="gray.600" fontStyle="italic">No success indicators for this goal.</Text>
            </Box>
        );
    }

    return (
        <VStack role="listbox" aria-label="Success indicators" align="stretch" spacing={1.5}>
            {indicators.map((wrapper, index) => {
                const s = getIndicatorSummary(wrapper);
                const isSelected = s.compositeKey === selectedKey;
                return (
                    <Box
                        key={s.compositeKey}
                        {...getItemProps(index)}
                        role="option"
                        aria-selected={isSelected}
                        aria-label={`Indicator ${s.compositeKey}, ${s.statusLevel || 'no evidence'}${s.implCount > 0 ? `, evidence strength ${strengthConfig(s.maxStrength)?.label || 'unrated'}` : ''}${s.description ? `: ${s.description}` : ''}`}
                        onClick={() => { if (onSelect) onSelect(s.compositeKey); }}
                        cursor="pointer"
                        /* Review-state wash from the right edge (bgColor, not bg,
                           so the gradient background-image survives). */
                        className={reviewWashClass('right', s)}
                        bgColor="white"
                        borderWidth="1px"
                        borderColor={isSelected ? 'teal.400' : 'gray.200'}
                        borderLeftWidth="3px"
                        borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                        borderRadius="md"
                        boxShadow="sm"
                        px={3}
                        py={1.5}
                        _hover={{ borderColor: isSelected ? 'teal.400' : 'gray.300', boxShadow: 'md' }}
                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '1px' }}
                        transition="all 0.15s"
                    >
                        <HStack justify="space-between" align="center" mb={1}>
                            <HStack spacing={2} minW="0">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800" fontFamily="mono">
                                    {s.compositeKey}
                                </Text>
                                {s.approved && (
                                    <Tooltip label="Admin review complete" openDelay={400}>
                                        <span><Icon as={FaCheckCircle} color="green.500" boxSize={3} aria-hidden="true" /></span>
                                    </Tooltip>
                                )}
                            </HStack>
                            {s.statusLevel ? (
                                <Badge colorScheme={getStatusColor(s.statusValue)} fontSize="2xs" borderRadius="full" px={2}>
                                    {s.statusLevel}
                                </Badge>
                            ) : (
                                <Badge colorScheme="gray" variant="outline" fontSize="2xs" borderRadius="full" px={2}>
                                    No evidence
                                </Badge>
                            )}
                        </HStack>

                        <Box mt={1} mb={2}>
                            <StatusLevelLadder level={s.statusLevel} variant="compact" />
                        </Box>

                        {s.description && (
                            <Text fontSize="xs" color="gray.600" noOfLines={2} mb={2}>{s.description}</Text>
                        )}

                        <IndicatorWarningFlags s={s} mb={2} />

                        <IndicatorMetaRow s={s} />
                    </Box>
                );
            })}
        </VStack>
    );
}

export default SuccessIndicatorList;
