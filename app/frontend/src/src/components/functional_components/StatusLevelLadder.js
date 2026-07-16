import React from 'react';
import { Box, HStack, Text, Tooltip } from '@chakra-ui/react';
import {
    getStatusColor,
    getStatusBackgroundColor,
    getStatusTextColor,
    STATUS_LEVELS_ORDER,
} from '../../services/utils/statusColors';

/**
 * Maturity ladder — the six status_levels rendered in progression order with the
 * current level emphasized and earlier levels shown as achieved. Makes the CMM
 * status legible as a *position on a journey* rather than a single label:
 *
 *   Not Started → Initiated → ((Defined)) → Established → Managed → Optimizing
 *
 * Reuses the shared color helpers (statusColors.js) so the rung colors match the
 * status pills/badges used elsewhere.
 *
 * Props:
 *   level    Current achieved status_level NAME (e.g. "Defined"); null/'' renders
 *            the "no evidence" state (all rungs empty/gray).
 *   variant  'compact' — a thin segmented heat-ramp bar for dense list rows (the
 *                        current rung is taller; per-rung tooltips).
 *            'full'    — a labeled stepper with arrows for detail headers (the
 *                        current rung is bold + ring-emphasized).
 */
function StatusLevelLadder({ level, variant = 'compact' }) {
    const total = STATUS_LEVELS_ORDER.length;
    const currentIndex = level ? STATUS_LEVELS_ORDER.indexOf(level) : -1;
    const ariaLabel = currentIndex >= 0
        ? `Maturity: ${level} (level ${currentIndex + 1} of ${total})`
        : 'Maturity: no evidence';

    if (variant === 'full') {
        return (
            <HStack spacing={1} align="center" flexWrap="wrap" role="img" aria-label={ariaLabel}>
                {STATUS_LEVELS_ORDER.map((lvl, i) => {
                    const achieved = currentIndex >= 0 && i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    const color = getStatusColor(lvl);
                    return (
                        <React.Fragment key={lvl}>
                            {i > 0 && (
                                <Text fontSize="xs" color="gray.300" aria-hidden="true">→</Text>
                            )}
                            <Box
                                px={2}
                                py={0.5}
                                borderRadius="full"
                                bg={achieved ? getStatusBackgroundColor(lvl) : 'transparent'}
                                borderWidth={isCurrent ? '2px' : '1px'}
                                borderColor={isCurrent ? color : (achieved ? color : 'gray.200')}
                                boxShadow={isCurrent ? 'sm' : 'none'}
                            >
                                <Text
                                    fontSize="2xs"
                                    whiteSpace="nowrap"
                                    fontWeight={isCurrent ? 'bold' : (achieved ? 'semibold' : 'normal')}
                                    color={achieved ? getStatusTextColor(lvl) : 'gray.600'}
                                >
                                    {lvl}
                                </Text>
                            </Box>
                        </React.Fragment>
                    );
                })}
            </HStack>
        );
    }

    // compact: a thin segmented heat-ramp bar; the current rung is taller.
    return (
        <HStack spacing={1} align="center" w="100%" role="img" aria-label={ariaLabel}>
            {STATUS_LEVELS_ORDER.map((lvl, i) => {
                const achieved = currentIndex >= 0 && i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                    <Tooltip key={lvl} label={`${lvl}${isCurrent ? ' · current' : ''}`} openDelay={300} hasArrow>
                        <Box
                            flex="1"
                            minW="8px"
                            h={isCurrent ? '9px' : '5px'}
                            borderRadius="full"
                            bg={achieved ? getStatusColor(lvl) : 'gray.200'}
                            transition="all 0.15s"
                        />
                    </Tooltip>
                );
            })}
        </HStack>
    );
}

export default StatusLevelLadder;