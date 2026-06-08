import React, { useEffect, useRef, useState } from 'react';
import { Box, VStack, HStack, Text, Badge, Icon, Tooltip } from '@chakra-ui/react';
import { FaUser, FaListUl, FaRegComment, FaCheckCircle } from 'react-icons/fa';
import { getIndicatorSummary, getStatusColor } from './indicatorHelpers';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';

// Compact count chip (icon + number) used in each row. aria-hidden because the
// row's own aria-label carries the screen-reader summary; the chips are a sighted
// at-a-glance overview.
const CountChip = ({ icon, count, label, zeroColor = 'gray.300' }) => (
    <Tooltip label={`${count} ${label}`} openDelay={400}>
        <HStack spacing={1} color={count > 0 ? 'gray.600' : zeroColor} aria-hidden="true">
            <Icon as={icon} boxSize={2.5} />
            <Text fontSize="2xs" fontWeight="medium">{count}</Text>
        </HStack>
    </Tooltip>
);

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
    const itemRefs = useRef([]);
    const selectedIndex = Math.max(
        0,
        indicators.findIndex((w) => getIndicatorSummary(w).compositeKey === selectedKey),
    );
    const [focusedIndex, setFocusedIndex] = useState(selectedIndex);

    // Keep the roving tab stop on the selected row when selection changes elsewhere
    // (e.g. a deep link), and clamp if the list shrinks. Does not move actual focus,
    // so it never steals focus on load.
    useEffect(() => {
        setFocusedIndex(selectedIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedKey, indicators.length]);

    if (indicators.length === 0) {
        return (
            <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No success indicators for this goal.</Text>
            </Box>
        );
    }

    const focusItem = (i) => {
        const clamped = Math.max(0, Math.min(i, indicators.length - 1));
        setFocusedIndex(clamped);
        itemRefs.current[clamped]?.focus();
    };

    const handleKeyDown = (e, index, compositeKey) => {
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); focusItem(index + 1); break;
            case 'ArrowUp': e.preventDefault(); focusItem(index - 1); break;
            case 'Home': e.preventDefault(); focusItem(0); break;
            case 'End': e.preventDefault(); focusItem(indicators.length - 1); break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (onSelect) onSelect(compositeKey);
                break;
            default: break;
        }
    };

    return (
        <VStack role="listbox" aria-label="Success indicators" align="stretch" spacing={1.5}>
            {indicators.map((wrapper, index) => {
                const s = getIndicatorSummary(wrapper);
                const isSelected = s.compositeKey === selectedKey;
                return (
                    <Box
                        key={s.compositeKey}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        role="option"
                        aria-selected={isSelected}
                        aria-label={`Indicator ${s.compositeKey}, ${s.statusLevel || 'no evidence'}${s.description ? `: ${s.description}` : ''}`}
                        tabIndex={index === focusedIndex ? 0 : -1}
                        onClick={() => { setFocusedIndex(index); if (onSelect) onSelect(s.compositeKey); }}
                        onFocus={() => setFocusedIndex(index)}
                        onKeyDown={(e) => handleKeyDown(e, index, s.compositeKey)}
                        cursor="pointer"
                        bg="white"
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

                        <HStack justify="space-between" align="center">
                            <HStack spacing={3}>
                                <CountChip icon={FaUser} count={s.personCount} label="responsible persons" zeroColor="red.500" />
                                <CountChip icon={FaListUl} count={s.implCount} label="implementations" />
                                <CountChip icon={FaRegComment} count={s.annotationCount} label="annotations" />
                            </HStack>
                            <HStack spacing={1}>
                                {s.readyForReview && !s.approved && (
                                    <Badge colorScheme="yellow" variant="subtle" fontSize="2xs">Ready</Badge>
                                )}
                                {s.workedThisYear && (
                                    <Tooltip label="Worked on this year" openDelay={400}>
                                        <Badge colorScheme="teal" variant="subtle" fontSize="2xs">This yr</Badge>
                                    </Tooltip>
                                )}
                                {s.nextYear && (
                                    <Tooltip label="Planned for next year" openDelay={400}>
                                        <Badge colorScheme="blue" variant="subtle" fontSize="2xs">Next yr</Badge>
                                    </Tooltip>
                                )}
                            </HStack>
                        </HStack>
                    </Box>
                );
            })}
        </VStack>
    );
}

export default SuccessIndicatorList;
