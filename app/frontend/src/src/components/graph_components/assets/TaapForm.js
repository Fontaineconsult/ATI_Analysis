import React, { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    FormControl,
    FormHelperText,
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
    SimpleGrid,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { getOutcomeOptions, getRiskOptions, getTaapStatusOptions, toISODate } from './assetConfig';
import { useSettings } from '../../../context/SettingsContext';
import { createTaap } from '../../../services/api/post';
import { updateTaap } from '../../../services/api/put';

/**
 * TAAP create/edit modal.
 *
 * Create is a plain POST. The server builds the taap_identifier from the covered
 * asset, the requesting unit and the creation year, and wires the required edges
 * (covers_asset, taap_at_campus, requested_by), so those three are required here and
 * fixed afterwards. Edit is the `update` PUT action keyed by taap_identifier.
 * `presetAssetIdentifier` locks the asset dropdown when launched from an asset's
 * "+ Add TAAP" shortcut.
 *
 * Props: isOpen, onClose, existingTaap, assets (summaries for the dropdown),
 *        presetAssetIdentifier, onSaved(taap|null).
 */
const EMPTY = {
    title: '',
    asset_identifier: '',
    campus_abbrev: '',
    requesting_unit: '',
    create_missing_unit: true,
    creation_date: '',
    effective_date: '',
    review_due: '',
    outcome: '',
    taap_status: 'draft',
    institutional_risk: '',
    accommodation_requirement: '',
    description: '',
    active: true,
};

function TaapForm({ isOpen, onClose, existingTaap, assets = [], presetAssetIdentifier, onSaved }) {
    const isEdit = Boolean(existingTaap);
    const toast = useToast();
    const { vocab, campuses = [], currentCampus } = useSettings();
    const [form, setForm] = useState(EMPTY);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            ...EMPTY,
            title: existingTaap?.title || '',
            asset_identifier: existingTaap
                ? (existingTaap.covers_asset?.[0]?.asset_identifier || '')
                : (presetAssetIdentifier || ''),
            campus_abbrev: existingTaap?.at_campus?.abbreviation || currentCampus || '',
            requesting_unit: existingTaap?.requested_by?.[0]?.name || '',
            creation_date: toISODate(existingTaap?.creation_date),
            effective_date: toISODate(existingTaap?.effective_date),
            review_due: toISODate(existingTaap?.review_due),
            outcome: existingTaap?.outcome || '',
            taap_status: existingTaap?.taap_status || 'draft',
            institutional_risk: existingTaap?.institutional_risk || '',
            accommodation_requirement: existingTaap?.accommodation_requirement || '',
            description: existingTaap?.description || '',
            active: existingTaap ? !!existingTaap.active : true,
        });
    }, [isOpen, existingTaap, presetAssetIdentifier, currentCampus]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }
        if (!isEdit) {
            if (!form.asset_identifier) { toast({ title: 'Covered asset is required.', status: 'error', duration: 2500, isClosable: true }); return; }
            if (!form.campus_abbrev) { toast({ title: 'Campus is required.', status: 'error', duration: 2500, isClosable: true }); return; }
            if (!form.requesting_unit.trim()) { toast({ title: 'Requesting unit is required.', status: 'error', duration: 2500, isClosable: true }); return; }
            if (!form.creation_date && !form.effective_date) {
                toast({ title: 'A creation date (or effective date) is required.', description: 'The identifier carries the plan year.', status: 'error', duration: 3000, isClosable: true });
                return;
            }
        }

        const optional = {};
        ['outcome', 'taap_status', 'institutional_risk', 'accommodation_requirement'].forEach((k) => {
            if (form[k]) optional[k] = form[k];
        });
        if (form.description.trim()) optional.description = form.description.trim();
        ['creation_date', 'effective_date', 'review_due'].forEach((k) => {
            if (form[k]) optional[k] = form[k];
        });

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const fields = {
                    title,
                    active: form.active,
                    outcome: form.outcome || null,
                    taap_status: form.taap_status || null,
                    institutional_risk: form.institutional_risk || null,
                    accommodation_requirement: form.accommodation_requirement || null,
                    description: form.description.trim() || null,
                    creation_date: form.creation_date || null,
                    effective_date: form.effective_date || null,
                    review_due: form.review_due || null,
                };
                const resp = await updateTaap(existingTaap.taap_identifier, fields);
                saved = resp?.data?.taap || null;
            } else {
                const payload = {
                    title,
                    asset_identifier: form.asset_identifier,
                    campus_abbrev: form.campus_abbrev,
                    requesting_unit: form.requesting_unit.trim(),
                    create_missing_unit: form.create_missing_unit,
                    active: form.active,
                    ...optional,
                };
                const resp = await createTaap(payload);
                saved = resp?.data?.taap || null;
            }
            toast({ title: isEdit ? 'TAAP updated.' : 'TAAP created.', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) onSaved(saved);
            onClose();
        } catch (error) {
            toast({
                title: isEdit ? 'Update failed.' : 'Create failed.',
                description: error?.response?.data?.error || error?.message || 'Please try again.',
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

    const labelProps = { fontSize: 'sm', fontWeight: 'semibold', color: 'gray.700' };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit TAAP' : 'Add TAAP'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel {...labelProps}>Title (product name)</FormLabel>
                            <Input size="sm" value={form.title} onChange={set('title')} />
                        </FormControl>

                        <FormControl isRequired={!isEdit}>
                            <FormLabel {...labelProps}>Covered Asset</FormLabel>
                            {isEdit ? (
                                <Input size="sm" value={coveredAssetDisplay()} isReadOnly bg="gray.50" color="gray.600" />
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

                        <SimpleGrid columns={2} spacing={3}>
                            <FormControl isRequired={!isEdit}>
                                <FormLabel {...labelProps}>Campus</FormLabel>
                                {isEdit ? (
                                    <Input size="sm" value={form.campus_abbrev} isReadOnly bg="gray.50" color="gray.600" />
                                ) : (
                                    <Select size="sm" placeholder="Select campus…" value={form.campus_abbrev} onChange={set('campus_abbrev')}>
                                        {campuses.map((c) => (
                                            <option key={c.abbreviation} value={c.abbreviation}>{c.name}</option>
                                        ))}
                                    </Select>
                                )}
                            </FormControl>
                            <FormControl isRequired={!isEdit}>
                                <FormLabel {...labelProps}>Requesting Unit</FormLabel>
                                <Input
                                    size="sm"
                                    value={form.requesting_unit}
                                    onChange={set('requesting_unit')}
                                    isReadOnly={isEdit}
                                    bg={isEdit ? 'gray.50' : 'white'}
                                    placeholder="Department whose purchase this covers"
                                />
                                {!isEdit && (
                                    <FormHelperText fontSize="xs">
                                        Part of the plan's identity. A unit the graph does not hold yet is created under the campus.
                                    </FormHelperText>
                                )}
                            </FormControl>
                        </SimpleGrid>

                        <SimpleGrid columns={3} spacing={3}>
                            <FormControl isRequired={!isEdit}>
                                <FormLabel {...labelProps}>Creation Date</FormLabel>
                                <Input size="sm" type="date" value={form.creation_date || ''} onChange={set('creation_date')} isReadOnly={isEdit} bg={isEdit ? 'gray.50' : 'white'} />
                            </FormControl>
                            <FormControl>
                                <FormLabel {...labelProps}>Effective Date</FormLabel>
                                <Input size="sm" type="date" value={form.effective_date || ''} onChange={set('effective_date')} />
                            </FormControl>
                            <FormControl>
                                <FormLabel {...labelProps}>Review Due</FormLabel>
                                <Input size="sm" type="date" value={form.review_due || ''} onChange={set('review_due')} />
                            </FormControl>
                        </SimpleGrid>

                        <SimpleGrid columns={2} spacing={3}>
                            <FormControl>
                                <FormLabel {...labelProps}>Outcome</FormLabel>
                                <Select size="sm" placeholder="Select outcome…" value={form.outcome} onChange={set('outcome')}>
                                    {getOutcomeOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel {...labelProps}>Status</FormLabel>
                                <Select size="sm" value={form.taap_status} onChange={set('taap_status')}>
                                    {getTaapStatusOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel {...labelProps}>Institutional Risk</FormLabel>
                                <Select size="sm" placeholder="Select…" value={form.institutional_risk} onChange={set('institutional_risk')}>
                                    {getRiskOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel {...labelProps}>Accommodation Requirement</FormLabel>
                                <Select size="sm" placeholder="Select…" value={form.accommodation_requirement} onChange={set('accommodation_requirement')}>
                                    {getRiskOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                </Select>
                            </FormControl>
                        </SimpleGrid>

                        <FormControl>
                            <FormLabel {...labelProps}>Description</FormLabel>
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
