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
 * Diagnostic strip for the Communities tab (design-sense §3.2). The empty-
 * communities tile doubles as a list filter; the membership-coverage tiles are
 * informational (people are managed on the People tab and per community below).
 *
 *   Communities          — every community of practice (neutral; clears filter).
 *   In a community       — active people belonging to at least one.
 *   ⚠ Empty communities  — no members yet — click to filter.
 *   ⚠ People in none     — active people in no community (coverage gap).
 */
function CommunitiesStatStrip({
    total = 0,
    peopleInCommunity = 0,
    emptyCommunities = 0,
    peopleInNone = 0,
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
                label="Communities"
                value={v(total)}
                help="cross-campus practice areas"
                accent="teal.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="In a community"
                value={v(peopleInCommunity)}
                help="active people in ≥ 1"
                accent="purple.400"
            />
            <StatCard
                label="⚠ Empty communities"
                value={v(emptyCommunities)}
                help="no members yet — click to filter"
                accent="orange.400"
                numberColor={!loading && emptyCommunities > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'empty'}
                onClick={() => toggleFilter('empty')}
            />
            <StatCard
                label="⚠ People in none"
                value={v(peopleInNone)}
                help="active people unaffiliated"
                accent="red.500"
                numberColor={!loading && peopleInNone > 0 ? 'red.600' : undefined}
            />
        </HStack>
    );
}

export default CommunitiesStatStrip;
