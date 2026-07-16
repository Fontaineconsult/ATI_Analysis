import React from 'react';
import { Box, HStack, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';

import { summarizeCampusPlan, STALE_DAYS } from './campusPlanConfig';

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
            transition="box-shadow 0.15s, border-color 0.15s"
            _hover={clickable ? { borderColor: 'gray.300' } : undefined}
            role={clickable ? 'button' : undefined}
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
 * Diagnostic strip for the Campus Plan area (design handoff v2 §2). Five tiles;
 * counts rolled up from the loaded plan via summarizeCampusPlan. The last two
 * (⚠ At-Risk, Stale) double as row filters: clicking toggles activeFilter
 * ('risk' | 'stale'); the active tile shows a teal ring. Clicking any neutral
 * tile clears the filter. Filter state itself lives in CampusPlanContainer.
 */
function CampusPlanStatStrip({ plan, loading = false, activeFilter = 'all', onFilterChange }) {
    const { workingGroups, prioritizedIndicators, plans, atRisk, stale } = summarizeCampusPlan(plan);
    const v = (n) => (loading ? '…' : n);

    const toggleFilter = (key) => {
        if (!onFilterChange) return;
        onFilterChange(activeFilter === key ? 'all' : key);
    };
    const clearFilter = () => {
        if (onFilterChange && activeFilter !== 'all') onFilterChange('all');
    };

    return (
        <HStack spacing={4} mb={6} align="stretch">
            <StatCard
                label="Working Groups"
                value={v(workingGroups)}
                help="incl. Steering (oversight)"
                accent="teal.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="Prioritized Indicators"
                value={v(prioritizedIndicators)}
                help="across all groups"
                accent="purple.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="Plans"
                value={v(plans)}
                help="campus-plan plans"
                accent="teal.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="⚠ At-Risk"
                value={v(atRisk)}
                help="at-risk / failing — click to filter"
                accent="orange.400"
                numberColor={!loading && atRisk > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'risk'}
                onClick={() => toggleFilter('risk')}
            />
            <StatCard
                label={`Stale > ${STALE_DAYS}d`}
                value={v(stale)}
                help="no recent update — click to filter"
                accent="red.500"
                numberColor={!loading && stale > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'stale'}
                onClick={() => toggleFilter('stale')}
            />
        </HStack>
    );
}

export default CampusPlanStatStrip;
