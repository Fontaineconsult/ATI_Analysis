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
 * Diagnostic strip for the People area (design-sense §3.2). Counts come from
 * summarizePeople in the container; the last three tiles double as roster
 * filters — clicking toggles activeFilter, the active tile shows a teal ring,
 * and the neutral tile clears. Filter state lives in PeopleMasterContainer so
 * the counts always agree with the list.
 *
 *   Active People       — every active person (neutral; clears the filter).
 *   Approvers           — can sign off YSEs (governance capacity).
 *   ⚠ No working group  — on no ATI working group (unaffiliated).
 *   ⚠ Role not in PD    — holds a role missing from their position
 *                         description (the invisible-labor signal).
 */
function PeopleStatStrip({
    total = 0,
    approvers = 0,
    noWorkingGroup = 0,
    roleNotInPd = 0,
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
                label="Active People"
                value={v(total)}
                help="active in the ATI"
                accent="teal.400"
                clickable
                onClick={clearFilter}
            />
            <StatCard
                label="Approvers"
                value={v(approvers)}
                help="can sign off YSEs — click to filter"
                accent="purple.400"
                clickable
                active={activeFilter === 'approvers'}
                onClick={() => toggleFilter('approvers')}
            />
            <StatCard
                label="⚠ No working group"
                value={v(noWorkingGroup)}
                help="not on any committee — click to filter"
                accent="orange.400"
                numberColor={!loading && noWorkingGroup > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'noWorkingGroup'}
                onClick={() => toggleFilter('noWorkingGroup')}
            />
            <StatCard
                label="⚠ Role not in PD"
                value={v(roleNotInPd)}
                help="invisible labor — click to filter"
                accent="red.500"
                numberColor={!loading && roleNotInPd > 0 ? 'red.600' : undefined}
                clickable
                active={activeFilter === 'roleNotInPd'}
                onClick={() => toggleFilter('roleNotInPd')}
            />
        </HStack>
    );
}

export default PeopleStatStrip;
