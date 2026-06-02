import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { ASSET_SCOPES, ASSET_SCOPE_ORDER, ASSET_CLASSES, ASSET_CLASS_ORDER } from './assetConfig';
import { fetchVendors } from '../../../services/api/get';
import { createAsset } from '../../../services/api/post';
import { updateAsset } from '../../../services/api/put';

/**
 * Asset create/edit modal. Create is a plain POST (title + scope + locus + opts);
 * edit is the `update` PUT action (identifier immutable, no locus). The `locus`
 * input is scope-aware and create-only because it builds the immutable
 * asset_identifier:
 *   systemwide / regional → locus is the literal scope value (auto)
 *   campus                → campus abbreviation (dropdown from SettingsContext)
 *   vendor                → vendor name (dropdown; slugified server-side)
 *
 * Props: isOpen, onClose, existingAsset (edit mode + prefill), onSaved(asset|null).
 */
function AssetForm({ isOpen, onClose, existingAsset, onSaved }) {
    const isEdit = Boolean(existingAsset);
    const { campuses } = useSettings();
    const toast = useToast();
    const [form, setForm] = useState({ title: '', scope: '', asset_class: '', version: '', description: '', locus: '' });
    const [submitting, setSubmitting] = useState(false);
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            title: existingAsset?.title || '',
            scope: existingAsset?.scope || '',
            asset_class: existingAsset?.asset_class || '',
            version: existingAsset?.version || '',
            description: existingAsset?.description || '',
            locus: '',
        });
    }, [isOpen, existingAsset]);

    // Vendors only needed when choosing a vendor-scoped locus on create.
    useEffect(() => {
        if (!isOpen || isEdit) return;
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchVendors();
                if (!cancelled) setVendors(Array.isArray(resp?.data) ? resp.data : []);
            } catch (_) { /* non-fatal: user can still pick another scope */ }
        })();
        return () => { cancelled = true; };
    }, [isOpen, isEdit]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }
        if (!form.scope) { toast({ title: 'Scope is required.', status: 'error', duration: 2000, isClosable: true }); return; }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const fields = { title, scope: form.scope };
                fields.asset_class = form.asset_class || null;
                fields.version = form.version.trim() || null;
                fields.description = form.description.trim() || null;
                const resp = await updateAsset(existingAsset.asset_identifier, fields);
                saved = resp?.data?.asset || null;
            } else {
                let locus = form.locus.trim();
                if (form.scope === 'systemwide' || form.scope === 'regional') locus = form.scope;
                if (!locus) {
                    toast({ title: 'A locus is required for this scope.', status: 'error', duration: 2500, isClosable: true });
                    setSubmitting(false);
                    return;
                }
                const payload = { title, scope: form.scope, locus };
                if (form.asset_class) payload.asset_class = form.asset_class;
                if (form.version.trim()) payload.version = form.version.trim();
                if (form.description.trim()) payload.description = form.description.trim();
                const resp = await createAsset(payload);
                saved = resp?.data?.asset || null;
            }
            toast({ title: isEdit ? 'Asset updated.' : 'Asset created.', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) onSaved(saved);
            onClose();
        } catch (error) {
            toast({
                title: isEdit ? 'Update failed.' : 'Create failed.',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3500,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderLocus = () => {
        if (form.scope === 'systemwide' || form.scope === 'regional') {
            return <Text fontSize="sm" color="gray.500" fontStyle="italic">Locus is set to “{form.scope}” automatically.</Text>;
        }
        if (form.scope === 'campus') {
            return (
                <Select size="sm" placeholder="Select campus…" value={form.locus} onChange={set('locus')}>
                    {(campuses || []).map((c) => (
                        <option key={c.abbreviation} value={c.abbreviation}>{c.name} ({c.abbreviation})</option>
                    ))}
                </Select>
            );
        }
        if (form.scope === 'vendor') {
            return (
                <>
                    <Select size="sm" placeholder="Select vendor…" value={form.locus} onChange={set('locus')}>
                        {vendors.map((v) => (
                            <option key={v.unique_id} value={v.name}>{v.name}</option>
                        ))}
                    </Select>
                    <Text fontSize="2xs" color="gray.400" mt={1}>The vendor name is slugified into the identifier.</Text>
                </>
            );
        }
        return <Text fontSize="sm" color="gray.400" fontStyle="italic">Choose a scope first.</Text>;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit Asset' : 'Add Asset'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Title</FormLabel>
                            <Input size="sm" value={form.title} onChange={set('title')} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Scope</FormLabel>
                            <Select size="sm" placeholder="Select scope…" value={form.scope} onChange={set('scope')}>
                                {ASSET_SCOPE_ORDER.map((k) => <option key={k} value={k}>{ASSET_SCOPES[k].label}</option>)}
                            </Select>
                        </FormControl>

                        {!isEdit && (
                            <FormControl isRequired={form.scope === 'campus' || form.scope === 'vendor'}>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Locus</FormLabel>
                                {renderLocus()}
                            </FormControl>
                        )}

                        {isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Identifier</FormLabel>
                                <Input size="sm" value={existingAsset.asset_identifier} isReadOnly bg="gray.50" color="gray.500" />
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Asset Class</FormLabel>
                            <Select size="sm" placeholder="Select class…" value={form.asset_class} onChange={set('asset_class')}>
                                {ASSET_CLASS_ORDER.map((k) => <option key={k} value={k}>{ASSET_CLASSES[k].label}</option>)}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Version</FormLabel>
                            <Input size="sm" value={form.version} onChange={set('version')} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Description</FormLabel>
                            <Textarea size="sm" rows={3} value={form.description} onChange={set('description')} />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={submitting}
                        loadingText={isEdit ? 'Saving…' : 'Creating…'}
                    >
                        {isEdit ? 'Save Changes' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default AssetForm;
