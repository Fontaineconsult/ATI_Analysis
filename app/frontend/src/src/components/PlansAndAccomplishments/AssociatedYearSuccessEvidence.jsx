import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Spinner,
    Text,
    Tooltip,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, MinusIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext';
import { fetchPlanYses, fetchYsesByCampusForYear } from '../../services/api/get';
import {
    assignPlanToCampus,
    attachPlanToYse,
    detachPlanFromYse,
    unassignPlanFromCampus,
} from '../../services/api/put';
import { getEditUrlFromCompositeKey } from '../../services/utils/tools';

// Local color mapping for ATI StatusLevel values. Returns Chakra colorScheme
// keys (not hex) because Chakra <Badge colorScheme> expects names.
function getStatusColor(status) {
    switch (status) {
        case 'Optimized':   return 'green';
        case 'Managed':     return 'blue';
        case 'Established': return 'cyan';
        case 'Defined':     return 'yellow';
        case 'Initiated':   return 'orange';
        case 'Not Started': return 'red';
        default:            return 'gray';
    }
}

/**
 * Campus-evidence board for one plan: a column per campus, each listing the
 * Year Success Evidence the plan furthers there (indicator link + status).
 * The +/− button in each column header assigns/unassigns the plan to that
 * campus for the current year — same endpoints the old Campuses checkboxes
 * used; the backend still refuses to remove the last remaining campus.
 *
 * Props:
 *   plan          The plan object. Must have `unique_id`.
 *   onChanged()   Called after a successful assign/unassign so the parent
 *                 can refetch its plan data.
 */
function AssociatedYearSuccessEvidence({ plan, onChanged }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    const { campuses, currentAcademicYear } = useContext(SettingsContext);
    const toast = useToast();

    const [evidences, setEvidences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingCampus, setSavingCampus] = useState(null);
    const [removingYse, setRemovingYse] = useState(null);

    // "Add evidence" picker: which campus column opened it, the year's full
    // YSE catalog (fetched once per open), and the chosen YSE.
    const [addTarget, setAddTarget] = useState(null);
    const [yseCatalog, setYseCatalog] = useState(null);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [selectedYseId, setSelectedYseId] = useState('');
    const [attaching, setAttaching] = useState(false);

    const load = useCallback(async () => {
        if (!plan?.unique_id) return;
        setLoading(true);
        try {
            setEvidences(await fetchPlanYses(plan.unique_id));
        } catch (e) {
            setEvidences([]);
        } finally {
            setLoading(false);
        }
    }, [plan?.unique_id]);

    useEffect(() => { load(); }, [load]);

    // Mirrors the click handler in ImplementationTypeOverview.js — uses the
    // evidence's OWN campus so a cross-campus YSE opens in that campus's
    // explorer.
    const handleYseClick = (compositeKey, yseCampus) => {
        if (!compositeKey) return;
        const editUrl = getEditUrlFromCompositeKey(compositeKey, yseCampus || campus);
        const [pathname, hash] = editUrl.split('#');
        navigate(pathname + (hash ? '#' + hash : ''));
        if (!hash) return;
        setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            setTimeout(() => {
                const retry = document.getElementById(hash);
                if (retry) retry.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }, 100);
    };

    const handleAssign = async (campusEntry) => {
        setSavingCampus(campusEntry.abbreviation);
        try {
            const res = await assignPlanToCampus(plan.unique_id, campusEntry.abbreviation, currentAcademicYear);
            toast({
                title: `Assigned to ${campusEntry.name || campusEntry.abbreviation}`,
                description: res?.message,
                status: 'success', duration: 4000, isClosable: true,
            });
            await load();
            if (onChanged) onChanged();
        } catch (e) {
            toast({
                title: 'Assign failed',
                description: e.response?.data?.error || e.message,
                status: 'error', duration: 6000, isClosable: true,
            });
        } finally {
            setSavingCampus(null);
        }
    };

    const handleUnassign = async (campusEntry) => {
        setSavingCampus(campusEntry.abbreviation);
        try {
            const res = await unassignPlanFromCampus(plan.unique_id, campusEntry.abbreviation, currentAcademicYear);
            toast({
                title: `Removed from ${campusEntry.name || campusEntry.abbreviation}`,
                description: campusEntry.abbreviation === campus
                    ? 'This plan will no longer appear on this campus’s plans page.'
                    : res?.message,
                status: 'info', duration: 5000, isClosable: true,
            });
            await load();
            if (onChanged) onChanged();
        } catch (e) {
            toast({
                title: 'Remove failed',
                description: e.response?.data?.error || e.message,
                status: 'error', duration: 6000, isClosable: true,
            });
        } finally {
            setSavingCampus(null);
        }
    };

    // Per-evidence pruning: remove ONE furthers_yse link (the +/− buttons
    // operate at campus grain; this is the finer control for multi-YSE plans).
    const handleDetachYse = async (evidence) => {
        setRemovingYse(evidence.unique_id);
        try {
            await detachPlanFromYse(plan.unique_id, evidence.unique_id);
            toast({
                title: 'Evidence link removed',
                description: `${evidence.indicator_key} at ${(evidence.campus_abbrev || '').toUpperCase()}`,
                status: 'info', duration: 4000, isClosable: true,
            });
            await load();
            if (onChanged) onChanged();
        } catch (e) {
            toast({
                title: 'Remove failed',
                description: e.response?.data?.error || e.message,
                status: 'error', duration: 6000, isClosable: true,
            });
        } finally {
            setRemovingYse(null);
        }
    };

    // Open the picker for one campus column, lazily loading the year's
    // campus->WG->indicator catalog the first time.
    const openAddEvidence = async (campusEntry) => {
        setAddTarget(campusEntry);
        setSelectedYseId('');
        if (yseCatalog) return;
        setCatalogLoading(true);
        try {
            const wrapper = await fetchYsesByCampusForYear(currentAcademicYear);
            setYseCatalog(wrapper?.data || wrapper);
        } catch (e) {
            toast({
                title: "Couldn't load the evidence catalog",
                description: e.response?.data?.error || e.message,
                status: 'error', duration: 6000, isClosable: true,
            });
            setAddTarget(null);
        } finally {
            setCatalogLoading(false);
        }
    };

    const handleAttachYse = async () => {
        if (!selectedYseId) return;
        setAttaching(true);
        try {
            await attachPlanToYse(plan.unique_id, selectedYseId);
            toast({
                title: 'Evidence link added',
                status: 'success', duration: 3000, isClosable: true,
            });
            setAddTarget(null);
            await load();
            if (onChanged) onChanged();
        } catch (e) {
            toast({
                title: 'Add failed',
                description: e.response?.data?.error || e.message,
                status: 'error', duration: 6000, isClosable: true,
            });
        } finally {
            setAttaching(false);
        }
    };

    if (loading) {
        return (
            <HStack spacing={2} color="gray.500">
                <Spinner size="xs" />
                <Text fontSize="sm">Loading evidence…</Text>
            </HStack>
        );
    }

    // The picker's option groups: the target campus's WGs, minus YSEs the
    // plan already furthers.
    const linkedIds = new Set(evidences.map((e) => e.unique_id));
    const targetCampusCatalog = addTarget && yseCatalog
        ? (yseCatalog.campuses || []).find((c) => c.abbreviation === addTarget.abbreviation)
        : null;

    return (
        <>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} alignItems="start">
            {(campuses || []).map((campusEntry) => {
                // Current-year only: earlier years' links still exist in the
                // graph but are noise here (prune them via the explorer).
                const colEvidences = evidences
                    .filter((e) => e.campus_abbrev === campusEntry.abbreviation
                        && e.year_name === currentAcademicYear)
                    .sort((a, b) => (a.indicator_key || '').localeCompare(b.indicator_key || ''));
                const assignedThisYear = colEvidences.some((e) => e.year_name === currentAcademicYear);
                const isSaving = savingCampus === campusEntry.abbreviation;

                return (
                    <Box
                        key={campusEntry.abbreviation}
                        borderWidth="1px"
                        borderColor={campusEntry.abbreviation === campus ? 'teal.300' : 'gray.200'}
                        borderRadius="md"
                        bg={campusEntry.abbreviation === campus ? 'teal.50' : 'gray.50'}
                    >
                        {/* Column header: campus + assign/unassign for the current year */}
                        <HStack
                            px={2}
                            py={1.5}
                            justify="space-between"
                            borderBottomWidth="1px"
                            borderBottomColor="gray.200"
                        >
                            <Tooltip label={campusEntry.name} placement="top-start">
                                <Text
                                    fontSize="xs"
                                    fontWeight="bold"
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                    color="teal.700"
                                >
                                    {campusEntry.abbreviation}
                                </Text>
                            </Tooltip>
                            {assignedThisYear ? (
                                <Tooltip label={`Remove this plan from ${campusEntry.name} for ${currentAcademicYear}`}>
                                    <IconButton
                                        aria-label={`Remove plan from ${campusEntry.name}`}
                                        icon={isSaving ? <Spinner size="xs" /> : <MinusIcon boxSize={2.5} />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        isDisabled={savingCampus !== null}
                                        onClick={() => handleUnassign(campusEntry)}
                                    />
                                </Tooltip>
                            ) : (
                                <Tooltip label={`Assign this plan to ${campusEntry.name} for ${currentAcademicYear}`}>
                                    <IconButton
                                        aria-label={`Assign plan to ${campusEntry.name}`}
                                        icon={isSaving ? <Spinner size="xs" /> : <AddIcon boxSize={2.5} />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="teal"
                                        isDisabled={savingCampus !== null}
                                        onClick={() => handleAssign(campusEntry)}
                                    />
                                </Tooltip>
                            )}
                        </HStack>

                        {/* Evidence list: indicator link + status, year as context */}
                        <VStack align="stretch" spacing={1} p={2}>
                            {colEvidences.length === 0 ? (
                                <Text fontSize="xs" color="gray.400" fontStyle="italic">
                                    Not assigned
                                </Text>
                            ) : (
                                colEvidences.map((evidence) => (
                                    <Box
                                        key={evidence.unique_id}
                                        px={2}
                                        py={1.5}
                                        bg="white"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                    >
                                        <HStack justify="space-between" align="center" spacing={2}>
                                            <Text
                                                fontSize="sm"
                                                fontWeight="semibold"
                                                color="teal.600"
                                                cursor="pointer"
                                                _hover={{ color: 'teal.800', textDecoration: 'underline' }}
                                                onClick={() => handleYseClick(evidence.indicator_key, evidence.campus_abbrev)}
                                                role="link"
                                                title="Open this indicator in the explorer"
                                            >
                                                {evidence.indicator_key}
                                            </Text>
                                            <HStack spacing={1}>
                                                {evidence.status_level && (
                                                    <Badge colorScheme={getStatusColor(evidence.status_level)} fontSize="2xs">
                                                        {evidence.status_level}
                                                    </Badge>
                                                )}
                                                <Tooltip label={`Remove the ${evidence.indicator_key} link only`}>
                                                    <IconButton
                                                        aria-label={`Remove ${evidence.indicator_key} evidence link`}
                                                        icon={removingYse === evidence.unique_id
                                                            ? <Spinner size="xs" />
                                                            : <CloseIcon boxSize={1.5} />}
                                                        size="2xs"
                                                        minW={4}
                                                        h={4}
                                                        variant="ghost"
                                                        colorScheme="gray"
                                                        isDisabled={removingYse !== null || savingCampus !== null}
                                                        onClick={() => handleDetachYse(evidence)}
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </HStack>
                                    </Box>
                                ))
                            )}

                            {/* Per-indicator add: pick a specific YSE at this campus */}
                            <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="teal"
                                leftIcon={<AddIcon boxSize={2} />}
                                justifyContent="flex-start"
                                fontWeight="normal"
                                isDisabled={savingCampus !== null || removingYse !== null}
                                onClick={() => openAddEvidence(campusEntry)}
                            >
                                Add evidence
                            </Button>
                        </VStack>
                    </Box>
                );
            })}
        </SimpleGrid>

        {/* Evidence picker for one campus column */}
        <Modal isOpen={addTarget !== null} onClose={() => setAddTarget(null)} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md">
                    Add evidence at {addTarget?.name || addTarget?.abbreviation} — {currentAcademicYear}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {catalogLoading ? (
                        <HStack spacing={2} color="gray.500">
                            <Spinner size="xs" />
                            <Text fontSize="sm">Loading indicators…</Text>
                        </HStack>
                    ) : (
                        <Select
                            placeholder="Select a success indicator…"
                            value={selectedYseId}
                            onChange={(e) => setSelectedYseId(e.target.value)}
                            size="sm"
                        >
                            {(targetCampusCatalog?.working_groups || []).map((wg) => (
                                <optgroup key={wg.name} label={wg.name}>
                                    {wg.yses
                                        .filter((y) => !linkedIds.has(y.yse_unique_id))
                                        .map((y) => (
                                            <option key={y.yse_unique_id} value={y.yse_unique_id}>
                                                {y.indicator_composite_key} — {(y.indicator_description || '').slice(0, 90)}
                                            </option>
                                        ))}
                                </optgroup>
                            ))}
                        </Select>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={3} onClick={() => setAddTarget(null)}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleAttachYse}
                        isLoading={attaching}
                        isDisabled={!selectedYseId}
                    >
                        Add link
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    );
}

export default AssociatedYearSuccessEvidence;
