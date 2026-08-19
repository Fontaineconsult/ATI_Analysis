import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Badge,
    Box,
    Heading,
    HStack,
    Spinner,
    Text,
    Tooltip,
    VStack,
} from '@chakra-ui/react';
import AnnotatedAttachmentSelector from '../../functional_components/AnnotatedAttachmentSelector';
import { fetchGovernanceForIndicator } from '../../../services/api/get';
import {
    attachIndicatorToGovernance,
    detachIndicatorFromGovernance,
    updateGovernanceIndicatorCitation,
} from '../../../services/api/put';
import { getGovernanceTypeLabel } from '../governance/governanceTypes';
import { CITATION_FIELDS, UNCITED_FLAG, isUncited } from '../governance/drivesCitation';
import GovernanceSources from '../governance/GovernanceSources';

/**
 * The authority behind this indicator, on the dashboard's indicator view.
 *
 * The same `drives` edge the Governance area authors, reached from the other end:
 * there the question is "what does this instrument drive?", here it is "what drives
 * this indicator?". Writes go through the SAME /governance PUT actions, so there is
 * no second write path to keep in step — only the reading direction differs.
 *
 * Two blocks, because they are two different claims (see the Governance section
 * docstring in app/database/graph_schema.py):
 *   Driven by        `drives` edges on THIS indicator. Editable, carries the citation.
 *   Behind the goal  `informs` edges on the parent goal. READ-ONLY context — these
 *                    are not edges on this indicator. Showing them is the union the
 *                    docstring describes, derived rather than materialized.
 */
function IndicatorGovernancePanel({ compositeKey }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Starts collapsed, so the picker pool (~93% of the payload) is not requested
    // until the panel is actually opened. Once opened for a given indicator it stays
    // opted in, so later refetches after a write keep the picker populated.
    const wantCandidates = useRef(false);

    const load = useCallback(async (withCandidates) => {
        if (!compositeKey) return;
        if (withCandidates) wantCandidates.current = true;
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchGovernanceForIndicator(compositeKey, wantCandidates.current);
            setData(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Could not load governance for this indicator.');
        } finally {
            setLoading(false);
        }
    }, [compositeKey]);

    // Selecting a different indicator re-collapses the picker's opt-in along with it.
    useEffect(() => { wantCandidates.current = false; }, [compositeKey]);
    useEffect(() => { load(false); }, [load]);

    const handleExpand = useCallback(() => {
        if (!wantCandidates.current) load(true);
    }, [load]);

    // The picker needs the governance TYPE alongside the id, because the write actions
    // are type-dispatched. AnnotatedAttachmentSelector hands back only a unique_id, so
    // the type is recovered here from the candidate pool.
    const typeById = useMemo(() => {
        const map = new Map();
        (data?.candidates || []).forEach((c) => map.set(c.unique_id, c.type));
        (data?.driving || []).forEach((c) => map.set(c.unique_id, c.type));
        return map;
    }, [data]);

    const candidates = useMemo(
        () => (data?.candidates || []).map((c) => ({
            unique_id: c.unique_id,
            label: c.title || '(untitled)',
            group: getGovernanceTypeLabel(c.type) || c.label,
        })),
        [data],
    );

    const attached = useMemo(
        () => (data?.driving || []).map((c) => ({
            ...c,
            label: c.title || '(untitled)',
            badge: getGovernanceTypeLabel(c.type) || c.label,
        })),
        [data],
    );

    const indicatorUniqueId = data?.unique_id;

    const handleAttach = useCallback(
        (governanceUniqueId, citation) => attachIndicatorToGovernance(
            typeById.get(governanceUniqueId), governanceUniqueId, indicatorUniqueId, citation,
        ),
        [typeById, indicatorUniqueId],
    );

    const handleUpdate = useCallback(
        (governanceUniqueId, citation) => updateGovernanceIndicatorCitation(
            typeById.get(governanceUniqueId), governanceUniqueId, indicatorUniqueId, citation,
        ),
        [typeById, indicatorUniqueId],
    );

    const handleDetach = useCallback(
        (governanceUniqueId) => detachIndicatorFromGovernance(
            typeById.get(governanceUniqueId), governanceUniqueId, indicatorUniqueId,
        ),
        [typeById, indicatorUniqueId],
    );

    const driving = data?.driving || [];
    const uncitedCount = driving.filter(isUncited).length;
    const inherited = data?.informing_goal || [];

    // The collapsed header has to be worth reading on its own, or collapsing just
    // hides the section. These counts come from the small default payload.
    const summary = [
        driving.length ? `${driving.length} driving` : null,
        inherited.length ? `${inherited.length} behind goal` : null,
    ].filter(Boolean).join(' · ');

    const body = (
        <>
            {loading && !data ? (
                <HStack spacing={2}>
                    <Spinner size="xs" color="teal.500" />
                    <Text fontSize="sm" color="gray.600">Loading…</Text>
                </HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.600">{error}</Text>
            ) : (
                <VStack align="stretch" spacing={3}>
                    <Box>
                        <Text fontSize="xs" color="gray.600" mb={2}>
                            Instruments that state the requirement this indicator measures. Cite the
                            provision and quote it from the instrument&rsquo;s captured text.
                        </Text>
                        <AnnotatedAttachmentSelector
                            idPrefix={`si-drives-${compositeKey}`}
                            entityLabel="Instrument"
                            selectLabel="Governance instrument"
                            placeholder="Select an instrument that drives this indicator…"
                            addLabel="+ Link an instrument"
                            attachLabel="Link instrument"
                            emptyLabel="No governing instrument recorded for this indicator."
                            noCandidates="Every instrument is already linked."
                            attached={attached}
                            candidates={candidates}
                            fields={CITATION_FIELDS}
                            flag={UNCITED_FLAG}
                            onAttach={handleAttach}
                            onUpdate={handleUpdate}
                            onDetach={handleDetach}
                            afterChange={load}
                            // The instrument's own source artifacts, so the cited
                            // document can be opened without leaving the indicator.
                            renderExtra={(row) => (
                                <GovernanceSources
                                    documents={row.documents}
                                    webpages={row.webpages}
                                    hasRawText={row.has_raw_text}
                                />
                            )}
                        />
                    </Box>

                    {inherited.length > 0 ? (
                        <Box borderTopWidth="1px" borderColor="gray.200" pt={2}>
                            <Tooltip label="These instruments inform this indicator's parent goal, not the indicator itself. Shown as context — edit them in the Governance area.">
                                <Text
                                    fontSize="xs"
                                    color="gray.600"
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                    fontWeight="bold"
                                    mb={1}
                                    cursor="help"
                                    display="inline-block"
                                >
                                    Behind the goal
                                    {data?.goal?.name ? `: ${data.goal.name}` : ''}
                                </Text>
                            </Tooltip>
                            <VStack align="stretch" spacing={2}>
                                {inherited.map((g) => (
                                    <Box key={g.unique_id}>
                                        <HStack spacing={2} align="baseline">
                                            <Badge colorScheme="gray" variant="subtle" fontSize="0.6rem">
                                                {getGovernanceTypeLabel(g.type) || g.label}
                                            </Badge>
                                            <Text fontSize="sm" color="gray.700">{g.title || '(untitled)'}</Text>
                                        </HStack>
                                        {/* Context rows get their sources too, but no
                                            missing-source nag — the gap belongs to the
                                            goal-level edge, not to this indicator. */}
                                        <GovernanceSources
                                            documents={g.documents}
                                            webpages={g.webpages}
                                            emptyHint={false}
                                        />
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    ) : null}
                </VStack>
            )}
        </>
    );

    // Chakra's Accordion, matching the Companion Guide block in the parent panel. It
    // implements the APG disclosure pattern's full keyboard contract, which a
    // hand-rolled toggle would have to reproduce. `allowToggle` with no defaultIndex
    // starts collapsed.
    return (
        <Accordion allowToggle>
            <AccordionItem
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
            >
                <Heading as="h6" size="xs" m={0}>
                    <AccordionButton px={3} py={2} _hover={{ bg: 'gray.50' }} onClick={handleExpand}>
                        <Box
                            as="span"
                            flex="1"
                            textAlign="left"
                            fontSize="xs"
                            fontWeight="semibold"
                            textTransform="uppercase"
                            letterSpacing="wide"
                            color="teal.700"
                        >
                            Governing Authority
                        </Box>
                        {summary ? (
                            <Text as="span" fontSize="xs" color="gray.600" mr={2} fontWeight="normal">
                                {summary}
                            </Text>
                        ) : null}
                        {uncitedCount > 0 ? (
                            <Badge colorScheme="orange" variant="subtle" fontSize="0.65rem" mr={2}>
                                {uncitedCount} uncited
                            </Badge>
                        ) : null}
                        <AccordionIcon color="teal.600" />
                    </AccordionButton>
                </Heading>
                <AccordionPanel px={3} pb={3} pt={1}>
                    {body}
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    );
}

export default IndicatorGovernancePanel;
