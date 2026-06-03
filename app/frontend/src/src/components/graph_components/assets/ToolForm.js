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
import { fetchVendors } from '../../../services/api/get';
import { createTool } from '../../../services/api/post';
import { updateTool } from '../../../services/api/put';

/**
 * Tool create/edit modal. Create is a plain POST (title + opts); edit is the `update`
 * PUT action (tool_identifier immutable). The identifier is the slug of the title, so
 * it's create-only (shown read-only on edit).
 *
 * Supplier (Vendor) and parent Asset are optional and only offered on create; they're
 * also editable from the detail panel. Both are deferred-friendly: a tool with neither
 * is valid (many tools are used without being stewarded assets).
 *
 * Props: isOpen, onClose, assets (summaries for the parent-asset picker),
 *        existingTool (edit mode + prefill), onSaved(tool|null).
 */
function ToolForm({ isOpen, onClose, assets = [], existingTool, onSaved }) {
    const isEdit = Boolean(existingTool);
    const toast = useToast();
    const [form, setForm] = useState({ title: '', description: '', supplied_by: '', parent_asset: '' });
    const [submitting, setSubmitting] = useState(false);
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            title: existingTool?.title || '',
            description: existingTool?.description || '',
            supplied_by: '',
            parent_asset: '',
        });
    }, [isOpen, existingTool]);

    // Vendors only needed for the supplier dropdown on create.
    useEffect(() => {
        if (!isOpen || isEdit) return;
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchVendors();
                if (!cancelled) setVendors(Array.isArray(resp?.data) ? resp.data : []);
            } catch (_) { /* non-fatal: supplier is optional */ }
        })();
        return () => { cancelled = true; };
    }, [isOpen, isEdit]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const resp = await updateTool(existingTool.tool_identifier, {
                    title,
                    description: form.description.trim() || null,
                });
                saved = resp?.data?.tool || null;
            } else {
                const payload = { title };
                if (form.description.trim()) payload.description = form.description.trim();
                if (form.supplied_by) payload.supplied_by = form.supplied_by;
                if (form.parent_asset) payload.parent_asset = form.parent_asset;
                const resp = await createTool(payload);
                saved = resp?.data?.tool || null;
            }
            toast({ title: isEdit ? 'Tool updated.' : 'Tool created.', status: 'success', duration: 2000, isClosable: true });
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit Tool' : 'Add Tool'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Title</FormLabel>
                            <Input size="sm" value={form.title} onChange={set('title')} placeholder="e.g. Pope Tech" />
                        </FormControl>

                        {isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Identifier</FormLabel>
                                <Input size="sm" value={existingTool.tool_identifier} isReadOnly bg="gray.50" color="gray.500" />
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Description</FormLabel>
                            <Textarea size="sm" rows={3} value={form.description} onChange={set('description')} />
                        </FormControl>

                        {!isEdit && (
                            <>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Supplier (Vendor)</FormLabel>
                                    <Select size="sm" placeholder="None" value={form.supplied_by} onChange={set('supplied_by')}>
                                        {vendors.map((v) => (
                                            <option key={v.unique_id} value={v.name}>{v.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Parent Asset</FormLabel>
                                    <Select size="sm" placeholder="None" value={form.parent_asset} onChange={set('parent_asset')}>
                                        {assets.map((a) => (
                                            <option key={a.asset_identifier} value={a.asset_identifier}>
                                                {a.title} ({a.asset_identifier})
                                            </option>
                                        ))}
                                    </Select>
                                    <Text fontSize="2xs" color="gray.400" mt={1}>
                                        Set only when the tool is also a stewarded institutional asset.
                                    </Text>
                                </FormControl>
                            </>
                        )}
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

export default ToolForm;
