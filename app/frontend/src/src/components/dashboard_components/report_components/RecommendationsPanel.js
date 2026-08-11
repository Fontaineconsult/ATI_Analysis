import React, { useContext, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    Select,
    Text,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { addRecommendation } from '../../../services/api/post';
import { updateRecommendation } from '../../../services/api/put';

const STATUS_COLORS = { open: 'orange', addressed: 'green', dismissed: 'gray' };

/**
 * End-of-review-cycle improvement tracking for one YSE — the Recommendation
 * nodes behind has_recommendation. Reviewers add what needs to change; each
 * item resolves via status (addressed/dismissed) + resolution prose, never
 * deletion. Rendered inside the Administrative Review window.
 *
 * Props:
 *   yearIdentifier    the YSE year_identifier
 *   recommendations   [{recommendation: {properties}, created_by}] from the WG tree
 *   onUpdate()        refetch after any mutation
 */
function RecommendationsPanel({ yearIdentifier, recommendations = [], onUpdate }) {
    const { user } = useContext(UserContext);
    const toast = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [text, setText] = useState('');
    const [detail, setDetail] = useState('');
    const [busy, setBusy] = useState(false);
    // Per-item pending resolution text, keyed by unique_id.
    const [resolutions, setResolutions] = useState({});

    const items = recommendations
        .map((w) => ({ ...(w.recommendation?.properties || {}), created_by: w.created_by?.properties?.name }))
        .filter((r) => r.unique_id)
        .sort((a, b) => (a.status === 'open' ? -1 : 1) - (b.status === 'open' ? -1 : 1));

    const fail = (title, e) =>
        toast({ title, description: e?.response?.data?.error || e?.message, status: 'error', duration: 4000, isClosable: true });

    const handleAdd = async () => {
        if (!text.trim()) return;
        setBusy(true);
        try {
            await addRecommendation(yearIdentifier, text.trim(), detail.trim() || null, user?.employee_id);
            toast({ title: 'Recommendation recorded', status: 'success', duration: 2000, isClosable: true });
            setText('');
            setDetail('');
            setIsAdding(false);
            if (onUpdate) await onUpdate();
        } catch (e) {
            fail('Failed to record recommendation', e);
        } finally {
            setBusy(false);
        }
    };

    const handleStatus = async (rec, status) => {
        setBusy(true);
        try {
            await updateRecommendation(rec.unique_id, {
                status,
                resolution: resolutions[rec.unique_id] ?? rec.resolution ?? null,
            });
            toast({ title: `Marked ${status}`, status: 'success', duration: 2000, isClosable: true });
            if (onUpdate) await onUpdate();
        } catch (e) {
            fail('Failed to update recommendation', e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
                    Recommendations
                </Text>
                <Button size="xs" colorScheme="teal" variant="outline" onClick={() => setIsAdding((v) => !v)}>
                    {isAdding ? 'Cancel' : 'Add Recommendation'}
                </Button>
            </HStack>
            <Text fontSize="xs" color="gray.600" mb={3}>
                What should improve before the next review cycle. Items resolve — they are never deleted.
            </Text>

            {isAdding && (
                <VStack align="stretch" spacing={2} mb={3} p={3} bg="teal.50" borderRadius="md">
                    <Input
                        size="sm"
                        bg="white"
                        placeholder="The improvement, as one imperative sentence…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Textarea
                        size="sm"
                        bg="white"
                        rows={2}
                        placeholder="Context — what closing this looks like (optional)"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
                    <HStack justify="flex-end">
                        <Button size="xs" colorScheme="teal" onClick={handleAdd} isLoading={busy} isDisabled={!text.trim()}>
                            Record
                        </Button>
                    </HStack>
                </VStack>
            )}

            {items.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No recommendations recorded for this cycle yet.
                </Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {items.map((rec) => (
                        <Box key={rec.unique_id} p={3} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                            <HStack align="start" spacing={2}>
                                <Badge colorScheme={STATUS_COLORS[rec.status] || 'gray'} fontSize="2xs" flexShrink={0}>
                                    {rec.status}
                                </Badge>
                                <Box flex="1" minW={0}>
                                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{rec.recommendation}</Text>
                                    {rec.detail && <Text fontSize="xs" color="gray.600" mt={0.5} whiteSpace="pre-wrap">{rec.detail}</Text>}
                                    <HStack spacing={2} mt={1} fontSize="2xs" color="gray.600">
                                        {rec.date_created && <Text>Raised {String(rec.date_created)}</Text>}
                                        {rec.created_by && <Text>by {rec.created_by}</Text>}
                                        {rec.date_resolved && <Text>· resolved {String(rec.date_resolved)}</Text>}
                                    </HStack>
                                    {rec.status !== 'open' && rec.resolution && (
                                        <Text fontSize="xs" color="gray.700" mt={1} fontStyle="italic" whiteSpace="pre-wrap">{rec.resolution}</Text>
                                    )}
                                </Box>
                            </HStack>
                            {rec.status === 'open' && (
                                <HStack mt={2} spacing={2}>
                                    <Input
                                        size="xs"
                                        bg="white"
                                        placeholder="Resolution — how it was addressed / why dismissed"
                                        value={resolutions[rec.unique_id] ?? ''}
                                        onChange={(e) => setResolutions((m) => ({ ...m, [rec.unique_id]: e.target.value }))}
                                    />
                                    <Button size="xs" colorScheme="green" variant="outline" isDisabled={busy}
                                            onClick={() => handleStatus(rec, 'addressed')}>
                                        Addressed
                                    </Button>
                                    <Button size="xs" colorScheme="gray" variant="outline" isDisabled={busy}
                                            onClick={() => handleStatus(rec, 'dismissed')}>
                                        Dismiss
                                    </Button>
                                </HStack>
                            )}
                            {rec.status !== 'open' && (
                                <HStack mt={2} justify="flex-end">
                                    <Button size="xs" variant="ghost" colorScheme="orange" isDisabled={busy}
                                            onClick={() => handleStatus(rec, 'open')}>
                                        Reopen
                                    </Button>
                                </HStack>
                            )}
                        </Box>
                    ))}
                </VStack>
            )}
        </Box>
    );
}

export default RecommendationsPanel;
