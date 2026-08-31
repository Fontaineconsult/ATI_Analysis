import React, { useMemo, useState } from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Badge,
    Box,
    Button,
    ButtonGroup,
    FormControl,
    FormLabel,
    HStack,
    Heading,
    IconButton,
    Select,
    Text,
    Textarea,
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useSettings } from '../../../context/SettingsContext';
import { addEvidenceRequirement } from '../../../services/api/post';
import { updateEvidenceRequirement } from '../../../services/api/put';
import { deleteEvidenceRequirement } from '../../../services/api/delete';

// Order the maturity levels the way the rubric climbs, not the way an object happens
// to enumerate. Anything the vocabulary adds later sorts after these.
const LEVEL_ORDER = ['established', 'managed', 'optimizing'];
const byLevel = (a, b) => {
    const ai = LEVEL_ORDER.indexOf(a);
    const bi = LEVEL_ORDER.indexOf(b);
    return (ai === -1 ? LEVEL_ORDER.length : ai) - (bi === -1 ? LEVEL_ORDER.length : bi);
};

const LEVEL_COLOR = { established: 'teal', managed: 'purple', optimizing: 'orange' };

/**
 * Add / edit / delete the EvidenceRequirement nodes hanging off one SuccessIndicator.
 *
 * These are the companion bar broken into addressable pieces. The prose in the
 * `*_example` fields above stays as the authored source — editing a requirement here
 * does NOT rewrite that prose, the same way editing `raw_text` doesn't rewrite a URL.
 * Requirements were seeded by parsing that prose; from here they are curated directly.
 *
 * `element` is optional throughout. Eight indicators state their Established bar as
 * unlabelled prose bullets, and those requirements stay unlabelled rather than being
 * assigned an element the companion guide never claimed.
 */
const EvidenceRequirementsPanel = ({ indicator, onChanged }) => {
    const { vocab } = useSettings();
    const toast = useToast();

    const levels = vocab?.evidence_requirement_levels || {};
    const elements = vocab?.evidence_requirement_elements || {};

    const [busyId, setBusyId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editElement, setEditElement] = useState('');

    const [newLevel, setNewLevel] = useState('established');
    const [newElement, setNewElement] = useState('');
    const [newText, setNewText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const requirements = useMemo(
        () => [...(indicator?.evidenceRequirements || [])].sort(
            (a, b) => byLevel(a.level, b.level) || (a.seq || 0) - (b.seq || 0)
        ),
        [indicator]
    );

    const grouped = useMemo(() => {
        const out = {};
        requirements.forEach((r) => {
            (out[r.level] = out[r.level] || []).push(r);
        });
        return out;
    }, [requirements]);

    const fail = (error, fallback) => {
        toast({
            title: 'Error',
            description: error?.response?.data?.error || error?.message || fallback,
            status: 'error',
            duration: 4000,
            isClosable: true,
        });
    };

    const handleAdd = async () => {
        const requirement = newText.trim();
        if (!requirement) return;
        try {
            setIsAdding(true);
            await addEvidenceRequirement({
                composite_key: indicator.composite_key,
                level: newLevel,
                requirement,
                element: newElement || null,
            });
            setNewText('');
            setNewElement('');
            onChanged?.();
        } catch (error) {
            fail(error, 'Failed to add the requirement.');
        } finally {
            setIsAdding(false);
        }
    };

    const startEdit = (r) => {
        setEditingId(r.unique_id);
        setEditText(r.requirement || '');
        setEditElement(r.element || '');
    };

    const handleSaveEdit = async (r) => {
        const requirement = editText.trim();
        if (!requirement) return;
        try {
            setBusyId(r.unique_id);
            // element is always sent so clearing the select un-labels the requirement;
            // the backend treats an omitted key as "leave alone", a null as "clear".
            await updateEvidenceRequirement(r.unique_id, {
                requirement,
                element: editElement || null,
            });
            setEditingId(null);
            onChanged?.();
        } catch (error) {
            fail(error, 'Failed to save the requirement.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (r) => {
        try {
            setBusyId(r.unique_id);
            await deleteEvidenceRequirement(r.unique_id);
            if (editingId === r.unique_id) setEditingId(null);
            onChanged?.();
        } catch (error) {
            fail(error, 'Failed to delete the requirement.');
        } finally {
            setBusyId(null);
        }
    };

    const elementSelect = (value, onChange, label) => (
        <Select
            size="xs"
            w="190px"
            bg="white"
            value={value}
            aria-label={label}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Unlabelled</option>
            {Object.keys(elements).map((key) => (
                <option key={key} value={key}>{key}</option>
            ))}
        </Select>
    );

    return (
        <Accordion allowToggle borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <AccordionItem border="none">
                <Heading as="h3" size="sm">
                    <AccordionButton _expanded={{ bg: 'teal.50' }} borderRadius="md">
                        <HStack flex="1" spacing={2} textAlign="left">
                            <Text fontWeight="semibold" fontSize="sm">Evidence Requirements</Text>
                            <Badge
                                colorScheme={requirements.length ? 'teal' : 'gray'}
                                variant="subtle"
                                fontSize="2xs"
                            >
                                {requirements.length}
                            </Badge>
                        </HStack>
                        <AccordionIcon />
                    </AccordionButton>
                </Heading>

                <AccordionPanel pb={4}>
                    <Text fontSize="xs" color="gray.600" mb={3}>
                        The companion bar broken into individually addressable pieces, so an
                        evidence link can name which requirement it satisfies. Editing these
                        does not change the prose above.
                    </Text>

                    {requirements.length === 0 && (
                        <Text fontSize="sm" color="gray.500" mb={3}>
                            No requirements yet for {indicator.composite_key}.
                        </Text>
                    )}

                    {Object.keys(grouped).sort(byLevel).map((level) => (
                        <Box key={level} mb={4}>
                            <Badge
                                colorScheme={LEVEL_COLOR[level] || 'gray'}
                                variant="subtle"
                                fontSize="2xs"
                                mb={2}
                            >
                                {level}
                            </Badge>
                            <VStack align="stretch" spacing={2}>
                                {grouped[level].map((r) => {
                                    const isEditing = editingId === r.unique_id;
                                    const isBusy = busyId === r.unique_id;
                                    return (
                                        <Box
                                            key={r.unique_id}
                                            p={2}
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            bg={isEditing ? 'gray.50' : 'white'}
                                        >
                                            {isEditing ? (
                                                <VStack align="stretch" spacing={2}>
                                                    {elementSelect(editElement, setEditElement, 'Element')}
                                                    <Textarea
                                                        size="sm"
                                                        rows={3}
                                                        value={editText}
                                                        aria-label="Requirement text"
                                                        onChange={(e) => setEditText(e.target.value)}
                                                    />
                                                    <ButtonGroup size="xs" alignSelf="flex-end">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setEditingId(null)}
                                                            isDisabled={isBusy}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            colorScheme="teal"
                                                            onClick={() => handleSaveEdit(r)}
                                                            isLoading={isBusy}
                                                            isDisabled={!editText.trim()}
                                                        >
                                                            Save
                                                        </Button>
                                                    </ButtonGroup>
                                                </VStack>
                                            ) : (
                                                <HStack align="start" spacing={2}>
                                                    <Box flex="1">
                                                        <Badge
                                                            fontSize="2xs"
                                                            variant="subtle"
                                                            colorScheme={r.element ? 'blue' : 'gray'}
                                                            mb={1}
                                                        >
                                                            {r.element || 'unlabelled'}
                                                        </Badge>
                                                        <Text fontSize="sm" color="gray.700">
                                                            {r.requirement}
                                                        </Text>
                                                    </Box>
                                                    <ButtonGroup size="xs" isAttached variant="ghost">
                                                        <Tooltip label="Edit" openDelay={400} hasArrow>
                                                            <IconButton
                                                                icon={<EditIcon />}
                                                                aria-label={`Edit requirement: ${r.handle}`}
                                                                onClick={() => startEdit(r)}
                                                                isDisabled={isBusy}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Delete" openDelay={400} hasArrow>
                                                            <IconButton
                                                                icon={<DeleteIcon />}
                                                                colorScheme="red"
                                                                aria-label={`Delete requirement: ${r.handle}`}
                                                                onClick={() => handleDelete(r)}
                                                                isLoading={isBusy}
                                                            />
                                                        </Tooltip>
                                                    </ButtonGroup>
                                                </HStack>
                                            )}
                                        </Box>
                                    );
                                })}
                            </VStack>
                        </Box>
                    ))}

                    <Box mt={4} pt={3} borderTopWidth="1px" borderColor="gray.200">
                        <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2}>
                            Add a requirement
                        </Text>
                        <HStack spacing={2} mb={2} align="flex-end">
                            <FormControl w="150px">
                                <FormLabel fontSize="2xs" mb={1} color="gray.600">Level</FormLabel>
                                <Select
                                    size="xs"
                                    bg="white"
                                    value={newLevel}
                                    onChange={(e) => setNewLevel(e.target.value)}
                                >
                                    {Object.keys(levels).sort(byLevel).map((key) => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl w="190px">
                                <FormLabel fontSize="2xs" mb={1} color="gray.600">Element</FormLabel>
                                {elementSelect(newElement, setNewElement, 'Element for new requirement')}
                            </FormControl>
                        </HStack>
                        <Textarea
                            size="sm"
                            rows={3}
                            placeholder="What the campus must have in place to clear this part of the bar"
                            aria-label="New requirement text"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            mb={2}
                        />
                        <Button
                            size="xs"
                            colorScheme="teal"
                            onClick={handleAdd}
                            isLoading={isAdding}
                            isDisabled={!newText.trim()}
                        >
                            Add Requirement
                        </Button>
                    </Box>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    );
};

export default EvidenceRequirementsPanel;
