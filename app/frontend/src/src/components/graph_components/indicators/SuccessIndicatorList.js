import React from 'react';
import { Box, VStack, HStack, Text, Badge, Icon, Tooltip } from '@chakra-ui/react';
import { FaUser, FaListUl, FaRegComment, FaCheckCircle } from 'react-icons/fa';
import { getIndicatorSummary, getStatusColor } from './indicatorHelpers';

// Compact count chip (icon + number) used in each row.
const CountChip = ({ icon, count, label, zeroColor = 'gray.300' }) => (
    <Tooltip label={`${count} ${label}`} openDelay={400}>
        <HStack spacing={1} color={count > 0 ? 'gray.600' : zeroColor}>
            <Icon as={icon} boxSize={2.5} />
            <Text fontSize="2xs" fontWeight="medium">{count}</Text>
        </HStack>
    </Tooltip>
);

/**
 * Left column of the goal view: one row per success indicator, with the overview badges
 * (status, counts, review/year flags). Selection is owned by the parent.
 *
 * Props: indicators (sorted wrappers), selectedKey, onSelect(compositeKey)
 */
function SuccessIndicatorList({ indicators = [], selectedKey, onSelect }) {
    if (indicators.length === 0) {
        return (
            <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white">
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No success indicators for this goal.</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={1.5}>
            {indicators.map((wrapper) => {
                const s = getIndicatorSummary(wrapper);
                const isSelected = s.compositeKey === selectedKey;
                return (
                    <Box
                        key={s.compositeKey}
                        onClick={() => onSelect && onSelect(s.compositeKey)}
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
                        transition="all 0.15s"
                    >
                        <HStack justify="space-between" align="center" mb={1}>
                            <HStack spacing={2} minW="0">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800" fontFamily="mono">
                                    {s.compositeKey}
                                </Text>
                                {s.approved && (
                                    <Tooltip label="Admin review complete" openDelay={400}>
                                        <span><Icon as={FaCheckCircle} color="green.500" boxSize={3} /></span>
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
