import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    Spacer,
    Spinner,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { fetchInterfaceDetail } from '../../../services/api/get';
import {
    assignAssetToInterface,
    unassignAssetFromInterface,
    assignRemediationToInterface,
    unassignRemediationFromInterface,
    assignWorkingGroupToInterface,
    unassignWorkingGroupFromInterface,
} from '../../../services/api/put';
import { deleteInterface } from '../../../services/api/delete';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import { FunctionBadge, CoverageDomainBadges, ProvenanceBadge, AudienceBadges, UncoveredBadge } from './InterfaceBadges';
import { getFunctionLabel } from './interfaceConfig';
import InterfaceForm from './InterfaceForm';

const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

function Field({ label, value }) {
    return (
        <Box>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">{label}</Text>
            {value
                ? <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">{String(value)}</Text>
                : <Text fontSize="sm" color="gray.400" fontStyle="italic">Not set</Text>}
        </Box>
    );
}

/**
 * Right-column interface detail. Fetches full detail by interface_identifier (the
 * list carries only summaries), then renders stacked cards: identity (+ uncovered
 * alert), backing asset (presented_by — editable), and remediation (the
 * Implementations that remediate this interface — editable). Edge mutations refresh
 * both this panel and the parent (so the list ⚠ badges stay current).
 *
 * §508 stewardship is NOT shown here: it lives on the backing Asset and is derived
 * upward via presented_by — open the asset to manage its stewards.
 *
 * Props:
 *   interfaceIdentifier        Selected interface's business key, or null.
 *   assets                     Asset summaries, for the backing-asset picker.
 *   implementations            Flat [{type, unique_id, title}] of remediating impls
 *                              (Process/Project/Procedure/Service), for the picker.
 *   onAfterMutate(deletedId?)  Parent refresh hook; called with the id on delete.
 *   onGoToAsset(assetId)       Optional: jump to the Assets tab and select an asset.
 */
function InterfaceDetailPanel({ interfaceIdentifier, assets = [], implementations = [], onAfterMutate, onGoToAsset }) {
    const { vocab } = useSettings();
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const [iface, setIface] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const reload = useCallback(async () => {
        if (!interfaceIdentifier) { setIface(null); return; }
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchInterfaceDetail(interfaceIdentifier);
            setIface(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load interface.');
        } finally {
            setLoading(false);
        }
    }, [interfaceIdentifier]);

    useEffect(() => { reload(); }, [reload]);

    const refreshAll = useCallback(async () => {
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [reload, onAfterMutate]);

    // assign_asset / unassign_asset take an asset_identifier; the selector keys on
    // unique_id, so resolve the identifier from the candidate + attached lists.
    const assetIdByUid = useMemo(() => {
        const m = new Map();
        assets.forEach((a) => m.set(a.unique_id, a.asset_identifier));
        (iface?.presented_by || []).forEach((a) => m.set(a.unique_id, a.asset_identifier));
        return m;
    }, [assets, iface]);

    // assign_remediation / unassign_remediation take (implementation_type, unique_id);
    // the selector keys on unique_id, so resolve the type from the candidate + attached lists.
    const implTypeByUid = useMemo(() => {
        const m = new Map();
        implementations.forEach((i) => m.set(i.unique_id, i.type));
        (iface?.remediated_by || []).forEach((r) => m.set(r.unique_id, r.type));
        return m;
    }, [implementations, iface]);

    if (!interfaceIdentifier) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.500" fontSize="sm">
                    Select an interface on the left, or click <strong>Add Interface</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading interface…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!iface) return null;

    const handleDelete = async () => {
        if (!window.confirm('Delete this interface? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteInterface(iface.interface_identifier);
            toast({ title: 'Interface deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterMutate) await onAfterMutate(iface.interface_identifier);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const assetAttached = (iface.presented_by || []).map((a) => ({ unique_id: a.unique_id, label: `${a.title} (${a.asset_identifier})` }));
    const assetCandidates = assets.map((a) => ({ unique_id: a.unique_id, label: `${a.title} (${a.asset_identifier})` }));

    const remediationAttached = (iface.remediated_by || []).map((r) => ({ unique_id: r.unique_id, label: `${r.title} (${r.type})` }));
    const remediationCandidates = implementations.map((i) => ({ unique_id: i.unique_id, label: `${i.title} (${i.type})` }));

    // Accountable working groups — backend resolves by name, so use the name as the key.
    const wgAttached = (iface.accountable_working_groups || []).map((w) => ({ unique_id: w.name, label: w.name }));
    const wgList = Array.isArray(vocab?.working_groups) ? vocab.working_groups : [];
    const wgCandidates = wgList.map((name) => ({ unique_id: name, label: name }));

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={2} flexWrap="wrap">
                            {iface.function && <FunctionBadge fn={iface.function} />}
                            <CoverageDomainBadges domains={iface.coverage_domains} />
                            {iface.provenance && <ProvenanceBadge provenance={iface.provenance} />}
                            {iface.uncovered && <UncoveredBadge />}
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{iface.title || '(untitled)'}</Heading>
                        <Text fontSize="xs" color="gray.400">{iface.interface_identifier}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <VStack align="stretch" spacing={3}>
                    {iface.uncovered && (
                        <Alert status="warning" borderRadius="md" fontSize="sm">
                            <AlertIcon />
                            No implementation remediates this interface. The duty for this interaction point is unmet (Title II §35.205).
                        </Alert>
                    )}
                    <Field label="Function" value={iface.function ? getFunctionLabel(iface.function) : null} />
                    <Field label="Locus" value={iface.locus} />
                    <Box>
                        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={1}>Audience</Text>
                        {(iface.audience || []).length
                            ? <AudienceBadges audience={iface.audience} />
                            : <Text fontSize="sm" color="gray.400" fontStyle="italic">Not set</Text>}
                    </Box>
                    <Field label="Description" value={iface.description} />
                </VStack>
            </Card>

            {/* Backing asset (presented_by) — editable; stewardship derives upward from it */}
            <Card title="Backing asset">
                <Text fontSize="xs" color="gray.500" mb={2}>
                    The asset this interface is presented by. §508 stewardship is derived from the asset, not stored here.
                    A standalone interface (no backing asset) is a valid state.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Asset"
                    placeholder="Select an asset…"
                    attached={assetAttached}
                    candidates={assetCandidates}
                    onAttach={(uid) => assignAssetToInterface(iface.interface_identifier, assetIdByUid.get(uid) || uid)}
                    onDetach={(uid) => unassignAssetFromInterface(iface.interface_identifier, assetIdByUid.get(uid) || uid)}
                    afterChange={refreshAll}
                    emptyLabel="No backing asset (standalone)."
                />
                {onGoToAsset && (iface.presented_by || []).length > 0 && (
                    <HStack mt={2} spacing={2} flexWrap="wrap">
                        {iface.presented_by.map((a) => (
                            <Button
                                key={a.asset_identifier}
                                size="xs"
                                variant="link"
                                colorScheme="teal"
                                onClick={() => onGoToAsset(a.asset_identifier)}
                            >
                                Open {a.title} →
                            </Button>
                        ))}
                    </HStack>
                )}
            </Card>

            {/* Accountable working groups — committee accountability (editable). NOT identity.
                Keeping function in the key but accountability here is what makes the
                function-vs-accountability divergence queryable. */}
            <Card title="Accountable working groups">
                <Text fontSize="xs" color="gray.500" mb={2}>
                    The committee(s) accountable for this interface's accessibility — distinct from its
                    <strong> function</strong> (what it is for). Divergence between the two is diagnostic.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Working group"
                    placeholder="Select a working group…"
                    attached={wgAttached}
                    candidates={wgCandidates}
                    onAttach={(name) => assignWorkingGroupToInterface(iface.interface_identifier, name)}
                    onDetach={(name) => unassignWorkingGroupFromInterface(iface.interface_identifier, name)}
                    afterChange={refreshAll}
                    emptyLabel="No accountable working group set."
                />
            </Card>

            {/* Remediation — the Implementations that remediate this interface (editable).
                Attaching at least one clears the uncovered signal. */}
            <Card title="Remediated by">
                <Text fontSize="xs" color="gray.500" mb={2}>
                    The Implementations (Process / Project / Procedure / Service) whose work keeps this
                    interface accessible. An interface with no remediation is <strong>uncovered</strong>.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Implementation"
                    placeholder="Select an implementation…"
                    attached={remediationAttached}
                    candidates={remediationCandidates}
                    onAttach={(uid) => assignRemediationToInterface(iface.interface_identifier, implTypeByUid.get(uid), uid)}
                    onDetach={(uid) => unassignRemediationFromInterface(iface.interface_identifier, implTypeByUid.get(uid), uid)}
                    afterChange={refreshAll}
                    emptyLabel="No remediating implementation — this interface is uncovered."
                />
            </Card>

            <InterfaceForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                assets={assets}
                existingInterface={iface}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default InterfaceDetailPanel;
