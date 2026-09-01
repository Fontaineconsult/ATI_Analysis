import React from 'react';
import { Box, HStack, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';

function StatCard({ label, value, help, accent, numberColor, active, clickable, onClick }) {
    return (
        <Box
            flex="1"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow={active ? '0 0 0 2px var(--chakra-colors-teal-500)' : 'sm'}
            p={4}
            borderTopWidth="3px"
            borderTopColor={accent}
            cursor={clickable ? 'pointer' : 'default'}
            onClick={clickable ? onClick : undefined}
            onKeyDown={clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
            } : undefined}
            transition="box-shadow 0.15s, border-color 0.15s"
            _hover={clickable ? { borderColor: 'gray.300' } : undefined}
            _focusVisible={clickable ? { outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '1px' } : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-pressed={clickable && active !== undefined ? active : undefined}
        >
            <Stat>
                <StatLabel fontSize="xs" color="gray.600" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color={numberColor || 'gray.800'}>{value}</StatNumber>
                {help && <StatHelpText fontSize="xs" color="gray.600" mb={0}>{help}</StatHelpText>}
            </Stat>
        </Box>
    );
}

/**
 * Diagnostic strip for the Documentation area (design-sense §3.2). Counts come
 * from summarizeDocumentation() in the container, and the last three tiles double
 * as filters — so every number is produced by the same predicate that produces
 * the list behind it.
 *
 * Lead tile order is deliberate:
 *   Documentation      — the neutral total; clicking clears the filter.
 *   ⚠ Dead but in report — the only number that is unambiguously WRONG: a
 *                         deprecated, dead-linked or unreachable record that a
 *                         published report still shows.
 *   ⚠ Orphans          — nothing points at it, counting every relationship type,
 *                         not just is_documented_by.
 *   Shared             — attached to more than one record, so editing it reaches
 *                         further than the record you are looking at.
 */
function DocumentationStatStrip({
    total = 0,
    deadButInReport = 0,
    orphaned = 0,
    shared = 0,
    loading = false,
    activeFilter = 'all',
    onFilterChange,
}) {
    const v = (n) => (loading ? '…' : n);

    const toggleFilter = (key) => {
        if (!onFilterChange) return;
        onFilterChange(activeFilter === key ? 'all' : key);
    };
    const clearFilter = () => {
        if (onFilterChange && activeFilter !== 'all') onFilterChange('all');
    };

    return (
        <HStack spacing={4} mb={4} align="stretch">
            <StatCard
                label="Documentation"
                value={v(total)}
                help="all records, every campus and year"
                accent="teal.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="⚠ Dead but in report"
                value={v(deadButInReport)}
                help="deprecated or unreachable, still published — click to filter"
                accent="red.500"
                numberColor={!loading && deadButInReport > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'deadButInReport'}
                onClick={() => toggleFilter('deadButInReport')}
            />
            <StatCard
                label="⚠ Orphans"
                value={v(orphaned)}
                help="nothing points at them — click to filter"
                accent="orange.400"
                numberColor={!loading && orphaned > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'orphaned'}
                onClick={() => toggleFilter('orphaned')}
            />
            <StatCard
                label="Shared"
                value={v(shared)}
                help="attached to more than one record — click to filter"
                accent="purple.400"
                clickable
                active={activeFilter === 'shared'}
                onClick={() => toggleFilter('shared')}
            />
        </HStack>
    );
}

export default DocumentationStatStrip;
