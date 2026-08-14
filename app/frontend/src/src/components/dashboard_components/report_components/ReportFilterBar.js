import React from 'react';
import { Box, Button, Flex, HStack, Icon, Text, VisuallyHidden } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { INDICATOR_FILTERS, TREND_OPTIONS } from './reportFilters';

/**
 * The active-filter bar above the SI report.
 *
 * Present only when something is filtering. Its job is to make a narrowed report
 * impossible to mistake for the whole one: a report showing 12 of 122 indicators with
 * no explanation reads as missing data rather than as an answer. Filters arrive from
 * three different places — the tiles far up the page, the control row just above, and
 * a pasted link — so this is the one spot that states all of them together.
 *
 * Each filter is its own removable chip rather than only a "clear all": narrowing to
 * zero is usually one filter too many, and the fix is to drop that one.
 */

const trendLabel = (key) => TREND_OPTIONS.find((t) => t.key === key)?.label || key;

/** Flatten the filter state into removable chips, in a stable reading order. */
export function buildChips(state, handlers) {
    const chips = [];
    if (state.q) {
        chips.push({ id: `q:${state.q}`, label: `“${state.q}”`, remove: () => handlers.onSearch('') });
    }
    (state.attention || []).forEach((key) => {
        const f = INDICATOR_FILTERS[key];
        if (f) chips.push({ id: `a:${key}`, label: f.label, remove: () => handlers.onToggleAttention(key) });
    });
    (state.status || []).forEach((value) => {
        chips.push({ id: `s:${value}`, label: `Status: ${value}`, remove: () => handlers.onToggleStatus(value) });
    });
    (state.trend || []).forEach((value) => {
        chips.push({ id: `t:${value}`, label: `Trend: ${trendLabel(value)}`, remove: () => handlers.onToggleTrend(value) });
    });
    return chips;
}

function ReportFilterBar({ state, onToggleAttention, onToggleStatus, onToggleTrend, onSearch, onClear, shown, total }) {
    const chips = buildChips(state, { onToggleAttention, onToggleStatus, onToggleTrend, onSearch });
    if (chips.length === 0) return null;

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

                {chips.map((chip) => (
                    <Button
                        key={chip.id}
                        size="xs"
                        variant="solid"
                        colorScheme="teal"
                        borderRadius="full"
                        rightIcon={<Icon as={X} boxSize={3} aria-hidden="true" />}
                        onClick={chip.remove}
                        aria-label={`Remove filter: ${chip.label}`}
                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.600', outlineOffset: '2px' }}
                    >
                        {chip.label}
                    </Button>
                ))}

                <HStack spacing={3} ml="auto">
                    {/* The count is the point of the bar — it is what turns "some rows are
                        missing" into "this is the answer to what you asked". */}
                    <Text fontSize="xs" color={none ? 'orange.800' : 'gray.700'}>
                        {none ? (
                            <>No indicators match {chips.length > 1 ? 'all of these filters' : 'this filter'}</>
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

            {chips.length > 1 ? (
                <Text fontSize="2xs" color="gray.600" mt={2}>
                    Indicators must match every filter shown. Within Status or Trend, any of the
                    chosen values counts.
                </Text>
            ) : null}
        </Box>
    );
}

export default ReportFilterBar;
