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
    getFunctionOptions,
    getCoverageDomainOptions,
    getAudienceOptions,
    getProvenanceOptions,
} from './interfaceConfig';
import { createInterface } from '../../../services/api/post';
import { updateInterface } from '../../../services/api/put';

/**
 * Interface create/edit modal.
 *
 * Identity is the four-coordinate signature backing--locus--function--title-slug, built
 * server-side. So on CREATE the user supplies title + locus (the structural zone, free
 * text) + function (institutional purpose), and optionally a backing asset (presented_by,
 * which supplies `backing`; absent => 'standalone').
 *
 * On EDIT those four coordinates are immutable (the backend rejects them) — only the
 * descriptive fields (description, coverage_domains, audience, provenance) are editable;
 * the identity coordinates render read-only. coverage_domains and audience are multi-valued.
 *
 * Props: isOpen, onClose, assets (summaries for the backing-asset picker),
 *        presetAssetIdentifier (optional create prefill), existingInterface
 *        (edit mode + prefill), onSaved(interface|null).
 */
function InterfaceForm({ isOpen, onClose, assets = [], presetAssetIdentifier, existingInterface, onSaved }) {
    const isEdit = Boolean(existingInterface);
    const { vocab } = useSettings();
    const toast = useToast();
    const [form, setForm] = useState({
        title: '',
        function: '',
        locus: '',
        backingAsset: '',
        coverage_domains: [],
        audience: [],
        provenance: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        // In edit mode existingInterface is the detail projection (presented_by is an array).
        const backingFromDetail = Array.isArray(existingInterface?.presented_by) && existingInterface.presented_by.length
            ? existingInterface.presented_by[0].asset_identifier
            : '';
        setForm({
            title: existingInterface?.title || '',
            function: existingInterface?.function || '',
            locus: existingInterface?.locus || '',
            backingAsset: backingFromDetail || presetAssetIdentifier || '',
            coverage_domains: Array.isArray(existingInterface?.coverage_domains) ? existingInterface.coverage_domains : [],
            audience: Array.isArray(existingInterface?.audience) ? existingInterface.audience : [],
            provenance: existingInterface?.provenance || '',
            description: existingInterface?.description || '',
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
                // Identity coordinates are immutable — only descriptive fields go up.
                const fields = {
                    coverage_domains: form.coverage_domains,
                    audience: form.audience,
                    provenance: form.provenance || null,
                    description: form.description.trim() || null,
                };
                const resp = await updateInterface(existingInterface.interface_identifier, fields);
                saved = resp?.data?.interface || null;
            } else {
                const locus = form.locus.trim();
                if (!locus) {
                    toast({ title: 'A locus is required (the structural zone, e.g. "course-shells").', status: 'error', duration: 2800, isClosable: true });
                    setSubmitting(false);
                    return;
                }
                if (!form.function) {
                    toast({ title: 'A function is required.', status: 'error', duration: 2800, isClosable: true });
                    setSubmitting(false);
                    return;
                }
                const payload = { title, locus, function: form.function };
                if (form.backingAsset) payload.presented_by = form.backingAsset;
                if (form.coverage_domains.length) payload.coverage_domains = form.coverage_domains;
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
                        {/* Identity coordinates — editable only on create */}
                        <FormControl isRequired={!isEdit}>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Title</FormLabel>
                            <Input
                                size="sm"
                                value={form.title}
                                onChange={set('title')}
                                placeholder="e.g. Canvas Course Shells"
                                isReadOnly={isEdit}
                                bg={isEdit ? 'gray.50' : undefined}
                                color={isEdit ? 'gray.500' : undefined}
                            />
                        </FormControl>

                        <FormControl isRequired={!isEdit}>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Function</FormLabel>
                            {isEdit ? (
                                <Input size="sm" value={form.function} isReadOnly bg="gray.50" color="gray.600" />
                            ) : (
                                <Select size="sm" placeholder="Select function…" value={form.function} onChange={set('function')}>
                                    {getFunctionOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                </Select>
                            )}
                            <Text fontSize="2xs" color="gray.600" mt={1}>
                                The institutional purpose this interface serves — an identity coordinate.
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Backing Asset</FormLabel>
                            {isEdit ? (
                                <Input
                                    size="sm"
                                    value={form.backingAsset || 'standalone'}
                                    isReadOnly
                                    bg="gray.50"
                                    color="gray.600"
                                />
                            ) : (
                                <Select size="sm" placeholder="None (standalone)" value={form.backingAsset} onChange={set('backingAsset')}>
                                    {assets.map((a) => (
                                        <option key={a.asset_identifier} value={a.asset_identifier}>
                                            {a.title} ({a.asset_identifier})
                                        </option>
                                    ))}
                                </Select>
                            )}
                            <Text fontSize="2xs" color="gray.600" mt={1}>
                                Asset-backed interfaces derive their §508 steward upward from the asset. Standalone is a valid state.
                            </Text>
                        </FormControl>

                        <FormControl isRequired={!isEdit}>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Locus</FormLabel>
                            <Input
                                size="sm"
                                value={form.locus}
                                onChange={set('locus')}
                                placeholder="e.g. course-shells"
                                isReadOnly={isEdit}
                                bg={isEdit ? 'gray.50' : undefined}
                                color={isEdit ? 'gray.500' : undefined}
                            />
                            <Text fontSize="2xs" color="gray.600" mt={1}>
                                The structural zone within the backing (free text). An identity coordinate.
                            </Text>
                        </FormControl>

                        {isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Identifier</FormLabel>
                                <Input size="sm" value={existingInterface.interface_identifier} isReadOnly bg="gray.50" color="gray.600" />
                            </FormControl>
                        )}

                        {/* Descriptive fields — editable in both modes */}
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Coverage Domains</FormLabel>
                            <CheckboxGroup
                                value={form.coverage_domains}
                                onChange={(vals) => setForm((p) => ({ ...p, coverage_domains: vals }))}
                            >
                                <Wrap spacing={3}>
                                    {getCoverageDomainOptions(vocab).map((o) => (
                                        <WrapItem key={o.key}>
                                            <Checkbox size="sm" value={o.key}>{o.label}</Checkbox>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CheckboxGroup>
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
