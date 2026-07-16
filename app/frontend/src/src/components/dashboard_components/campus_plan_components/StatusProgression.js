import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

import { getStatusColor, getStatusBackgroundColor, getStatusTextColor } from '../../../services/utils/statusColors';

/**
 * Single colored pill for a StatusLevel name.
 * Falls back to a neutral dash pill when the level is missing.
 */
export function StatusPill({ level }) {
    if (!level) {
        return (
            <Box px={1.5} py={0.5} borderRadius="sm" bg="gray.100">
                <Text fontSize="xs" color="gray.600" whiteSpace="nowrap">—</Text>
            </Box>
        );
    }
    return (
        <Box
            px={1.5}
            py={0.5}
            bg={getStatusBackgroundColor(level)}
            borderRadius="sm"
            borderLeftWidth="2px"
            borderLeftColor={getStatusColor(level)}
        >
            <Text
                fontSize="xs"
                fontWeight="medium"
                color={getStatusTextColor(level)}
                whiteSpace="nowrap"
            >
                {level}
            </Text>
        </Box>
    );
}

/**
 * "[Previous] → [Current]" status progression display. The point of the
 * CampusPlan view is to surface progress year-over-year, so we always show
 * both pills with an arrow between them. Missing sides render as a dash pill.
 *
 * If neither year has a status, returns a single em-dash to keep rows quiet.
 */
function StatusProgression({ previousStatusLevel, currentStatusLevel }) {
    const hasPrev = !!previousStatusLevel;
    const hasCurr = !!currentStatusLevel;

    if (!hasPrev && !hasCurr) {
        return <Text fontSize="xs" color="gray.600" whiteSpace="nowrap">—</Text>;
    }

    return (
        <HStack spacing={1} flexShrink={0}>
            <StatusPill level={previousStatusLevel} />
            <Text fontSize="xs" color="gray.600">→</Text>
            <StatusPill level={currentStatusLevel} />
        </HStack>
    );
}

export default StatusProgression;
