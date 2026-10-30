import React, { useEffect, useRef } from 'react';
import { Badge, Box, Button, Heading, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { getStatusColor } from '../../../graph_components/indicators/indicatorHelpers';
import { IndicatorMetaRow, IndicatorWarningFlags } from '../../../graph_components/indicators/IndicatorFlags';
import { STATUS_LEVELS_ORDER } from '../../../../services/utils/statusColors';
import { statusCounts } from './evidenceDeck';
import { T } from '../../presentScale';

// Review state as an edge colour: yellow = ready for review, green = approved.
// Any of the evidence warnings the expanded rail spells out.
const hasEvidenceWarning = (s) => Boolean(
    s && (s.flagMissingImplementation || s.allImplsRetired || s.undocumentedImplCount > 0 || s.noActiveDocs)
);
const reviewEdge = (s) => (s?.approved ? 'green.400' : s?.readyForReview ? 'yellow.400' : 'transparent');

/**
 * The evidence deck's left rail: the working group's goals, each with its
 * status counts, and the indicators under each goal. Collapsed, it becomes a
 * strip of indicator keys so the report and the editor take the width.
 *
 * Props:
 *   sections     [{ goalNumber, goalName, items: [{ key, summary }] }]
 *   slides       The same items, flat, in deck order (for the counter).
 *   selectedKey  Composite key on stage; onSelect(item).
 *   collapsed    Boolean; onToggle() flips it.
 */
function IndicatorRail({ sections = [], slides = [], selectedKey, onSelect, collapsed = false, onToggle }) {
    const position = Math.max(0, slides.findIndex((s) => s.key === selectedKey)) + 1;

    // Keep the indicator on stage visible as j / k walks the list.
    const selectedRef = useRef(null);
    useEffect(() => {
        selectedRef.current?.scrollIntoView?.({ block: 'nearest' });
    }, [selectedKey, collapsed]);

    if (collapsed) {
        return (
            <VStack as="nav" aria-label="Indicators" spacing={1} py={2} px={1} h="100%" overflowY="auto" bg="white"
                    borderRightWidth="1px" borderColor="gray.200">
                <Button size="xs" variant="outline" bg="white" colorScheme="teal" onClick={onToggle}
                        aria-label="Expand the indicator list" title="Expand ([)" mb={1}>
                    <ChevronRightIcon />
                </Button>
                {slides.map((item) => {
                    const selected = item.key === selectedKey;
                    return (
                        <Button
                            key={item.key}
                            ref={selected ? selectedRef : undefined}
                            size="xs"
                            w="56px"
                            px={1}
                            variant={selected ? 'solid' : 'outline'}
                            colorScheme="teal"
                            bg={selected ? undefined : 'white'}
                            borderLeftWidth="4px"
                            borderLeftColor={reviewEdge(item.summary)}
                            onClick={() => onSelect(item)}
                            aria-label={hasEvidenceWarning(item.summary) ? `${item.key}, has evidence warnings` : item.key}
                            aria-current={selected ? 'true' : undefined}
                            title={item.summary?.description}
                        >
                            {item.goalNumber}.{item.indicatorNumber}
                            {hasEvidenceWarning(item.summary) && <Text as="span" color="orange.500" ml={0.5} aria-hidden="true">⚠</Text>}
                        </Button>
                    );
                })}
            </VStack>
        );
    }

    return (
        <Box as="nav" aria-label="Indicators" h="100%" display="flex" flexDirection="column" bg="white"
             borderRightWidth="1px" borderColor="gray.200" minW="0">
            <HStack px={3} py={2} borderBottomWidth="1px" borderColor="gray.200" justify="space-between">
                <Heading as="h2" fontSize={T.section} textTransform="uppercase" letterSpacing="wide" color="teal.700">
                    Indicators
                </Heading>
                <HStack spacing={2}>
                    <Text fontSize={T.meta} color="gray.700" fontWeight="semibold" aria-live="polite">
                        {slides.length ? `${position} / ${slides.length}` : '0 indicators'}
                    </Text>
                    <Button size="xs" variant="outline" bg="white" colorScheme="teal" onClick={onToggle}
                            aria-label="Collapse the indicator list" title="Collapse ([)">
                        <ChevronLeftIcon />
                    </Button>
                </HStack>
            </HStack>

            <Box flex="1" minH="0" overflowY="auto">
                {sections.length === 0 && (
                    <Text p={3} fontSize={T.body} color="gray.600">No indicators match.</Text>
                )}
                {sections.map((section) => (
                    <Box key={section.goalNumber} as="section" aria-label={`Goal ${section.goalNumber}`}>
                        <Box px={3} pt={3} pb={2} bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                            <Heading as="h3" fontSize={T.meta} color="gray.800" fontWeight="bold">
                                Goal {section.goalNumber}
                                {section.goalName && (
                                    <Text as="span" fontWeight="normal" color="gray.700">: {section.goalName}</Text>
                                )}
                            </Heading>
                            <Wrap spacing={1} mt={1}>
                                {statusCounts(section.items, STATUS_LEVELS_ORDER).map(({ level, count }) => {
                                    const value = section.items.find((i) => (i.summary?.statusLevel || 'No status') === level)?.summary?.statusValue;
                                    return (
                                        <WrapItem key={level}>
                                            <Badge colorScheme={getStatusColor(value)} fontSize={T.section} borderRadius="full" px={2}>
                                                {count} {level}
                                            </Badge>
                                        </WrapItem>
                                    );
                                })}
                            </Wrap>
                        </Box>
                        <VStack as="ul" listStyleType="none" m={0} p={0} spacing={0} align="stretch">
                            {section.items.map((item) => {
                                const s = item.summary || {};
                                const selected = item.key === selectedKey;
                                return (
                                    <Box as="li" key={item.key}>
                                        <Box
                                            as="button"
                                            type="button"
                                            ref={selected ? selectedRef : undefined}
                                            w="100%"
                                            textAlign="left"
                                            px={3}
                                            py={2}
                                            borderLeftWidth="5px"
                                            borderLeftColor={reviewEdge(s)}
                                            borderBottomWidth="1px"
                                            borderBottomColor="gray.100"
                                            bg={selected ? 'teal.50' : 'white'}
                                            _hover={{ bg: selected ? 'teal.50' : 'gray.50' }}
                                            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
                                            onClick={() => onSelect(item)}
                                            aria-current={selected ? 'true' : undefined}
                                        >
                                            <HStack justify="space-between" spacing={2}>
                                                <Text fontFamily="mono" fontSize={T.meta} fontWeight="bold" color="gray.800">{item.key}</Text>
                                                <Badge colorScheme={getStatusColor(s.statusValue)} fontSize={T.section} borderRadius="full" px={2}>
                                                    {s.statusLevel || 'No status'}
                                                </Badge>
                                            </HStack>
                                            <Text fontSize={T.meta} color="gray.700" noOfLines={2} mt={0.5}>{s.description}</Text>
                                            {/* The dashboard list's badges, plus the report table's External count. */}
                                            <IndicatorWarningFlags s={s} fontSize={T.section} showExternal mt={1.5} />
                                            <Box mt={1.5}>
                                                <IndicatorMetaRow s={s} fontSize={T.section} iconSize={3} />
                                            </Box>
                                            {s.approved && (
                                                <Text fontSize={T.section} fontWeight="bold" color="green.700" mt={0.5}>Approved</Text>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </VStack>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default IndicatorRail;
