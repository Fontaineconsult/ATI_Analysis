import React from 'react';
import { Box, HStack, Heading, Text } from '@chakra-ui/react';

import { getWgHex } from '../../../../styles/workingGroupIdentity';

/**
 * The identity header: composite key, working-group dot, campus, year, the indicator
 * text as the page's h1, and the goal line.
 *
 * Presence-guarded throughout, because the approval page renders it before the report
 * payload lands (its compositeKey comes from the URL) — the guards are harmless on the
 * report page, where every field is populated.
 *
 * `action` is the right-hand slot; page-owned buttons live there (the report's
 * Copy/Print/Edit set with its .report-no-print class, the approval page's standalone-
 * report link). `breadcrumb` renders above the key when given.
 */
const IndicatorIdentity = ({ indicator = {}, compositeKey, campusName, year, breadcrumb, action }) => (
    <Box as="header">
        {breadcrumb}
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
            <Box minW={0}>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text fontFamily="mono" fontSize="lg" fontWeight="bold" color="gray.700">
                        {compositeKey || indicator.composite_key}
                    </Text>
                    {indicator.working_group && (
                        <>
                            <Box w="10px" h="10px" borderRadius="full" bg={getWgHex(indicator.working_group)} />
                            <Text fontSize="sm" color="gray.700">{indicator.working_group}</Text>
                        </>
                    )}
                    <Text fontSize="sm" color="gray.700">· {campusName} · {year}</Text>
                </HStack>
                <Heading as="h1" size="md" color="gray.800" lineHeight="1.35">
                    {indicator.success_indicator}
                </Heading>
                {indicator.goal_number && (
                    <Text fontSize="sm" color="gray.700" mt={1}>
                        Goal {indicator.goal_number} — {indicator.goal_name}
                    </Text>
                )}
            </Box>
            {action}
        </HStack>
    </Box>
);

export default IndicatorIdentity;
