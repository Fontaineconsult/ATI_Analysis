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
    Tag,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { fetchAssetDetail, fetchVendors } from '../../../services/api/get';
import {
    assignVendorToAsset,
    unassignVendorFromAsset,
    assignCampusToAsset,
    unassignCampusFromAsset,
} from '../../../services/api/put';
import { deleteAsset } from '../../../services/api/delete';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import { ScopeBadge, ClassBadge, ElevationBadge } from './AssetBadges';
import { getOutcomeColor, getOutcomeLabel } from './assetConfig';
import AssetForm from './AssetForm';
import StewardshipCard from './StewardshipCard';

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
 * Right-column asset detail. Fetches full detail by asset_identifier (the list
 * carries only summaries), then renders stacked cards: identity, §508
 * stewardship, provenance (vendor + campus), read-only remediation, and
 * read-only TAAP coverage. Edge mutations refresh both this panel and the parent
 * (so the list ⚠ badges and stat counts stay current).
 *
 * Props:
 *   assetIdentifier        Selected asset's business key, or null.
 *   onAfterMutate(deletedId?) Parent refresh hook; called with the id on delete.
 *   onAddTaapForAsset(id)  Optional: open the TAAP form pre-filled for this asset.
 *   onGoToTaaps(title)     Optional: jump to the TAAPs tab and select a TAAP.
 */
function AssetDetailPanel({ assetIdentifier, onAfterMutate, onAddTaapForAsset, onGoToTaaps }) {
    const { campuses } = useSettings();
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [vendors, setVendors] = useState([]);

    const reload = useCallback(async () => {
        if (!assetIdentifier) { setAsset(null); return; }
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchAssetDetail(assetIdentifier);
            setAsset(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load asset.');
        } finally {
            setLoading(false);
        }
    }, [assetIdentifier]);

    useEffect(() => { reload(); }, [reload]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const r = await fetchVendors();
                if (!cancelled) setVendors(Array.isArray(r?.data) ? r.data : []);
            } catch (_) { /* non-fatal */ }
        })();
        return () => { cancelled = true; };
    }, []);

    const refreshAll = useCallback(async () => {
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [reload, onAfterMutate]);

    // assign_vendor / unassign_vendor take a vendor NAME; the selector keys on
    // unique_id, so resolve name from the candidate + attached lists.
    const vendorNameById = useMemo(() => {
        const m = new Map();
        vendors.forEach((v) => m.set(v.unique_id, v.name));
        (asset?.supplied_by || []).forEach((v) => m.set(v.unique_id, v.name));
        return m;
    }, [vendors, asset]);

    if (!assetIdentifier) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                    Select an asset on the left, or click <strong>Add Asset</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading asset…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!asset) return null;

    const handleDelete = async () => {
        if (!window.confirm('Delete this asset? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteAsset(asset.asset_identifier);
            toast({ title: 'Asset deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterMutate) await onAfterMutate(asset.asset_identifier);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const campusAttached = asset.at_campus
        ? [{ unique_id: asset.at_campus.abbreviation, label: asset.at_campus.name }]
        : [];
    const campusCandidates = (campuses || []).map((c) => ({ unique_id: c.abbreviation, label: c.name }));
    const vendorAttached = (asset.supplied_by || []).map((v) => ({ unique_id: v.unique_id, label: v.name }));
    const vendorCandidates = vendors.map((v) => ({ unique_id: v.unique_id, label: v.name }));

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={2} flexWrap="wrap">
                            <ScopeBadge scope={asset.scope} />
                            {asset.asset_class && <ClassBadge assetClass={asset.asset_class} />}
                            {asset.elevation_signal && <ElevationBadge />}
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{asset.title || '(untitled)'}</Heading>
                        <Text fontSize="xs" color="gray.600">{asset.asset_identifier}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <VStack align="stretch" spacing={3}>
                    {asset.elevation_signal && (
                        <Alert status="warning" borderRadius="md" fontSize="sm">
                            <AlertIcon />
                            Stewarded but not yet remediated — accessibility responsibility has elevated to the institution (Title II §35.205).
                        </Alert>
                    )}
                    <Field label="Version" value={asset.version} />
                    <Field label="Description" value={asset.description} />
                </VStack>
            </Card>

            {/* Stewardship */}
            <Card title="Stewardship (§508)">
                <StewardshipCard asset={asset} onChanged={refreshAll} />
            </Card>

            {/* Provenance */}
            <Card title="Provenance">
                <VStack align="stretch" spacing={4}>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={2}>Vendor (supplier)</Text>
                        <EntityAttachmentSelector
                            entityLabel="Vendor"
                            placeholder="Select a vendor…"
                            attached={vendorAttached}
                            candidates={vendorCandidates}
                            onAttach={(uid) => assignVendorToAsset(asset.asset_identifier, vendorNameById.get(uid) || uid)}
                            onDetach={(uid) => unassignVendorFromAsset(asset.asset_identifier, vendorNameById.get(uid) || uid)}
                            afterChange={refreshAll}
                            emptyLabel="No vendor linked yet."
                        />
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={2}>Campus anchor</Text>
                        <EntityAttachmentSelector
                            entityLabel="Campus"
                            placeholder="Select a campus…"
                            attached={campusAttached}
                            candidates={campusCandidates}
                            onAttach={(abbrev) => assignCampusToAsset(asset.asset_identifier, abbrev)}
                            onDetach={(abbrev) => unassignCampusFromAsset(asset.asset_identifier, abbrev)}
                            afterChange={refreshAll}
                            emptyLabel="No campus anchor set."
                        />
                    </Box>
                </VStack>
            </Card>

            {/* Remediation (read-only; flows from implementations) */}
            <Card title="Remediated by">
                {(asset.remediated_by || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                        No remediating implementation — a stewarded asset in this state shows the elevation signal.
                    </Text>
                ) : (
                    <VStack align="stretch" spacing={2}>
                        {asset.remediated_by.map((r) => (
                            <HStack key={`${r.type}-${r.unique_id}`} justify="space-between">
                                <Text fontSize="sm" color="gray.800">{r.title}</Text>
                                <Tag size="sm" colorScheme="purple" variant="subtle">{r.type}</Tag>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Card>

            {/* TAAP coverage (read-only here; full CRUD lives in the TAAPs tab) */}
            <Card title="TAAP coverage">
                <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color="gray.600">Temporary Alternate Access Plans covering this asset.</Text>
                    {onAddTaapForAsset && (
                        <Button size="xs" variant="outline" colorScheme="teal" onClick={() => onAddTaapForAsset(asset.asset_identifier)}>
                            + Add TAAP
                        </Button>
                    )}
                </HStack>
                {(asset.covered_by_taap || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">No TAAP covers this asset.</Text>
                ) : (
                    <VStack align="stretch" spacing={2}>
                        {asset.covered_by_taap.map((t) => (
                            <HStack
                                key={t.title}
                                justify="space-between"
                                cursor={onGoToTaaps ? 'pointer' : 'default'}
                                onClick={() => onGoToTaaps && onGoToTaaps(t.title)}
                                _hover={onGoToTaaps ? { bg: 'gray.50' } : {}}
                                p={1}
                                borderRadius="md"
                            >
                                <Text fontSize="sm" color="gray.800">{t.title}</Text>
                                <HStack>
                                    {t.outcome && <Tag size="sm" colorScheme={getOutcomeColor(t.outcome)} variant="subtle">{getOutcomeLabel(t.outcome)}</Tag>}
                                    <Tag size="sm" colorScheme={t.active ? 'green' : 'gray'} variant="subtle">{t.active ? 'Active' : 'Inactive'}</Tag>
                                </HStack>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Card>

            <AssetForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingAsset={asset}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default AssetDetailPanel;
