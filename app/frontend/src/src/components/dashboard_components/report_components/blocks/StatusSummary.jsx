import React from 'react';
import { HStack, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react';

import StatusLevelLadder from '../../../functional_components/StatusLevelLadder';
import StatusProgression from '../../campus_plan_components/StatusProgression';
import { SubLabel } from './reportPrimitives';

/**
 * Maturity ladder, year-over-year progression, and the YSE workflow chips.
 *
 * `status` is report.status; `yse` is report.yse OR the raw YSE node properties from the
 * working-group payload — the field names are the same in both shapes, which is what lets
 * the approval page (which holds the node) and the report (which holds the projection)
 * share this block.
 *
 * Year-over-year renders through StatusProgression (the shared StatusPill color ramp) —
 * never hand-rolled badges, per the design sense's "never re-derive status colors".
 */
const StatusSummary = ({ status, yse }) => (
    <>
        <HStack spacing={3} align="center" flexWrap="wrap" mb={status?.previous_status_level ? 2 : 0}>
            <SubLabel>Maturity</SubLabel>
            <StatusLevelLadder level={status?.status_level || null} variant="full" />
        </HStack>
        {status?.previous_status_level && (
            <HStack spacing={3} align="center" flexWrap="wrap" mb={2}>
                <SubLabel>Year over year</SubLabel>
                <StatusProgression previousStatusLevel={status.previous_status_level} currentStatusLevel={status?.status_level} />
                <Text fontSize="2xs" color="gray.600">(prev → current)</Text>
            </HStack>
        )}
        <Wrap spacing={2} mt={2}>
            {yse?.priority_level && <WrapItem><Tag size="sm" colorScheme="purple" variant="subtle">Priority: {yse.priority_level}</Tag></WrapItem>}
            {yse?.worked_on_in_current_year && <WrapItem><Tag size="sm" colorScheme="green" variant="subtle">Worked on this year</Tag></WrapItem>}
            {yse?.will_work_on_next_year && <WrapItem><Tag size="sm" colorScheme="blue" variant="subtle">Continuing next year</Tag></WrapItem>}
            {yse?.ready_for_admin_review && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Ready for admin review</Tag></WrapItem>}
            {yse?.documentation_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Docs: {yse.documentation_status}</Tag></WrapItem>}
            {yse?.resources_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Resources: {yse.resources_status}</Tag></WrapItem>}
            {yse?.implementation_plan_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Plan: {yse.implementation_plan_status}</Tag></WrapItem>}
        </Wrap>
    </>
);

export default StatusSummary;
