import React, { useCallback, useState } from 'react';
import {
    Badge, Box, Button, Collapse, Flex, HStack, IconButton, Spinner, Text, Tooltip,
    VStack, useDisclosure, useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import Section from '../../graph_components/common/Section';
import { useSettings } from '../../../context/SettingsContext';
import { fetchQueryPanelForPlan, fetchQueryPanelForWorkingGroup } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';
import { deleteQuery } from '../../../services/api/delete';
import { getStatusMeta, getCategoryMeta, summarizeQueries } from './queriesConfig';
import QueryForm from './QueryForm';
import QueryDetail from './QueryDetail';
import AnswerableBy from './AnswerableBy';

function StatusBadge({ status, vocab }) {
    const meta = getStatusMeta(status);
    const label = vocab?.query_statuses?.[status] || meta.label;
    return <Badge colorScheme={meta.colorScheme} fontSize="2xs">{label}</Badge>;
}

function CategoryBadge({ category, vocab }) {
    if (!category) return null;
    const meta = getCategoryMeta(category);
    const label = vocab?.query_categories?.[category] || meta.label;
    return <Badge colorScheme={meta.colorScheme} variant="subtle" fontSize="2xs">{label}</Badge>;
}

function QueryRow({ query, vocab, candidateEvidence, onChanged, onEdit }) {
    const { isOpen, onToggle } = useDisclosure();
    const toast = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this question? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteQuery(query.unique_id);
            toast({ title: 'Question deleted', status: 'success', duration: 2000, isClosable: true });
            if (onChanged) await onChanged();
        } catch (err) {
            toast({ title: 'Delete failed', description: err?.message, status: 'error', duration: 4000, isClosable: true });
            setDeleting(false);
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            borderLeftWidth="3px"
            borderLeftColor={query.status === 'settled' ? 'green.400' : 'teal.400'}
            bg="white"
            overflow="hidden"
        >
            {/* Tint sits on the row, not the wrapper, so the expanded detail below stays
                white. Matches the meeting minutes list. */}
            <Flex
                align="center"
                gap={2}
                p={2}
                bg="gray.50"
                cursor="pointer"
                onClick={onToggle}
                _hover={{ bg: 'gray.100' }}
                role="button"
                aria-expanded={isOpen}
            >
                <VStack align="stretch" spacing={1} flex={1} minW={0}>
                    <Text fontSize="sm" color="gray.800" noOfLines={isOpen ? undefined : 1}>{query.question}</Text>
                    <HStack spacing={2} flexWrap="wrap">
                        <CategoryBadge category={query.category} vocab={vocab} />
                        <StatusBadge status={query.status} vocab={vocab} />
                        {query.raised_by && <Text fontSize="2xs" color="gray.600">{query.raised_by.name}</Text>}
                        <AnswerableBy people={query.answerable_by} size="sm" />
                        {query.date_raised && <Text fontSize="2xs" color="gray.600" fontFamily="mono">{query.date_raised}</Text>}
                        {(query.addresses_evidence || []).length > 0 && (
                            <Text fontSize="2xs" color="teal.600">{query.addresses_evidence.length} YSE</Text>
                        )}
                    </HStack>
                </VStack>
                <Tooltip label="Edit" openDelay={400}>
                    <IconButton aria-label="Edit question" icon={<EditIcon />} size="xs" variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onEdit(query); }} />
                </Tooltip>
                <Tooltip label="Delete" openDelay={400}>
                    <IconButton aria-label="Delete question" icon={<DeleteIcon />} size="xs" variant="ghost"
                                colorScheme="red" isLoading={deleting} onClick={handleDelete} />
                </Tooltip>
                {isOpen ? <ChevronUpIcon color="gray.600" /> : <ChevronDownIcon color="gray.600" />}
            </Flex>
            <Collapse in={isOpen} animateOpacity unmountOnExit>
                <Box px={3} pb={3}>
                    <QueryDetail query={query} candidateEvidence={candidateEvidence} onChanged={onChanged} />
                </Box>
            </Collapse>
        </Box>
    );
}

/**
 * Self-contained Queries panel embedded in a working-group dashboard and the campus-plan
 * view. Identify the anchor WorkingGroupPlan with `workingGroupPlanIdentifier` (campus-plan
 * card), OR with (`campusAbbrev`, `academicYear`, `workingGroup`) (working-group dashboard).
 * Loads its own data (queries + candidate YSE) and refreshes after every mutation.
 */
export default function QueriesPanel({
    workingGroupPlanIdentifier = null,
    campusAbbrev = null,
    academicYear = null,
    workingGroup = null,
    title = 'Queries',
}) {
    const { vocab } = useSettings();
    const formDisc = useDisclosure();
    const [editing, setEditing] = useState(null);

    // Two reads, one panel: with a plan identifier this is the same key the
    // campus plan's WgQueriesSection uses; without one it falls back to the
    // working-group variant, which needs all three of campus, year and group in
    // its key because all three shape the answer.
    const queryKey = workingGroupPlanIdentifier
        ? KEYS.queriesForPlan(workingGroupPlanIdentifier)
        : KEYS.queriesForWorkingGroup(campusAbbrev, academicYear, workingGroup);
    const {
        data: panelResp, loading, error, reload: reloadPanel,
    } = useResource(
        queryKey,
        () => (workingGroupPlanIdentifier
            ? fetchQueryPanelForPlan(workingGroupPlanIdentifier)
            : fetchQueryPanelForWorkingGroup(campusAbbrev, academicYear, workingGroup)),
    );
    const panel = panelResp?.data || null;

    // A query write can move both variants — creating one against a working
    // group with no plan yet changes what the plan view will show once it has
    // one — so the namespace goes rather than this key.
    const { invalidateNamespace } = useInvalidateResources();
    const load = useCallback(async () => {
        invalidateNamespace(NS.queries);
        await reloadPanel();
    }, [invalidateNamespace, reloadPanel]);

    const queries = panel?.queries || [];
    const summary = summarizeQueries(queries);
    const planExists = panel?.exists !== false;
    const planId = panel?.working_group_plan_identifier || workingGroupPlanIdentifier;

    const openCreate = () => { setEditing(null); formDisc.onOpen(); };
    const openEdit = (q) => { setEditing(q); formDisc.onOpen(); };

    const headerAction = (
        <Button size="xs" colorScheme="teal" variant="outline" leftIcon={<AddIcon />}
                onClick={openCreate} isDisabled={!planExists || loading}>
            New question
        </Button>
    );

    return (
        <Section title={`${title}${summary.total ? ` (${summary.total})` : ''}`} action={planExists ? headerAction : null}>
            {loading ? (
                <HStack color="gray.600" fontSize="sm"><Spinner size="sm" /><Text>Loading…</Text></HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.500">{error}</Text>
            ) : !planExists ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No campus plan for this year yet — create one to raise questions here.
                </Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {summary.total > 0 && (
                        <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="orange" fontSize="2xs">{summary.open} open</Badge>
                            <Badge colorScheme="blue" fontSize="2xs">{summary.in_progress} in progress</Badge>
                            <Badge colorScheme="green" fontSize="2xs">{summary.settled} settled</Badge>
                        </HStack>
                    )}
                    {queries.length === 0 ? (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">No questions yet.</Text>
                    ) : (
                        queries.map((q) => (
                            <QueryRow
                                key={q.unique_id}
                                query={q}
                                vocab={vocab}
                                candidateEvidence={panel?.candidate_evidence || []}
                                onChanged={load}
                                onEdit={openEdit}
                            />
                        ))
                    )}
                </VStack>
            )}

            {formDisc.isOpen && (
                <QueryForm
                    isOpen={formDisc.isOpen}
                    onClose={formDisc.onClose}
                    mode={editing ? 'edit' : 'create'}
                    initial={editing}
                    workingGroupPlanIdentifier={planId}
                    createContext={!planId ? { campusAbbrev, academicYear, workingGroup } : null}
                    onSaved={load}
                />
            )}
        </Section>
    );
}
