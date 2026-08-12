import React, { useCallback, useMemo } from 'react';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import AnnotatedAttachmentSelector from '../../functional_components/AnnotatedAttachmentSelector';
import {
    attachGoalToGovernance,
    detachGoalFromGovernance,
    attachIndicatorToGovernance,
    detachIndicatorFromGovernance,
    updateGovernanceIndicatorCitation,
} from '../../../services/api/put';
import { CITATION_FIELDS, UNCITED_FLAG, isUncited } from './drivesCitation';

/**
 * The two governance -> indicator-framework edges, rendered as two cards.
 *
 * They are deliberately NOT one control. The edge type carries the strength of the
 * claim (see the Governance section docstring in app/database/graph_schema.py):
 *
 *   informs -> Goal              broad, non-committal, property-free
 *   drives  -> SuccessIndicator  exact, carrying the citation that makes it checkable
 *
 * So `informs` uses EntityAttachmentSelector (property-free edges) and `drives` uses
 * AnnotatedAttachmentSelector (property-carrying edges). This file holds only the
 * governance-specific wiring: which services to call, how to label a framework row,
 * and what counts as an uncited claim.
 */

function goalLabel(goal) {
    const text = goal.goal || goal.name || '(untitled goal)';
    const wg = goal.working_group ? `${goal.working_group} · ` : '';
    const num = goal.goal_number != null ? `${goal.goal_number}. ` : '';
    return `${wg}${num}${text}`;
}

/**
 * The optgroup label for an indicator: working group, then goal.
 *
 * A native <select> supports only ONE level of grouping, and the framework is three
 * deep (working group -> goal -> indicator). Folding the top two levels into the
 * group label gives the full ordering — the backend already sorts by working group,
 * then goal, then indicator, so groups arrive clustered — while keeping a real
 * <select>, which carries its APG keyboard contract for free.
 */
function indicatorGroup(si) {
    const wg = si.working_group || 'Unassigned';
    if (!si.goal_name) return wg;
    const num = si.goal_number != null ? `${si.goal_number}. ` : '';
    return `${wg} › ${num}${si.goal_name}`;
}

/**
 * Props:
 *   item        the selected governance item (carries `goals` and `success_indicators`)
 *   targets     { goals: [...], success_indicators: [...] } candidate pool
 *   onChanged() refetch hook, called after every successful write
 */
function GovernanceIndicatorLinks({ item, targets, onChanged }) {
    const attachedGoals = useMemo(() => item?.goals || [], [item]);
    const attachedIndicators = useMemo(() => item?.success_indicators || [], [item]);

    const indicatorCandidates = useMemo(
        () => (targets?.success_indicators || []).map((si) => ({
            unique_id: si.unique_id,
            label: `${si.composite_key || '(no key)'} — ${si.success_indicator || '(untitled indicator)'}`,
            group: indicatorGroup(si),
        })),
        [targets],
    );

    const attachedIndicatorRows = useMemo(
        () => attachedIndicators.map((si) => ({
            ...si,
            badge: si.composite_key,
            label: si.success_indicator || '(untitled indicator)',
        })),
        [attachedIndicators],
    );

    const handleAttachIndicator = useCallback(
        (indicatorUniqueId, citation) =>
            attachIndicatorToGovernance(item.type, item.unique_id, indicatorUniqueId, citation),
        [item],
    );

    const handleUpdateIndicator = useCallback(
        (indicatorUniqueId, citation) =>
            updateGovernanceIndicatorCitation(item.type, item.unique_id, indicatorUniqueId, citation),
        [item],
    );

    const handleDetachIndicator = useCallback(
        (indicatorUniqueId) => detachIndicatorFromGovernance(item.type, item.unique_id, indicatorUniqueId),
        [item],
    );

    const uncitedCount = attachedIndicators.filter(isUncited).length;

    return (
        <>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={1}>
                    Informs Goals
                </Heading>
                <Text fontSize="xs" color="gray.600" mb={3}>
                    Broad and non-committal: this instrument is part of the authority landscape behind the
                    goal. Many instruments may inform one goal.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Goal"
                    placeholder="Select a goal this instrument informs…"
                    attached={attachedGoals.map((g) => ({ unique_id: g.unique_id, label: goalLabel(g) }))}
                    candidates={(targets?.goals || []).map((g) => ({
                        unique_id: g.unique_id,
                        label: goalLabel(g),
                    }))}
                    onAttach={(goalUniqueId) => attachGoalToGovernance(item.type, item.unique_id, goalUniqueId)}
                    onDetach={(goalUniqueId) => detachGoalFromGovernance(item.type, item.unique_id, goalUniqueId)}
                    afterChange={onChanged}
                    emptyLabel="No goals informed yet."
                    noCandidates="Every goal is already informed by this instrument."
                />
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Flex align="start" mb={1} gap={2}>
                    <Heading as="h3" size="sm" color="teal.700">
                        Drives Success Indicators
                    </Heading>
                    {uncitedCount > 0 ? (
                        <Badge colorScheme="orange" variant="subtle" fontSize="0.65rem">
                            {uncitedCount} uncited
                        </Badge>
                    ) : null}
                </Flex>
                <Text fontSize="xs" color="gray.600" mb={3}>
                    Exact: this instrument states the requirement the indicator measures. Sparse by
                    construction — cite the provision, and quote it from the instrument&rsquo;s captured text.
                </Text>

                <AnnotatedAttachmentSelector
                    idPrefix="drives"
                    entityLabel="Indicator"
                    selectLabel="Success indicator"
                    placeholder="Select an indicator this instrument drives…"
                    addLabel="+ Link an indicator"
                    attachLabel="Link indicator"
                    emptyLabel="No indicators driven yet."
                    noCandidates="Every indicator is already driven by this instrument."
                    attached={attachedIndicatorRows}
                    candidates={indicatorCandidates}
                    fields={CITATION_FIELDS}
                    flag={UNCITED_FLAG}
                    onAttach={handleAttachIndicator}
                    onUpdate={handleUpdateIndicator}
                    onDetach={handleDetachIndicator}
                    afterChange={onChanged}
                />
            </Box>
        </>
    );
}

export default GovernanceIndicatorLinks;
