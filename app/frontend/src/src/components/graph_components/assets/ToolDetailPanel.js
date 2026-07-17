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
import { fetchToolDetail } from '../../../services/api/get';
import {
    assignVendorToTool,
    unassignVendorFromTool,
    assignAssetToTool,
    unassignAssetFromTool,
    assignUsageToTool,
    unassignUsageFromTool,
} from '../../../services/api/put';
import { deleteTool } from '../../../services/api/delete';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import ToolForm from './ToolForm';

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
 * Right-column tool detail. Fetches full detail by tool_identifier, then renders stacked
 * cards: identity, supplier (Vendor — editable), parent asset (editable, ZeroOrOne), and
 * the implementations that use it (editable — the analog of Interface "Remediated by").
 * Edge mutations refresh both this panel and the parent.
 *
 * Props:
 *   toolIdentifier             Selected tool's business key, or null.
 *   assets                     Asset summaries, for the parent-asset picker.
 *   vendors                    Vendor summaries ({unique_id, name}), for the supplier picker.
 *   implementations            Flat [{type, unique_id, title}] of using impls, for the picker.
 *   onAfterMutate(deletedId?)  Parent refresh hook; called with the id on delete.
 *   onGoToAsset(assetId)       Optional: jump to the Assets tab and select an asset.
 */
function ToolDetailPanel({ toolIdentifier, assets = [], vendors = [], implementations = [], onAfterMutate, onGoToAsset }) {
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const reload = useCallback(async () => {
        if (!toolIdentifier) { setTool(null); return; }
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchToolDetail(toolIdentifier);
            setTool(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load tool.');
        } finally {
            setLoading(false);
        }
    }, [toolIdentifier]);

    useEffect(() => { reload(); }, [reload]);

    const refreshAll = useCallback(async () => {
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [reload, onAfterMutate]);

    // The selector keys on unique_id; resolve the value each API expects (vendor name,
    // asset_identifier, implementation type) from the candidate + attached lists.
    const vendorNameByUid = useMemo(() => {
        const m = new Map();
        vendors.forEach((v) => m.set(v.unique_id, v.name));
        (tool?.supplied_by || []).forEach((v) => m.set(v.unique_id, v.name));
        return m;
    }, [vendors, tool]);

    const assetIdByUid = useMemo(() => {
        const m = new Map();
        assets.forEach((a) => m.set(a.unique_id, a.asset_identifier));
        (tool?.parent_assets || []).forEach((a) => m.set(a.unique_id, a.asset_identifier));
        return m;
    }, [assets, tool]);

    const implTypeByUid = useMemo(() => {
        const m = new Map();
        implementations.forEach((i) => m.set(i.unique_id, i.type));
        (tool?.used_by || []).forEach((r) => m.set(r.unique_id, r.type));
        return m;
    }, [implementations, tool]);

    if (!toolIdentifier) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                    Select a tool on the left, or click <strong>Add Tool</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading tool…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!tool) return null;

    const handleDelete = async () => {
        if (!window.confirm('Delete this tool? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteTool(tool.tool_identifier);
            toast({ title: 'Tool deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterMutate) await onAfterMutate(tool.tool_identifier);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const vendorAttached = (tool.supplied_by || []).map((v) => ({ unique_id: v.unique_id, label: v.name }));
    const vendorCandidates = vendors.map((v) => ({ unique_id: v.unique_id, label: v.name }));

    const assetAttached = (tool.parent_assets || []).map((a) => ({ unique_id: a.unique_id, label: `${a.title} (${a.asset_identifier})` }));
    const assetCandidates = assets.map((a) => ({ unique_id: a.unique_id, label: `${a.title} (${a.asset_identifier})` }));

    const usageAttached = (tool.used_by || []).map((r) => ({ unique_id: r.unique_id, label: `${r.title} (${r.type})` }));
    const usageCandidates = implementations.map((i) => ({ unique_id: i.unique_id, label: `${i.title} (${i.type})` }));

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <Heading as="h2" size="md" color="gray.800">{tool.title || '(untitled)'}</Heading>
                        <Text fontSize="xs" color="gray.600">{tool.tool_identifier}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <Field label="Description" value={tool.description} />
            </Card>

            {/* Supplier */}
            <Card title="Supplier">
                <EntityAttachmentSelector
                    entityLabel="Vendor"
                    placeholder="Select a vendor…"
                    attached={vendorAttached}
                    candidates={vendorCandidates}
                    onAttach={(uid) => assignVendorToTool(tool.tool_identifier, vendorNameByUid.get(uid) || uid)}
                    onDetach={(uid) => unassignVendorFromTool(tool.tool_identifier, vendorNameByUid.get(uid) || uid)}
                    afterChange={refreshAll}
                    emptyLabel="No supplier linked."
                />
            </Card>

            {/* Parent assets (multi-valued) — set when this tool is also a stewarded asset */}
            <Card title="Parent assets">
                <Text fontSize="xs" color="gray.600" mb={2}>
                    Set when this tool is also a stewarded institutional asset. A tool can map to
                    several assets (e.g. the same product tracked at different scopes).
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Asset"
                    placeholder="Select an asset…"
                    attached={assetAttached}
                    candidates={assetCandidates}
                    onAttach={(uid) => assignAssetToTool(tool.tool_identifier, assetIdByUid.get(uid) || uid)}
                    onDetach={(uid) => unassignAssetFromTool(tool.tool_identifier, assetIdByUid.get(uid) || uid)}
                    afterChange={refreshAll}
                    emptyLabel="No parent asset (used without being a stewarded asset)."
                />
                {onGoToAsset && (tool.parent_assets || []).length > 0 && (
                    <HStack mt={2} spacing={2} flexWrap="wrap">
                        {tool.parent_assets.map((a) => (
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

            {/* Used by — the implementations that use this tool (editable) */}
            <Card title="Used by">
                <Text fontSize="xs" color="gray.600" mb={2}>
                    The Implementations (Process / Project / Procedure / Service) whose remediation work uses this tool.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Implementation"
                    placeholder="Select an implementation…"
                    attached={usageAttached}
                    candidates={usageCandidates}
                    onAttach={(uid) => assignUsageToTool(tool.tool_identifier, implTypeByUid.get(uid), uid)}
                    onDetach={(uid) => unassignUsageFromTool(tool.tool_identifier, implTypeByUid.get(uid), uid)}
                    afterChange={refreshAll}
                    emptyLabel="No implementation uses this tool yet."
                />
            </Card>

            <ToolForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                assets={assets}
                existingTool={tool}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default ToolDetailPanel;
