import React, { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    CheckboxGroup,
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
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import {
    getKindOptions,
    getCoverageDomainOptions,
    getAudienceOptions,
    getProvenanceOptions,
} from './interfaceConfig';
import { createInterface } from '../../../services/api/post';
import { updateInterface } from '../../../services/api/put';

/**
 * Interface create/edit modal. Create is a plain POST (title + locus + opts);
 * edit is the `update` PUT action (interface_identifier immutable, no locus).
 *
 * The identifier is built from locus + a slug of the title, so locus is create-only:
 *   Backing asset chosen → locus = the asset_identifier, and presented_by is wired
 *                          on create (asset-backed; stewardship derives upward).
 *   No backing asset      → standalone: locus is the literal 'standalone' or a
 *                          campus abbreviation. presented_by stays empty (a valid state).
 *
 * `audience` is multi-valued (rendered as a checkbox group).
 *
 * Props: isOpen, onClose, assets (summaries for the backing-asset picker),
 *        presetAssetIdentifier (optional create prefill), existingInterface
 *        (edit mode + prefill), onSaved(interface|null).
 */
function InterfaceForm({ isOpen, onClose, assets = [], presetAssetIdentifier, existingInterface, onSaved }) {
    const isEdit = Boolean(existingInterface);
    const { campuses, vocab } = useSettings();
    const toast = useToast();
    const [form, setForm] = useState({
        title: '',
        interface_kind: [],
        coverage_domains: '',
        audience: [],
        provenance: '',
        description: '',
        backingAsset: '',
        locus: 'standalone',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            title: existingInterface?.title || '',
            interface_kind: Array.isArray(existingInterface?.interface_kind)
                ? existingInterface.interface_kind
                : (existingInterface?.interface_kind ? [existingInterface.interface_kind] : []),
            coverage_domains: existingInterface?.coverage_domains || '',
            audience: Array.isArray(existingInterface?.audience) ? existingInterface.audience : [],
            provenance: existingInterface?.provenance || '',
            description: existingInterface?.description || '',
            backingAsset: presetAssetIdentifier || '',
            locus: 'standalone',
        });
    }, [isOpen, existingInterface, presetAssetIdentifier]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const fields = {
                    title,
                    interface_kind: form.interface_kind,
                    coverage_domains: form.coverage_domains || null,
                    audience: form.audience,
                    provenance: form.provenance || null,
                    description: form.description.trim() || null,
                };
                const resp = await updateInterface(existingInterface.interface_identifier, fields);
                saved = resp?.data?.interface || null;
            } else {
                // Asset-backed → locus is the asset_identifier and we wire presented_by.
                // Standalone → locus is 'standalone' or a campus abbreviation.
                const locus = form.backingAsset || form.locus;
                if (!locus) {
                    toast({ title: 'A locus is required (pick a backing asset, a campus, or standalone).', status: 'error', duration: 2800, isClosable: true });
                    setSubmitting(false);
                    return;
                }
                const payload = { title, locus };
                if (form.backingAsset) payload.presented_by = form.backingAsset;
                if (form.interface_kind.length) payload.interface_kind = form.interface_kind;
                if (form.coverage_domains) payload.coverage_domains = form.coverage_domains;
                if (form.audience.length) payload.audience = form.audience;
                if (form.provenance) payload.provenance = form.provenance;
                if (form.description.trim()) payload.description = form.description.trim();
                const resp = await createInterface(payload);
                saved = resp?.data?.interface || null;
            }
            toast({ title: isEdit ? 'Interface updated.' : 'Interface created.', status: 'success', duration: 2000, isClosable: true });
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
                <ModalHeader>{isEdit ? 'Edit Interface' : 'Add Interface'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Title</FormLabel>
                            <Input size="sm" value={form.title} onChange={set('title')} placeholder="e.g. Course View" />
                        </FormControl>

                        {!isEdit && (
                            <>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Backing Asset</FormLabel>
                                    <Select size="sm" placeholder="None (standalone)" value={form.backingAsset} onChange={set('backingAsset')}>
                                        {assets.map((a) => (
                                            <option key={a.asset_identifier} value={a.asset_identifier}>
                                                {a.title} ({a.asset_identifier})
                                            </option>
                                        ))}
                                    </Select>
                                    <Text fontSize="2xs" color="gray.400" mt={1}>
                                        Asset-backed interfaces derive their §508 steward upward from the asset.
                                    </Text>
                                </FormControl>

                                <FormControl isRequired={!form.backingAsset}>
                                    <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Locus</FormLabel>
                                    {form.backingAsset ? (
                                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                            Locus is set to “{form.backingAsset}” automatically (asset-backed).
                                        </Text>
                                    ) : (
                                        <Select size="sm" value={form.locus} onChange={set('locus')}>
                                            <option value="standalone">Standalone</option>
                                            {(campuses || []).map((c) => (
                                                <option key={c.abbreviation} value={c.abbreviation}>{c.name} ({c.abbreviation})</option>
                                            ))}
                                        </Select>
                                    )}
                                </FormControl>
                            </>
                        )}

                        {isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Identifier</FormLabel>
                                <Input size="sm" value={existingInterface.interface_identifier} isReadOnly bg="gray.50" color="gray.500" />
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Kind</FormLabel>
                            <CheckboxGroup
                                value={form.interface_kind}
                                onChange={(vals) => setForm((p) => ({ ...p, interface_kind: vals }))}
                            >
                                <Wrap spacing={3}>
                                    {getKindOptions(vocab).map((o) => (
                                        <WrapItem key={o.key}>
                                            <Checkbox size="sm" value={o.key}>{o.label}</Checkbox>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CheckboxGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Coverage Domain</FormLabel>
                            <Select size="sm" placeholder="Select domain…" value={form.coverage_domains} onChange={set('coverage_domains')}>
                                {getCoverageDomainOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Audience</FormLabel>
                            <CheckboxGroup
                                value={form.audience}
                                onChange={(vals) => setForm((p) => ({ ...p, audience: vals }))}
                            >
                                <Wrap spacing={3}>
                                    {getAudienceOptions(vocab).map((o) => (
                                        <WrapItem key={o.key}>
                                            <Checkbox size="sm" value={o.key}>{o.label}</Checkbox>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CheckboxGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Provenance</FormLabel>
                            <Select size="sm" placeholder="Select provenance…" value={form.provenance} onChange={set('provenance')}>
                                {getProvenanceOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Select>
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

export default InterfaceForm;
