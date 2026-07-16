import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Divider,
    Flex,
    Heading,
    HStack,
    Input,
    Spacer,
    Spinner,
    Tag,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { fetchTaapDetail } from '../../../services/api/get';
import {
    assignOwnerToTaap,
    unassignOwnerFromTaap,
    assignSignerToTaap,
    unassignSignerFromTaap,
    connectTaapToYse,
    disconnectTaapFromYse,
} from '../../../services/api/put';
import { deleteTaap } from '../../../services/api/delete';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import { getOutcomeColor, getOutcomeLabel, toISODate } from './assetConfig';
import TaapForm from './TaapForm';

const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

function Field({ label, value }) {
    return (
        <Box>
            <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">{label}</Text>
            {value
                ? <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">{String(value)}</Text>
                : <Text fontSize="sm" color="gray.600" fontStyle="italic">Not set</Text>}
        </Box>
    );
}

/**
 * Right-column TAAP detail. Fetches full detail by title, renders fields +
 * outcome/active/date badges, the covered asset, owner/signer assignment
 * (PersonAssignmentSelector), and YSE evidence links. Mutations refresh both
 * this panel and the parent list.
 *
 * Props:
 *   title              Selected TAAP's title, or null.
 *   onAfterMutate(deletedTitle?)  Parent refresh hook; called with title on delete.
 *   onGoToAsset(assetIdentifier)  Optional: jump to the Assets tab and select.
 */
function TaapDetailPanel({ title, onAfterMutate, onGoToAsset }) {
    const userCtx = useContext(UserContext);
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const [taap, setTaap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [yseInput, setYseInput] = useState('');
    const [connectingYse, setConnectingYse] = useState(false);
    const [removingYse, setRemovingYse] = useState(null);

    const candidatePersons = useMemo(
        () => (userCtx?.individuals || [])
            .filter((p) => p.active || p.non_committee_member_active)
            .map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title })),
        [userCtx],
    );

    const reload = useCallback(async () => {
        if (!title) { setTaap(null); return; }
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchTaapDetail(title);
            setTaap(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load TAAP.');
        } finally {
            setLoading(false);
        }
    }, [title]);

    useEffect(() => { reload(); }, [reload]);

    const refreshAll = useCallback(async () => {
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [reload, onAfterMutate]);

    if (!title) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                    Select a TAAP on the left, or click <strong>Add TAAP</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading TAAP…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!taap) return null;

    const coveredAsset = taap.covers_asset?.[0] || null;

    const handleDelete = async () => {
        if (!window.confirm('Delete this TAAP? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteTaap(taap.title);
            toast({ title: 'TAAP deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterMutate) await onAfterMutate(taap.title);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const handleConnectYse = async () => {
        const id = yseInput.trim();
        if (!id) return;
        setConnectingYse(true);
        try {
            await connectTaapToYse(taap.title, id);
            setYseInput('');
            await refreshAll();
        } catch (e) {
            toast({ title: 'Connect failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setConnectingYse(false);
        }
    };

    const handleDisconnectYse = async (id) => {
        setRemovingYse(id);
        try {
            await disconnectTaapFromYse(taap.title, id);
            await refreshAll();
        } catch (e) {
            toast({ title: 'Disconnect failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setRemovingYse(null);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={2} flexWrap="wrap">
                            {taap.outcome && <Tag size="sm" colorScheme={getOutcomeColor(taap.outcome)} variant="subtle">{getOutcomeLabel(taap.outcome)}</Tag>}
                            <Tag size="sm" colorScheme={taap.active ? 'green' : 'gray'} variant="subtle">{taap.active ? 'Active' : 'Inactive'}</Tag>
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{taap.title}</Heading>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <VStack align="stretch" spacing={3}>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Covered Asset</Text>
                        {coveredAsset ? (
                            <Text
                                fontSize="sm"
                                color={onGoToAsset ? 'teal.600' : 'gray.800'}
                                cursor={onGoToAsset ? 'pointer' : 'default'}
                                onClick={() => onGoToAsset && onGoToAsset(coveredAsset.asset_identifier)}
                            >
                                {coveredAsset.title} ({coveredAsset.asset_identifier})
                            </Text>
                        ) : (
                            <Text fontSize="sm" color="red.400" fontStyle="italic">No covered asset (data issue).</Text>
                        )}
                    </Box>
                    <Field label="Effective Date" value={toISODate(taap.effective_date)} />
                    <Field label="Review Due" value={toISODate(taap.review_due)} />
                    <Field label="Description" value={taap.description} />
                </VStack>
            </Card>

            {/* Owner */}
            <Card title="Owner">
                <PersonAssignmentSelector
                    assignedPersons={(taap.owned_by || []).map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title }))}
                    candidatePersons={candidatePersons}
                    onAssign={(uid) => assignOwnerToTaap(taap.title, uid)}
                    onUnassign={(uid) => unassignOwnerFromTaap(taap.title, uid)}
                    afterChange={refreshAll}
                    placeholder="Select owner to assign"
                />
            </Card>

            {/* Signers */}
            <Card title="Signers">
                <PersonAssignmentSelector
                    assignedPersons={(taap.signed_by || []).map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title }))}
                    candidatePersons={candidatePersons}
                    onAssign={(uid) => assignSignerToTaap(taap.title, uid)}
                    onUnassign={(uid) => unassignSignerFromTaap(taap.title, uid)}
                    afterChange={refreshAll}
                    placeholder="Select signer to assign"
                />
            </Card>

            {/* Evidence (YSE) */}
            <Card title="Evidence (Year Success Evidence)">
                <Flex gap={2} mb={3}>
                    <Input
                        size="sm"
                        placeholder="YSE identifier (e.g. 2025-2026-1.2-web)"
                        value={yseInput}
                        onChange={(e) => setYseInput(e.target.value)}
                        borderColor="teal.300"
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                    />
                    <Button size="sm" colorScheme="teal" onClick={handleConnectYse} isLoading={connectingYse} isDisabled={!yseInput.trim()}>
                        Connect
                    </Button>
                </Flex>
                {(taap.is_evidence_for || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">Not linked to any evidence yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1}>
                        {taap.is_evidence_for.map((id) => (
                            <HStack key={id} justify="space-between">
                                <Text fontSize="sm" color="gray.800">{id}</Text>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDisconnectYse(id)}
                                    isLoading={removingYse === id}
                                    isDisabled={removingYse !== null}
                                >
                                    Remove
                                </Button>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Card>

            <TaapForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingTaap={taap}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default TaapDetailPanel;
