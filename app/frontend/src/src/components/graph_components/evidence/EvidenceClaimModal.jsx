import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Checkbox,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    Text,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { setEvidenceSatisfies, setEvidenceRationale } from '../../../services/api/put';

// Alphabetical level order happens to be rubric order, but say it explicitly rather
// than relying on the coincidence.
const LEVEL_ORDER = ['established', 'managed', 'optimizing'];
const LEVEL_COLOR = { established: 'teal', managed: 'purple', optimizing: 'orange' };
const byLevel = (a, b) => {
    const ai = LEVEL_ORDER.indexOf(a);
    const bi = LEVEL_ORDER.indexOf(b);
    return (ai === -1 ? LEVEL_ORDER.length : ai) - (bi === -1 ? LEVEL_ORDER.length : bi);
};

/**
 * Pick which parts of the indicator's companion bar this evidence link claims to satisfy.
 *
 * `strength` next door rates the LINK — how well this implementation addresses the
 * indicator overall. This names the specific requirements it answers for, which is what
 * lets a coverage view show which parts of the bar have evidence and which are bare.
 *
 * Checkboxes rather than a multi-select: requirement text runs 80–200 characters and is
 * the thing being judged, so it has to be readable at the moment of choosing.
 *
 * The requirement list arrives with the indicator payload, so there is no fetch here —
 * handles live on the rel, text lives on the indicator, and the join happens in the view.
 */
const EvidenceClaimModal = ({
    isOpen,
    onClose,
    yearIdentifier,
    implementationType,
    implementationUniqueId,
    implementationTitle,
    requirements = [],
    claimed = [],
    rationale: initialRationale = '',
    onSaved,
}) => {
    const toast = useToast();
    const [selected, setSelected] = useState([]);
    const [rationale, setRationale] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Re-seed whenever a different link is opened, and whenever the payload refreshes
    // underneath an open modal.
    useEffect(() => {
        if (isOpen) {
            setSelected(claimed || []);
            setRationale(initialRationale || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, implementationUniqueId, JSON.stringify(claimed), initialRationale]);

    const grouped = useMemo(() => {
        const out = {};
        [...requirements]
            .sort((a, b) => byLevel(a.level, b.level) || (a.seq || 0) - (b.seq || 0))
            .forEach((r) => {
                (out[r.level] = out[r.level] || []).push(r);
            });
        return out;
    }, [requirements]);

    const toggle = (handle) => {
        setSelected((prev) =>
            prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await setEvidenceSatisfies(
                yearIdentifier, implementationType, implementationUniqueId, selected
            );
            // Separate call, like strength and control — each qualifier on this link moves
            // on its own. Ordered after the ticks so a rationale failure never leaves the
            // user unsure whether the selection saved.
            if ((rationale || '') !== (initialRationale || '')) {
                await setEvidenceRationale(
                    yearIdentifier, implementationType, implementationUniqueId,
                    rationale.trim() || null
                );
            }
            toast({
                title: 'Requirements updated',
                description: selected.length
                    ? `${implementationTitle} now claims ${selected.length} requirement(s).`
                    : `${implementationTitle} no longer claims any requirement.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onSaved?.();
            onClose();
        } catch (error) {
            toast({
                title: 'Failed to save',
                description: error?.response?.data?.error
                    || 'Could not update the requirements this evidence claims.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={2}>
                    <Text fontSize="md">Evidence Detail</Text>
                    <Text fontSize="sm" fontWeight="normal" color="gray.600" noOfLines={2} mt={1}>
                        {implementationTitle}
                    </Text>
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <FormControl mb={5}>
                        <FormLabel fontSize="sm" mb={1}>
                            How does this work answer this indicator?
                        </FormLabel>
                        <Textarea
                            size="sm"
                            rows={4}
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            placeholder="What this work contributes here, and why that answers what the indicator asks for."
                        />
                        <FormHelperText fontSize="xs">
                            Recorded on this link, not on the implementation — the same work
                            evidences other indicators for different reasons.
                        </FormHelperText>
                    </FormControl>

                    <Divider mb={4} />

                    <Text fontSize="xs" color="gray.600" mb={4}>
                        Which parts of this indicator&apos;s companion bar does this work
                        actually answer for? Strength rates the link as a whole; this records
                        what it covers.
                    </Text>

                    {requirements.length === 0 ? (
                        <Alert status="info" fontSize="sm" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                No evidence requirements are authored for this indicator yet,
                                so there is nothing to tick — the rationale above still applies.
                                Requirements are added under Settings → Success Indicators, in
                                the indicator&apos;s Edit panel.
                            </Box>
                        </Alert>
                    ) : (
                        Object.keys(grouped).sort(byLevel).map((level) => (
                            <Box key={level} mb={5}>
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
                                        const isOn = selected.includes(r.handle);
                                        return (
                                            <Box
                                                key={r.handle}
                                                p={2}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                borderColor={isOn ? 'teal.300' : 'gray.200'}
                                                bg={isOn ? 'teal.50' : 'white'}
                                                transition="background-color 0.15s"
                                            >
                                                <Checkbox
                                                    isChecked={isOn}
                                                    onChange={() => toggle(r.handle)}
                                                    alignItems="flex-start"
                                                    spacing={3}
                                                >
                                                    <Box>
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
                                                </Checkbox>
                                            </Box>
                                        );
                                    })}
                                </VStack>
                            </Box>
                        ))
                    )}
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={3} w="100%" justify="space-between">
                        <Text fontSize="xs" color="gray.600">
                            {selected.length} of {requirements.length} selected
                        </Text>
                        <HStack spacing={3}>
                            <Button variant="ghost" size="sm" onClick={onClose} isDisabled={isSaving}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="teal"
                                size="sm"
                                onClick={handleSave}
                                isLoading={isSaving}
                                                >
                                Save
                            </Button>
                        </HStack>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EvidenceClaimModal;
