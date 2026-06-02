import React, { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
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
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { getOutcomeOptions, toISODate } from './assetConfig';
import { useSettings } from '../../../context/SettingsContext';
import { createTaap } from '../../../services/api/post';
import { updateTaap } from '../../../services/api/put';

/**
 * TAAP create/edit modal. Create is a plain POST requiring title + asset_identifier
 * (the required covers_asset edge); edit is the `update` PUT action with title and
 * the covered asset immutable. `presetAssetIdentifier` locks the asset dropdown
 * when launched from an asset's "+ Add TAAP" shortcut.
 *
 * Props: isOpen, onClose, existingTaap, assets (summaries for the dropdown),
 *        presetAssetIdentifier, onSaved(taap|null).
 */
function TaapForm({ isOpen, onClose, existingTaap, assets = [], presetAssetIdentifier, onSaved }) {
    const isEdit = Boolean(existingTaap);
    const toast = useToast();
    const { vocab } = useSettings();
    const [form, setForm] = useState({
        title: '',
        asset_identifier: '',
        outcome: '',
        effective_date: '',
        review_due: '',
        description: '',
        active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            title: existingTaap?.title || '',
            asset_identifier: existingTaap
                ? (existingTaap.covers_asset?.[0]?.asset_identifier || '')
                : (presetAssetIdentifier || ''),
            outcome: existingTaap?.outcome || '',
            effective_date: toISODate(existingTaap?.effective_date),
            review_due: toISODate(existingTaap?.review_due),
            description: existingTaap?.description || '',
            active: existingTaap ? !!existingTaap.active : true,
        });
    }, [isOpen, existingTaap, presetAssetIdentifier]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }
        if (!isEdit && !form.asset_identifier) {
            toast({ title: 'Covered asset is required.', status: 'error', duration: 2500, isClosable: true });
            return;
        }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const fields = {
                    active: form.active,
                    outcome: form.outcome || null,
                    description: form.description.trim() || null,
                    effective_date: form.effective_date || null,
                    review_due: form.review_due || null,
                };
                const resp = await updateTaap(existingTaap.title, fields);
                saved = resp?.data?.taap || null;
            } else {
                const payload = { title, asset_identifier: form.asset_identifier, active: form.active };
                if (form.outcome) payload.outcome = form.outcome;
                if (form.description.trim()) payload.description = form.description.trim();
                if (form.effective_date) payload.effective_date = form.effective_date;
                if (form.review_due) payload.review_due = form.review_due;
                const resp = await createTaap(payload);
                saved = resp?.data?.taap || null;
            }
            toast({ title: isEdit ? 'TAAP updated.' : 'TAAP created.', status: 'success', duration: 2000, isClosable: true });
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

    const coveredAssetDisplay = () => {
        const a = existingTaap?.covers_asset?.[0];
        if (!a) return '—';
        return a.title ? `${a.title} (${a.asset_identifier})` : (a.asset_identifier || '—');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit TAAP' : 'Add TAAP'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Title</FormLabel>
                            <Input size="sm" value={form.title} onChange={set('title')} isReadOnly={isEdit} bg={isEdit ? 'gray.50' : 'white'} />
                        </FormControl>

                        <FormControl isRequired={!isEdit}>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Covered Asset</FormLabel>
                            {isEdit ? (
                                <Input size="sm" value={coveredAssetDisplay()} isReadOnly bg="gray.50" color="gray.500" />
                            ) : (
                                <Select
                                    size="sm"
                                    placeholder="Select asset…"
                                    value={form.asset_identifier}
                                    onChange={set('asset_identifier')}
                                    isDisabled={Boolean(presetAssetIdentifier)}
                                >
                                    {assets.map((a) => (
                                        <option key={a.asset_identifier} value={a.asset_identifier}>
                                            {a.title} ({a.asset_identifier})
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Outcome</FormLabel>
                            <Select size="sm" placeholder="Select outcome…" value={form.outcome} onChange={set('outcome')}>
                                {getOutcomeOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Effective Date</FormLabel>
                            <Input size="sm" type="date" value={form.effective_date || ''} onChange={set('effective_date')} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Review Due</FormLabel>
                            <Input size="sm" type="date" value={form.review_due || ''} onChange={set('review_due')} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Description</FormLabel>
                            <Textarea size="sm" rows={3} value={form.description} onChange={set('description')} />
                        </FormControl>

                        <Checkbox
                            isChecked={form.active}
                            onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                            colorScheme="teal"
                        >
                            Active
                        </Checkbox>
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

export default TaapForm;
