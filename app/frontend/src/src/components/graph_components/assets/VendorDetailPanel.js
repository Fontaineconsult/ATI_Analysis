import React, { useCallback, useContext, useMemo, useState } from 'react';
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
import { UserContext } from '../../../context/UserContext';
import { fetchVendorDetail } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';
import { assignEmployeeToVendor, unassignEmployeeFromVendor } from '../../../services/api/put';
import { deleteVendor } from '../../../services/api/delete';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import VendorForm from './VendorForm';

const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

/**
 * Right-column vendor detail. Fetches full detail by name, renders editable
 * identity (name/location), a read-only list of supplied assets (impact view,
 * also surfaced before delete), and employee (employs) assignment.
 *
 * Props:
 *   vendorName             Selected vendor's name, or null.
 *   onAfterMutate(deletedName?)  Parent refresh hook; called with name on delete.
 *   onReselect(newName)    Called after a rename so the parent points selection
 *                          at the new name (the detail then reloads).
 *   onGoToAsset(assetId)   Optional: jump to the Assets tab and select.
 */
function VendorDetailPanel({ vendorName, onAfterMutate, onReselect, onGoToAsset }) {
    const userCtx = useContext(UserContext);
    const toast = useToast();
    const editDisclosure = useDisclosure();
    // One cache entry per record, keyed by its business key, so re-opening a
    // record you already looked at is free and the parent's list and this panel
    // read one store rather than two copies of the truth.
    const { data: detailResp, loading, error, reload } = useResource(
        vendorName ? KEYS.vendorDetail(vendorName) : null,
        () => fetchVendorDetail(vendorName),
    );
    const vendor = detailResp?.data || null;
    const [deleting, setDeleting] = useState(false);

    const candidatePersons = useMemo(
        () => (userCtx?.individuals || [])
            .filter((p) => p.active || p.non_committee_member_active)
            .map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title })),
        [userCtx],
    );

    const { invalidateNamespace } = useInvalidateResources();

    // A write here can move list badges and stat counts as well as this one
    // record, so whole namespaces go rather than just this key. Refetching an
    // extra list costs a request nobody waits for; showing a stale one costs
    // trust in the screen.
    const invalidateDomain = useCallback(() => {
        [NS.vendors, NS.orgUnits, NS.assets].forEach(invalidateNamespace);
    }, [invalidateNamespace]);

    const refreshAll = useCallback(async () => {
        invalidateDomain();
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [invalidateDomain, reload, onAfterMutate]);

    if (!vendorName) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                    Select a vendor on the left, or click <strong>Add Vendor</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading vendor…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!vendor) return null;

    const supplies = vendor.supplies || [];

    const handleDelete = async () => {
        const msg = supplies.length
            ? `Delete vendor "${vendor.name}"? It currently supplies ${supplies.length} asset(s); those supplier links will be removed (the assets themselves remain). This cannot be undone.`
            : `Delete vendor "${vendor.name}"? This cannot be undone.`;
        if (!window.confirm(msg)) return;
        setDeleting(true);
        try {
            await deleteVendor(vendor.name);
            toast({ title: 'Vendor deleted.', status: 'success', duration: 2000, isClosable: true });
            invalidateDomain();
            if (onAfterMutate) await onAfterMutate(vendor.name);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={1} flex="1" minW="0">
                        <Heading as="h2" size="md" color="gray.800">{vendor.name}</Heading>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>
                <Divider my={3} borderColor="gray.200" />
                <Box>
                    <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Location</Text>
                    {vendor.location
                        ? <Text fontSize="sm" color="gray.800">{vendor.location}</Text>
                        : <Text fontSize="sm" color="gray.600" fontStyle="italic">Not set</Text>}
                </Box>
            </Card>

            {/* Supplied assets (read-only; managed from the asset side) */}
            <Card title="Supplies (assets)">
                {supplies.length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">This vendor supplies no assets yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1}>
                        {supplies.map((a) => (
                            <Text
                                key={a.asset_identifier}
                                fontSize="sm"
                                color={onGoToAsset ? 'teal.600' : 'gray.800'}
                                cursor={onGoToAsset ? 'pointer' : 'default'}
                                onClick={() => onGoToAsset && onGoToAsset(a.asset_identifier)}
                            >
                                {a.title} ({a.asset_identifier})
                            </Text>
                        ))}
                    </VStack>
                )}
            </Card>

            {/* Employees */}
            <Card title="Employees">
                <PersonAssignmentSelector
                    assignedPersons={(vendor.employs || []).map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title }))}
                    candidatePersons={candidatePersons}
                    onAssign={(uid) => assignEmployeeToVendor(vendor.name, uid)}
                    onUnassign={(uid) => unassignEmployeeFromVendor(vendor.name, uid)}
                    afterChange={refreshAll}
                    placeholder="Select person to add"
                />
            </Card>

            <VendorForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingVendor={vendor}
                onSaved={async (saved) => {
                    if (saved?.name && saved.name !== vendor.name) {
                        // Renamed: refresh the list, then point selection at the new
                        // name so the detail reloads under the new key.
                        if (onAfterMutate) await onAfterMutate();
                        if (onReselect) onReselect(saved.name);
                    } else {
                        await refreshAll();
                    }
                }}
            />
        </VStack>
    );
}

export default VendorDetailPanel;
