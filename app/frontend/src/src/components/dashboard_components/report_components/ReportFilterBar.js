import React from 'react';
import { Box, Button, Flex, HStack, Icon, Text, VisuallyHidden } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { INDICATOR_FILTERS } from './reportFilters';

/**
 * The active-filter bar above the SI report.
 *
 * Present only when something is filtering. Its job is to make a narrowed report
 * impossible to mistake for the whole one: the stat tiles show state by tint, which is
 * easy to miss after scrolling past them, and a report showing 12 of 122 indicators
 * with no explanation reads as missing data rather than as an answer.
 *
 * Each active filter is its own removable button rather than one "clear all" — with AND
 * semantics, narrowing to zero is usually one filter too many, and the fix is to drop
 * that one, not start over.
 */
function ReportFilterBar({ activeFilters = [], onRemove, onClear, shown, total }) {
    if (!activeFilters.length) return null;

    const none = shown === 0;

    return (
        <Box
            role="status"
            aria-live="polite"
            bg={none ? 'orange.50' : 'teal.50'}
            borderWidth="1px"
            borderColor={none ? 'orange.200' : 'teal.200'}
            borderRadius="lg"
            px={4}
            py={3}
            mb={4}
        >
            <Flex align="center" gap={3} wrap="wrap">
                <Text fontSize="xs" color="gray.700" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                    Filtered
                </Text>

                {activeFilters.map((key) => {
                    const f = INDICATOR_FILTERS[key];
                    if (!f) return null;
                    return (
                        <Button
                            key={key}
                            size="xs"
                            variant="solid"
                            colorScheme="teal"
                            borderRadius="full"
                            rightIcon={<Icon as={X} boxSize={3} aria-hidden="true" />}
                            onClick={() => onRemove(key)}
                            aria-label={`Remove filter: ${f.label}`}
                            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.600', outlineOffset: '2px' }}
                        >
                            {f.label}
                        </Button>
                    );
                })}

                <HStack spacing={3} ml="auto">
                    {/* The count is the point of the bar — it is what turns "some rows are
                        missing" into "this is the answer to what you asked". */}
                    <Text fontSize="xs" color={none ? 'orange.800' : 'gray.700'}>
                        {none ? (
                            <>No indicators match {activeFilters.length > 1 ? 'all of these filters' : 'this filter'}</>
                        ) : (
                            <>
                                Showing <Text as="span" fontWeight="semibold">{shown}</Text> of {total} indicators
                            </>
                        )}
                    </Text>
                    <Button size="xs" variant="ghost" colorScheme="teal" onClick={onClear}>
                        Clear all
                        <VisuallyHidden> filters</VisuallyHidden>
                    </Button>
                </HStack>
            </Flex>

            {activeFilters.length > 1 ? (
                <Text fontSize="2xs" color="gray.600" mt={2}>
                    Indicators must match every active filter.
                </Text>
            ) : null}
        </Box>
    );
}

export default ReportFilterBar;
