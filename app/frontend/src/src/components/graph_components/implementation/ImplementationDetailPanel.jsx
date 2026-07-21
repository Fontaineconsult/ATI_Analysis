import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Divider,
    FormControl,
    FormLabel,
    HStack,
    Heading,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    Tooltip,
    VStack,
    Wrap,
    WrapItem,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, CopyIcon, EditIcon, LinkIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../common/Card';
import {
    allDocumentsDepreciated,
    hasAssets,
    hasParticipants,
    isDimensioned,
    strengthConfig,
    typeColor,
    typeLabel,
} from './implementationConfig';
import {
    assignPersonAsOwner,
    copyEvidenceToCampuses,
    retireImplementation,
    setImplementationDimensions,
    unassignPersonAsOwner,
    updateImplementation,
} from '../../../services/api/put';
import { fetchAllDimensions } from '../../../services/api/get';
import { unassignImplementationFromYSE } from '../../../services/api/delete';
import { navigateToIndicator } from '../../../services/utils/tools';
import { useDescriptors } from '../../../hooks/useDescriptors';
import { SettingsContext } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import { HelpTip } from '../../functional_components/DescriptorHelp';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import YseAssignmentSelector from '../../functional_components/YseAssignmentSelector';
import ImplementationRemediationManager from './ImplementationRemediationManager';
import ParticipantsEditor from '../../implementation_explorer/ParticipantsEditor';
import SupportingDocumentationTabs from '../../implementation_explorer/doc_components/SupportingDocumentationTabs';

const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : null);

/**
 * Right-column detail/edit view for the implementations master-detail. Replaces
 * ImplementationTypeOverview's tabbed right panel with the canon Card-stack
 * (design-sense §3.3): identity header → Details → Evidence For → Owners →
 * Participants (doing) → Assets (doing) → Supporting Documentation. Reuses the
 * existing sub-editors unchanged.
 *
 * Props:
 *   implementation   The selected implementation object (carries `.type`), or null.
 *   onAfterChange()  Refetch callback (DataContext.refreshImplementations) — the
 *                    parent re-derives `implementation` from fresh data, so this
 *                    panel never holds a stale snapshot.
 */
function ImplementationDetailPanel({ implementation, onAfterChange }) {
    const { campus } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { currentAcademicYear, campuses: allCampuses } = useContext(SettingsContext);
    const { individuals, loadAllIndividuals } = useContext(UserContext);
    const { describeField } = useDescriptors();
    const { isOpen: isManageYsesOpen, onOpen: onManageYsesOpen, onClose: onManageYsesClose } = useDisclosure();
    const { isOpen: isManageRemediationOpen, onOpen: onManageRemediationOpen, onClose: onManageRemediationClose } = useDisclosure();

    const type = implementation?.type;
    const dimensioned = isDimensioned(type);
    const participantType = hasParticipants(type);
    const assetType = hasAssets(type);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', dimensions: [] });
    const [dimensionOptions, setDimensionOptions] = useState([]);
    const [removingYse, setRemovingYse] = useState(null);

    // Retirement lifecycle (retire modal + unretire confirm).
    const { isOpen: isRetireOpen, onOpen: onRetireOpen, onClose: onRetireClose } = useDisclosure();
    const retireDateRef = useRef(null);
    const [retireForm, setRetireForm] = useState({ date: '', note: '' });
    const [retiring, setRetiring] = useState(false);

    // Copy-to-campuses (duplicate this year's evidence links at other campuses).
    const { isOpen: isCopyOpen, onOpen: onCopyOpen, onClose: onCopyClose } = useDisclosure();
    const [copyTargets, setCopyTargets] = useState([]);
    const [copyPeople, setCopyPeople] = useState(true);
    const [copying, setCopying] = useState(false);

    const refresh = () => { if (onAfterChange) onAfterChange(); };

    // Owner / participant pickers need the individuals list.
    useEffect(() => {
        if (!individuals && loadAllIndividuals) loadAllIndividuals();
    }, [individuals, loadAllIndividuals]);

    // AMM dimension options for the Details multi-select (classifiable types only).
    useEffect(() => {
        if (!dimensioned) return;
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchAllDimensions();
                if (!cancelled) setDimensionOptions(resp?.data?.items || []);
            } catch (_) { /* non-fatal: control just shows no options */ }
        })();
        return () => { cancelled = true; };
    }, [dimensioned]);

    // Drop out of edit mode whenever the selection changes.
    useEffect(() => { setIsEditing(false); }, [implementation?.unique_id]);

    if (!implementation) {
        return (
            <Box
                p={10}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="lg"
                bg="gray.50"
                textAlign="center"
            >
                <Text color="gray.600" fontSize="sm">
                    Select an implementation on the left to view and edit it.
                </Text>
            </Box>
        );
    }

    const handleEdit = () => {
        setEditForm({
            title: implementation.title || '',
            description: implementation.description || '',
            dimensions: (implementation.dimensions || []).map((d) => d.handle),
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({ title: '', description: '', dimensions: [] });
    };

    const handleSave = async () => {
        try {
            await updateImplementation(type, implementation.unique_id, editForm.title, editForm.description);
            if (dimensioned) {
                await setImplementationDimensions(type, implementation.unique_id, editForm.dimensions || []);
            }
            toast({
                title: 'Saved', description: 'Implementation updated.', status: 'success',
                duration: 3000, position: 'top-right', isClosable: true,
            });
            setIsEditing(false);
            refresh();
        } catch (error) {
            toast({
                title: 'Error', description: error.response?.data?.error || 'Failed to update implementation.',
                status: 'error', duration: 3000, position: 'top-right', isClosable: true,
            });
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/ati/${campus}/ati-explorer/implementations/${type}/${implementation.unique_id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Link copied!', description: 'Direct link to this implementation copied to clipboard.',
            status: 'success', duration: 2000, isClosable: true,
        });
    };

    // Copy the supporting Documents + Webpages as email-ready bullets (title — URL, one per
    // line). Plain text so it pastes cleanly into an email; raw URLs auto-link in most clients.
    const copyDocumentationLinks = () => {
        const bullet = (title, href) => {
            const t = (title || '').trim() || '(untitled)';
            return href ? `• ${t} — ${href}` : `• ${t}`;
        };
        const lines = [
            ...(implementation.supporting_documents || []).map((d) => bullet(d.name, d.uri_path || d.file_path)),
            ...(implementation.supporting_webpages || []).map((w) => bullet(w.name, w.url)),
        ];
        if (lines.length === 0) {
            toast({ title: 'Nothing to copy', description: 'No documents or webpages on this implementation.', status: 'info', duration: 2000, isClosable: true });
            return;
        }
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            toast({
                title: 'Copied for email',
                description: `${lines.length} link${lines.length === 1 ? '' : 's'} copied — paste into an email.`,
                status: 'success', duration: 2500, isClosable: true,
            });
        }).catch(() => {
            toast({ title: 'Copy failed', description: 'Could not access the clipboard.', status: 'error', duration: 3000, isClosable: true });
        });
    };

    const handleDetachYse = async (yse) => {
        setRemovingYse(yse.unique_id);
        try {
            await unassignImplementationFromYSE(yse.year_identifier, type, implementation.title);
            toast({
                title: 'Evidence link removed', description: yse.indicator_composite_key,
                status: 'info', duration: 3000, isClosable: true,
            });
            refresh();
        } catch (error) {
            toast({
                title: 'Remove failed', description: error.response?.data?.error || error.message,
                status: 'error', duration: 5000, isClosable: true,
            });
        } finally {
            setRemovingYse(null);
        }
    };

    // Evidence-For shows only the current year's links at the current campus — the
    // common case; cross-campus / other-year links live behind Manage Linked YSEs.
    const ysesThisYearHere = (implementation.is_evidence_for || []).filter(
        (yse) => yse.campus?.abbreviation === campus
            && (yse.year_identifier || '').startsWith(currentAcademicYear),
    );
    const otherLinksCount = (implementation.is_evidence_for?.length || 0) - ysesThisYearHere.length;

    const yseCount = implementation.is_evidence_for?.length || 0;
    const ownerCount = implementation.owned_by?.length || 0;
    const campuses = Array.isArray(implementation.campuses) ? implementation.campuses : [];
    const dimensions = Array.isArray(implementation.dimensions) ? implementation.dimensions : [];

    const totalSupporting =
        (implementation.supporting_documents?.length || 0) +
        (implementation.supporting_webpages?.length || 0) +
        (implementation.supporting_notes?.length || 0) +
        (implementation.supporting_messages?.length || 0) +
        (implementation.supporting_metrics?.length || 0);

    // Documentation (documents + webpages) exists but every item is dead — a doc
    // depreciated, or a page depreciated / no_longer_exists → no active documentation.
    const documentationCount =
        (implementation.supporting_documents?.length || 0) +
        (implementation.supporting_webpages?.length || 0);
    const docsAllDeprecated = allDocumentsDepreciated(implementation);

    const dimensionLabel = describeField?.('Implementation', 'dimensions')?.title || 'AMM Dimensions';

    const openRetire = () => {
        setRetireForm({ date: new Date().toISOString().slice(0, 10), note: '' });
        onRetireOpen();
    };

    const handleRetire = async () => {
        setRetiring(true);
        try {
            await retireImplementation(type, implementation.unique_id, {
                retired: true,
                retired_date: retireForm.date || undefined,
                retired_note: retireForm.note || undefined,
            });
            toast({ title: `${typeLabel(type)} retired`, status: 'success', duration: 2000 });
            onRetireClose();
            refresh();
        } catch (e) {
            toast({ title: 'Failed to retire', description: e?.response?.data?.error || e.message, status: 'error', duration: 3500 });
        } finally {
            setRetiring(false);
        }
    };

    const handleUnretire = async () => {
        if (!window.confirm('Reactivate this implementation? The retired date and note will be cleared.')) return;
        try {
            await retireImplementation(type, implementation.unique_id, { retired: false });
            toast({ title: `${typeLabel(type)} reactivated`, status: 'success', duration: 2000 });
            refresh();
        } catch (e) {
            toast({ title: 'Failed to reactivate', description: e?.response?.data?.error || e.message, status: 'error', duration: 3500 });
        }
    };

    // Copy-to-campuses: duplicate this year's evidence links (same indicators)
    // at the selected campuses. Owners/participants/assets live on this shared
    // implementation node and need no copying.
    const otherCampuses = (allCampuses || []).filter((c) => c.abbreviation !== campus);

    const openCopy = () => {
        setCopyTargets(otherCampuses.map((c) => c.abbreviation));
        setCopyPeople(true);
        onCopyOpen();
    };

    const handleCopy = async () => {
        setCopying(true);
        try {
            const resp = await copyEvidenceToCampuses(
                type, implementation.unique_id, currentAcademicYear, campus, copyTargets, copyPeople,
            );
            const summary = resp?.data || {};
            const parts = Object.entries(summary).map(([abbrev, s]) => {
                const bits = [`${s.created} created`, `${s.already_linked} already linked`];
                if (s.skipped_missing_indicator) bits.push(`${s.skipped_missing_indicator} skipped (no matching indicator)`);
                if (copyPeople && s.people_added) bits.push(`${s.people_added} people added`);
                return `${abbrev.toUpperCase()}: ${bits.join(', ')}`;
            });
            toast({
                title: 'Evidence links copied',
                description: parts.join(' · ') || 'Nothing to copy.',
                status: 'success',
                duration: 7000,
                isClosable: true,
            });
            onCopyClose();
            refresh();
        } catch (e) {
            toast({ title: 'Copy failed', description: e?.response?.data?.error || e.message, status: 'error', duration: 3500 });
        } finally {
            setCopying(false);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity header */}
            <Card>
                <HStack justify="space-between" align="start" mb={2}>
                    <Heading as="h2" size="md" color="gray.800" flex="1" minW="0">
                        {implementation.title || '(untitled)'}
                    </Heading>
                    <HStack spacing={2} flexShrink={0}>
                        {implementation.retired && (
                            <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} borderRadius="md">
                                Retired
                            </Badge>
                        )}
                        <Badge colorScheme={typeColor(type)} fontSize="xs" px={2} py={1} borderRadius="md">
                            {typeLabel(type)}
                        </Badge>
                        <HelpTip nodeType={type} />
                        <Button size="xs" variant="ghost" colorScheme="teal" leftIcon={<LinkIcon />} onClick={copyLink}>
                            Copy link
                        </Button>
                        <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="gray"
                            onClick={implementation.retired ? handleUnretire : openRetire}
                        >
                            {implementation.retired ? 'Unretire' : 'Retire'}
                        </Button>
                    </HStack>
                </HStack>
                <Wrap spacing={2}>
                    <WrapItem>
                        <Badge colorScheme={yseCount === 0 ? 'red' : 'teal'} variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                            {yseCount} YSE
                        </Badge>
                    </WrapItem>
                    <WrapItem>
                        <Badge colorScheme={ownerCount === 0 ? 'red' : 'gray'} variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                            {ownerCount} owner{ownerCount === 1 ? '' : 's'}
                        </Badge>
                    </WrapItem>
                    {dimensioned && (
                        <WrapItem>
                            <Badge colorScheme={dimensions.length ? 'purple' : 'gray'} variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                                {dimensions.length} dimension{dimensions.length === 1 ? '' : 's'}
                            </Badge>
                        </WrapItem>
                    )}
                    {campuses.map((abbrev) => (
                        <WrapItem key={abbrev}>
                            <Badge colorScheme="gray" variant="outline" fontSize="2xs" borderRadius="full" px={2} textTransform="uppercase">
                                {abbrev}
                            </Badge>
                        </WrapItem>
                    ))}
                </Wrap>
            </Card>

            {/* Retirement banner — the why and when, right under the identity card */}
            {implementation.retired && (
                <Alert status="info" borderRadius="lg" fontSize="sm" bg="gray.100">
                    <AlertIcon color="gray.600" />
                    <Box>
                        <Text fontWeight="semibold" color="gray.800">
                            Retired{implementation.retired_date ? ` on ${implementation.retired_date}` : ''}
                        </Text>
                        {implementation.retired_note && (
                            <Text color="gray.700" mt={0.5}>{implementation.retired_note}</Text>
                        )}
                    </Box>
                </Alert>
            )}

            {/* Warning: every attached document/webpage is dead — no live documentation */}
            {docsAllDeprecated && (
                <Alert status="warning" borderRadius="lg" fontSize="sm">
                    <AlertIcon />
                    All {documentationCount} attached documentation item{documentationCount === 1 ? ' is' : 's are'} deprecated or no longer available — this implementation has no active documentation.
                </Alert>
            )}

            {/* Retire modal — date (default today) + optional why-note */}
            <Modal isOpen={isRetireOpen} onClose={onRetireClose} initialFocusRef={retireDateRef} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md">Retire {typeLabel(type)}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={3}>
                            <Text fontSize="sm" color="gray.700">
                                Marks “{implementation.title}” as no longer in use. Evidence links and
                                history stay intact; it will be hidden from the list by default.
                            </Text>
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Retired date</FormLabel>
                                <Input
                                    ref={retireDateRef}
                                    type="date"
                                    size="sm"
                                    value={retireForm.date}
                                    onChange={(e) => setRetireForm((f) => ({ ...f, date: e.target.value }))}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Note — why it was retired</FormLabel>
                                <Textarea
                                    size="sm"
                                    rows={3}
                                    value={retireForm.note}
                                    onChange={(e) => setRetireForm((f) => ({ ...f, note: e.target.value }))}
                                    placeholder="Replaced by …, superseded by …, no longer applicable because …"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" size="sm" mr={2} onClick={onRetireClose}>Cancel</Button>
                        <Button colorScheme="gray" size="sm" onClick={handleRetire} isLoading={retiring} loadingText="Retiring">
                            Retire
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Copy-to-campuses modal — duplicate this year's evidence links */}
            <Modal isOpen={isCopyOpen} onClose={onCopyClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md">Copy evidence links to other campuses</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={3}>
                            <Text fontSize="sm" color="gray.700">
                                Copies the {ysesThisYearHere.length} evidence link{ysesThisYearHere.length === 1 ? '' : 's'} this
                                implementation has at {(campus || '').toUpperCase()} for {currentAcademicYear} to the same
                                indicators at the selected campuses. Strength ratings carry over to new links;
                                links that already exist are left untouched.
                            </Text>
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Target campuses</FormLabel>
                                <CheckboxGroup value={copyTargets} onChange={(vals) => setCopyTargets(vals)}>
                                    <VStack align="stretch" spacing={1}>
                                        {otherCampuses.map((c) => (
                                            <Checkbox key={c.abbreviation} value={c.abbreviation} size="sm">
                                                {c.name}
                                            </Checkbox>
                                        ))}
                                    </VStack>
                                </CheckboxGroup>
                            </FormControl>
                            <Checkbox
                                size="sm"
                                isChecked={copyPeople}
                                onChange={(e) => setCopyPeople(e.target.checked)}
                            >
                                Also copy assigned people onto the target indicators
                            </Checkbox>
                            <Text fontSize="xs" color="gray.600">
                                Owners, participants, and applied assets live on the implementation itself and are
                                already shared across campuses — nothing to copy there.
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" size="sm" mr={2} onClick={onCopyClose}>Cancel</Button>
                        <Button
                            colorScheme="teal"
                            size="sm"
                            onClick={handleCopy}
                            isLoading={copying}
                            loadingText="Copying"
                            isDisabled={copyTargets.length === 0}
                        >
                            Copy
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Details — title / description / dimensions (inline edit) */}
            <Card
                title="Details"
                action={
                    !isEditing ? (
                        <IconButton icon={<EditIcon />} size="xs" colorScheme="teal" variant="outline" onClick={handleEdit} aria-label="Edit details" />
                    ) : (
                        <HStack spacing={2}>
                            <IconButton icon={<CheckIcon />} size="xs" colorScheme="teal" onClick={handleSave} aria-label="Save" />
                            <IconButton icon={<CloseIcon />} size="xs" colorScheme="gray" variant="outline" onClick={handleCancel} aria-label="Cancel" />
                        </HStack>
                    )
                }
            >
                <Divider mb={4} borderColor="gray.200" />
                <VStack align="stretch" spacing={4}>
                    <FormControl>
                        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">Title <HelpTip field={['Implementation', 'title']} /></FormLabel>
                        {isEditing ? (
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                size="sm"
                                borderColor="gray.200"
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                            />
                        ) : (
                            <Text fontSize="sm" color="gray.700">{implementation.title}</Text>
                        )}
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">Description <HelpTip field={['Implementation', 'description']} /></FormLabel>
                        {isEditing ? (
                            <Textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={6}
                                size="sm"
                                borderColor="gray.200"
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                            />
                        ) : (
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                                {implementation.description || <Box as="span" color="gray.600" fontStyle="italic">No description.</Box>}
                            </Text>
                        )}
                    </FormControl>

                    {dimensioned && (
                        <FormControl>
                            <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold">{dimensionLabel} <HelpTip field={['Implementation', 'dimensions']} /></FormLabel>
                            {isEditing ? (
                                <CheckboxGroup
                                    value={editForm.dimensions}
                                    onChange={(vals) => setEditForm({ ...editForm, dimensions: vals })}
                                >
                                    <Wrap spacing={3}>
                                        {dimensionOptions.map((d) => (
                                            <WrapItem key={d.handle}>
                                                <Tooltip label={d.description} hasArrow openDelay={300}>
                                                    <Box><Checkbox size="sm" value={d.handle}>{d.name}</Checkbox></Box>
                                                </Tooltip>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </CheckboxGroup>
                            ) : dimensions.length > 0 ? (
                                <HStack spacing={1} flexWrap="wrap">
                                    {dimensions.map((d) => (
                                        <Badge key={d.handle} colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="md">
                                            {d.name}
                                        </Badge>
                                    ))}
                                </HStack>
                            ) : (
                                <Text fontSize="xs" color="gray.600" fontStyle="italic">No AMM dimensions assigned.</Text>
                            )}
                        </FormControl>
                    )}
                </VStack>
            </Card>

            {/* Supporting Documentation — tabbed by type, raised high in the panel */}
            <Card title={`Supporting Documentation (${totalSupporting})`}>
                <Divider mb={3} borderColor="gray.200" />
                <HStack justify="flex-end" mb={2}>
                    <Button
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        leftIcon={<CopyIcon />}
                        onClick={copyDocumentationLinks}
                        isDisabled={(implementation.supporting_documents?.length || 0) + (implementation.supporting_webpages?.length || 0) === 0}
                        title="Copy documents & webpages (title and URL) as bullets for an email"
                    >
                        Copy links for email
                    </Button>
                </HStack>
                <SupportingDocumentationTabs
                    documents={implementation.supporting_documents || []}
                    webpages={implementation.supporting_webpages || []}
                    notes={implementation.supporting_notes || []}
                    messages={implementation.supporting_messages || []}
                    metrics={implementation.supporting_metrics || []}
                    implementation_id={implementation.unique_id}
                    implementation_type={type}
                    formatDate={formatDate}
                />
            </Card>

            {/* Evidence For — current year's links at this campus (compact rows,
                modeled on the plans evidence board); full management behind the modal */}
            <Card
                title={<>Evidence For · {currentAcademicYear} ({ysesThisYearHere.length}) <HelpTip relType="is_evidence_for" /></>}
                action={
                    <HStack spacing={2}>
                        <Tooltip
                            label={implementation.retired
                                ? 'Retired implementations cannot be assigned to new evidence'
                                : 'Duplicate this year’s evidence links (same indicators) at other campuses'}
                            hasArrow
                        >
                            <Button
                                size="xs"
                                colorScheme="teal"
                                variant="outline"
                                onClick={openCopy}
                                isDisabled={implementation.retired || ysesThisYearHere.length === 0 || otherCampuses.length === 0}
                            >
                                Copy to campuses…
                            </Button>
                        </Tooltip>
                        <Tooltip
                            label="Retired implementations cannot be assigned to new evidence"
                            isDisabled={!implementation.retired}
                            hasArrow
                        >
                            <Button
                                size="xs"
                                colorScheme="teal"
                                variant="outline"
                                onClick={onManageYsesOpen}
                                isDisabled={implementation.retired}
                            >
                                Manage Linked YSEs
                            </Button>
                        </Tooltip>
                    </HStack>
                }
            >
                <Divider mb={3} borderColor="gray.200" />
                {ysesThisYearHere.length > 0 ? (
                    <VStack align="stretch" spacing={1}>
                        {ysesThisYearHere.map((yse) => (
                            <HStack
                                key={yse.unique_id}
                                justify="space-between"
                                spacing={2}
                                px={2}
                                py={1.5}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                            >
                                <HStack spacing={2} minW={0} align="baseline">
                                    <Text
                                        fontSize="xs"
                                        fontFamily="mono"
                                        color="teal.600"
                                        cursor="pointer"
                                        flexShrink={0}
                                        _hover={{ color: 'teal.800', textDecoration: 'underline' }}
                                        onClick={() => navigateToIndicator(navigate, yse.indicator_composite_key, campus)}
                                        title="Open this indicator in the explorer"
                                    >
                                        {yse.indicator_composite_key}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                        {yse.success_indicator}
                                    </Text>
                                    {strengthConfig(yse.strength) ? (
                                        <Badge
                                            colorScheme={strengthConfig(yse.strength).colorScheme}
                                            variant="subtle"
                                            fontSize="2xs"
                                            borderRadius="full"
                                            px={2}
                                            flexShrink={0}
                                            title={strengthConfig(yse.strength).description}
                                        >
                                            {strengthConfig(yse.strength).label}
                                        </Badge>
                                    ) : (
                                        <Badge colorScheme="gray" variant="outline" fontSize="2xs" borderRadius="full" px={2} flexShrink={0}
                                               title="No strength rating yet — set it from the indicator's goal view">
                                            Unrated
                                        </Badge>
                                    )}
                                </HStack>
                                <Tooltip label="Remove this evidence link">
                                    <IconButton
                                        aria-label="Remove evidence link"
                                        icon={removingYse === yse.unique_id ? <Spinner size="xs" /> : <CloseIcon boxSize={2} />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="gray"
                                        flexShrink={0}
                                        isDisabled={removingYse !== null}
                                        onClick={() => handleDetachYse(yse)}
                                    />
                                </Tooltip>
                            </HStack>
                        ))}
                    </VStack>
                ) : (
                    <Text fontSize="xs" color="gray.600" fontStyle="italic">
                        No evidence links at {(campus || '').toUpperCase()} for {currentAcademicYear}.
                    </Text>
                )}
                {otherLinksCount > 0 && (
                    <Text fontSize="2xs" color="gray.600" mt={2}>
                        +{otherLinksCount} link{otherLinksCount === 1 ? '' : 's'} at other campuses or years — use Manage Linked YSEs.
                    </Text>
                )}
            </Card>

            {/* Owners */}
            <Card title={<>Owners ({ownerCount}) <HelpTip field={['Implementation', 'owned_by']} /></>}>
                <Divider mb={4} borderColor="gray.200" />
                <PersonAssignmentSelector
                    assignedPersons={implementation.owned_by || []}
                    candidatePersons={(individuals || []).filter((i) => i.active || i.non_committee_member_active)}
                    onAssign={(personUniqueId) => assignPersonAsOwner(type, implementation.unique_id, personUniqueId)}
                    onUnassign={(personUniqueId) => unassignPersonAsOwner(type, implementation.unique_id, personUniqueId)}
                    afterChange={refresh}
                    placeholder="Select person to assign as owner"
                    assignLabel="Assign as Owner"
                />
            </Card>

            {/* Participants — the working team (doing types only) */}
            {participantType && (
                <Card title={<>Participants (working team) <HelpTip field={['Implementation', 'participants']} /></>}>
                    <Divider mb={4} borderColor="gray.200" />
                    <ParticipantsEditor
                        implementationType={type}
                        implementationUniqueId={implementation.unique_id}
                        participants={implementation.participants || []}
                        individuals={individuals || []}
                        onSaved={refresh}
                    />
                </Card>
            )}

            {/* Assets it applies to (doing types only) — derived from remediated interfaces;
                manage the interfaces/tools that produce them via the modal. */}
            {assetType && (
                <Card title="Assets It Applies To">
                    <Divider mb={4} borderColor="gray.200" />
                    <HStack justify="space-between" align="center" mb={3} spacing={3}>
                        <Text fontSize="xs" color="gray.600">
                            Assets are derived from the interfaces this implementation remediates.
                        </Text>
                        <Button size="xs" colorScheme="teal" variant="outline" flexShrink={0} onClick={onManageRemediationOpen}>
                            Manage interfaces &amp; tools
                        </Button>
                    </HStack>
                    {Array.isArray(implementation.assets) && implementation.assets.length > 0 ? (
                        <VStack align="stretch" spacing={1}>
                            {implementation.assets.map((a) => (
                                <HStack key={a.unique_id} spacing={2} flexWrap="wrap" borderWidth="1px" borderColor="gray.200" borderRadius="md" px={3} py={1.5}>
                                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{a.title}</Text>
                                    {a.scope && <Badge colorScheme="gray" fontSize="2xs">{a.scope}</Badge>}
                                    {a.asset_class && <Badge colorScheme="teal" fontSize="2xs">{a.asset_class.replace(/_/g, ' ')}</Badge>}
                                    {(a.reach || []).map((r) => (
                                        <Badge key={r} colorScheme={r === 'direct' ? 'green' : 'blue'} variant="subtle" fontSize="2xs">
                                            {r === 'direct' ? 'remediated' : 'via interface'}
                                        </Badge>
                                    ))}
                                    <Text fontSize="2xs" color="gray.600" fontFamily="mono">{a.asset_identifier}</Text>
                                </HStack>
                            ))}
                        </VStack>
                    ) : (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic">Not linked to any remediated asset or interface.</Text>
                    )}
                </Card>
            )}

            {/* Manage Linked YSEs modal — inverse-mount of the YSE-side attach flow */}
            <Modal isOpen={isManageYsesOpen} onClose={onManageYsesClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">
                        Manage Linked YSEs
                        {implementation.title && (
                            <Text as="span" fontSize="sm" color="gray.600" fontWeight="normal" ml={2}>— {implementation.title}</Text>
                        )}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <YseAssignmentSelector
                            entityType="Implementation"
                            entityTitle={implementation.title}
                            implementationType={type}
                            academicYear={currentAcademicYear}
                            currentLinks={implementation.is_evidence_for || []}
                            scopeCampus={campus}
                            onChange={refresh}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="teal" onClick={onManageYsesClose}>Done</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Manage remediated interfaces & used tools — inverse-mount of the entity-side flows */}
            <Modal isOpen={isManageRemediationOpen} onClose={onManageRemediationClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">
                        Manage Interfaces &amp; Tools
                        {implementation.title && (
                            <Text as="span" fontSize="sm" color="gray.600" fontWeight="normal" ml={2}>— {implementation.title}</Text>
                        )}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <ImplementationRemediationManager
                            implementationType={type}
                            implementationUniqueId={implementation.unique_id}
                            interfaces={implementation.interfaces || []}
                            tools={implementation.tools || []}
                            onChanged={refresh}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="teal" onClick={onManageRemediationClose}>Done</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </VStack>
    );
}

export default ImplementationDetailPanel;
