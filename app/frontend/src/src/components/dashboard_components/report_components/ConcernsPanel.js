import React, { useContext, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    Text,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { addConcern } from '../../../services/api/post';
import {
    updateConcern,
    convertConcernToRecommendation,
    convertConcernToPlan,
} from '../../../services/api/put';

const STATUS_COLORS = { open: 'red', converted: 'green', dismissed: 'gray' };

/**
 * Issues raised against one YSE with no path to resolution yet — the Concern
 * nodes behind has_concern. A concern is a holding state: it is meant to leave,
 * by becoming a Recommendation (something should change) or a Plan (someone
 * will do something), or by being dismissed. Nothing is ever deleted; a
 * converted concern keeps an edge to what it became.
 *
 * Props:
 *   yearIdentifier  the YSE year_identifier
 *   concerns        [{concern, raised_by, became_recommendation, became_plan}]
 *                   from the WG tree
 *   onUpdate()      refetch after any mutation
 */
function ConcernsPanel({ yearIdentifier, concerns = [], onUpdate }) {
    const { user } = useContext(UserContext);
    const toast = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [text, setText] = useState('');
    const [detail, setDetail] = useState('');
    const [busy, setBusy] = useState(false);
    // Which concern is mid-conversion, and the plan name being typed for it.
    const [planFor, setPlanFor] = useState(null);
    const [planName, setPlanName] = useState('');

    const items = concerns
        .map((w) => ({
            ...(w.concern?.properties || {}),
            raised_by: w.raised_by?.properties?.name,
            became_recommendation: w.became_recommendation?.properties?.recommendation,
            became_plan: w.became_plan?.properties?.name,
        }))
        .filter((c) => c.unique_id)
        .sort((a, b) => (a.status === 'open' ? -1 : 1) - (b.status === 'open' ? -1 : 1));

    const openCount = items.filter((c) => c.status === 'open').length;

    const fail = (title, e) =>
        toast({
            title,
            description: e?.response?.data?.error || e?.message,
            status: 'error',
            duration: 4000,
            isClosable: true,
        });

    const done = async (title) => {
        toast({ title, status: 'success', duration: 2000, isClosable: true });
        if (onUpdate) await onUpdate();
    };

    const handleAdd = async () => {
        if (!text.trim()) return;
        setBusy(true);
        try {
            await addConcern(yearIdentifier, text.trim(), detail.trim() || null, user?.employee_id);
            setText('');
            setDetail('');
            setIsAdding(false);
            await done('Concern recorded');
        } catch (e) {
            fail('Failed to record concern', e);
        } finally {
            setBusy(false);
        }
    };

    const handleToRecommendation = async (con) => {
        setBusy(true);
        try {
            await convertConcernToRecommendation(con.unique_id, {
                created_by_employee_id: user?.employee_id,
            });
            await done('Converted to a recommendation');
        } catch (e) {
            fail('Failed to convert concern', e);
        } finally {
            setBusy(false);
        }
    };

    const handleToPlan = async (con) => {
        if (!planName.trim()) return;
        setBusy(true);
        try {
            await convertConcernToPlan(con.unique_id, planName.trim());
            setPlanFor(null);
            setPlanName('');
            await done('Converted to a plan');
        } catch (e) {
            fail('Failed to convert concern', e);
        } finally {
            setBusy(false);
        }
    };

    const handleStatus = async (con, status) => {
        setBusy(true);
        try {
            await updateConcern(con.unique_id, { status });
            await done(status === 'open' ? 'Reopened' : `Marked ${status}`);
        } catch (e) {
            fail('Failed to update concern', e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <HStack justify="space-between" mb={2}>
                <HStack spacing={2}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
                        Concerns
                    </Text>
                    {openCount > 0 && (
                        <Badge colorScheme="red" fontSize="2xs">
                            {openCount} open
                        </Badge>
                    )}
                </HStack>
                <Button size="xs" colorScheme="teal" variant="outline" onClick={() => setIsAdding((v) => !v)}>
                    {isAdding ? 'Cancel' : 'Add Concern'}
                </Button>
            </HStack>
            <Text fontSize="xs" color="gray.600" mb={3}>
                Issues raised with no path to resolution yet. Each one should become a recommendation
                or a plan — or be dismissed with a reason.
            </Text>

            {isAdding && (
                <VStack align="stretch" spacing={2} mb={3} p={3} bg="teal.50" borderRadius="md">
                    <Input
                        size="sm"
                        bg="white"
                        placeholder="The issue, as one sentence…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Textarea
                        size="sm"
                        bg="white"
                        rows={2}
                        placeholder="Context — why it matters, who raised it (optional)"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
                    <HStack justify="flex-end">
                        <Button
                            size="xs"
                            colorScheme="teal"
                            onClick={handleAdd}
                            isLoading={busy}
                            isDisabled={!text.trim()}
                        >
                            Record
                        </Button>
                    </HStack>
                </VStack>
            )}

            {items.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No concerns recorded for this indicator.
                </Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {items.map((con) => (
                        <Box
                            key={con.unique_id}
                            p={3}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            bg="gray.50"
                        >
                            <HStack align="start" spacing={2}>
                                <Badge colorScheme={STATUS_COLORS[con.status] || 'gray'} fontSize="2xs" flexShrink={0}>
                                    {con.status}
                                </Badge>
                                <Box flex="1" minW={0}>
                                    <Text fontSize="sm" color="gray.800" fontWeight="medium">
                                        {con.concern}
                                    </Text>
                                    {con.detail && (
                                        <Text fontSize="xs" color="gray.600" mt={0.5} whiteSpace="pre-wrap">
                                            {con.detail}
                                        </Text>
                                    )}
                                    <HStack spacing={2} mt={1} fontSize="2xs" color="gray.600">
                                        {con.date_raised && <Text>Raised {String(con.date_raised)}</Text>}
                                        {con.raised_by && <Text>by {con.raised_by}</Text>}
                                        {con.date_resolved && <Text>· closed {String(con.date_resolved)}</Text>}
                                    </HStack>
                                    {con.became_recommendation && (
                                        <Text fontSize="xs" color="green.700" mt={1}>
                                            → recommendation: {con.became_recommendation}
                                        </Text>
                                    )}
                                    {con.became_plan && (
                                        <Text fontSize="xs" color="green.700" mt={1}>
                                            → plan: {con.became_plan}
                                        </Text>
                                    )}
                                    {con.status !== 'open' && con.resolution && !con.became_recommendation && !con.became_plan && (
                                        <Text fontSize="xs" color="gray.700" mt={1} fontStyle="italic" whiteSpace="pre-wrap">
                                            {con.resolution}
                                        </Text>
                                    )}
                                </Box>
                            </HStack>

                            {con.status === 'open' && (
                                <>
                                    <HStack mt={2} spacing={2}>
                                        <Button
                                            size="xs"
                                            colorScheme="green"
                                            variant="outline"
                                            isDisabled={busy}
                                            onClick={() => handleToRecommendation(con)}
                                        >
                                            To Recommendation
                                        </Button>
                                        <Button
                                            size="xs"
                                            colorScheme="blue"
                                            variant="outline"
                                            isDisabled={busy}
                                            onClick={() => {
                                                setPlanFor(planFor === con.unique_id ? null : con.unique_id);
                                                setPlanName('');
                                            }}
                                        >
                                            To Plan
                                        </Button>
                                        <Button
                                            size="xs"
                                            colorScheme="gray"
                                            variant="outline"
                                            isDisabled={busy}
                                            onClick={() => handleStatus(con, 'dismissed')}
                                        >
                                            Dismiss
                                        </Button>
                                    </HStack>
                                    {planFor === con.unique_id && (
                                        <HStack mt={2} spacing={2}>
                                            <Input
                                                size="xs"
                                                bg="white"
                                                placeholder="Plan name"
                                                value={planName}
                                                onChange={(e) => setPlanName(e.target.value)}
                                            />
                                            <Button
                                                size="xs"
                                                colorScheme="blue"
                                                isDisabled={busy || !planName.trim()}
                                                onClick={() => handleToPlan(con)}
                                            >
                                                Create Plan
                                            </Button>
                                        </HStack>
                                    )}
                                </>
                            )}

                            {con.status !== 'open' && (
                                <HStack mt={2} justify="flex-end">
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="orange"
                                        isDisabled={busy}
                                        onClick={() => handleStatus(con, 'open')}
                                    >
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

export default ConcernsPanel;
