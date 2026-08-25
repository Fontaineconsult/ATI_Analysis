import React from 'react';
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';

import { getPlanStatusColorScheme, getPlanStatusLabel } from '../../../../styles/planStatusColors';
import { DataTable, Dash, Empty, SubLabel } from './reportPrimitives';

/**
 * Plans and accomplishments for the year — takes report.plans / report.accomplishments.
 *
 * Plan status renders through styles/planStatusColors (abandoned flag authoritative,
 * shared color ramp) — the approval page's standalone template hard-coded gray here,
 * which this block retires.
 */
const PlansAccomplishments = ({ plans = [], accomplishments = [], emptyText = 'None recorded for this year.' }) => {
    if (!plans.length && !accomplishments.length) return <Empty>{emptyText}</Empty>;
    return (
        <VStack align="stretch" spacing={4}>
            {plans.length > 0 && (
                <Box>
                    <SubLabel>Plans ({plans.length})</SubLabel>
                    <Box mt={1}>
                        <DataTable
                            columns={['Plan', 'Status', 'Description']}
                            rows={plans.map((p) => [
                                <HStack spacing={1.5} flexWrap="wrap">
                                    <Text fontWeight="semibold" color="gray.800">{p.name}</Text>
                                    {p.is_key_plan && <Badge colorScheme="purple" fontSize="2xs">Key</Badge>}
                                    {p.is_campus_plan && <Badge colorScheme="green" fontSize="2xs">Campus plan</Badge>}
                                </HStack>,
                                p.plan_status ? <Badge colorScheme={getPlanStatusColorScheme(p)} fontSize="2xs">{getPlanStatusLabel(p)}</Badge> : <Dash />,
                                p.description ? <Text color="gray.700">{p.description}</Text> : <Dash />,
                            ])}
                        />
                    </Box>
                </Box>
            )}
            {accomplishments.length > 0 && (
                <Box>
                    <SubLabel>Accomplishments ({accomplishments.length})</SubLabel>
                    <Box mt={1}>
                        <DataTable
                            columns={['Accomplishment', 'Description']}
                            rows={accomplishments.map((a) => [
                                <Text fontWeight="semibold" color="gray.800">{a.name}</Text>,
                                a.description ? <Text color="gray.700" whiteSpace="pre-wrap">{a.description}</Text> : <Dash />,
                            ])}
                        />
                    </Box>
                </Box>
            )}
        </VStack>
    );
};

export default PlansAccomplishments;
