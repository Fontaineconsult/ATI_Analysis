import React, { useState } from 'react';
import {
    Button,
    FormControl,
    FormLabel,
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

import { addProgressUpdate } from '../../../services/api/post';

// Mirrors trajectory_choices in app/data_config.py. Hardcoded here rather than
// fetched per-render — the set is small and stable. If it grows, surface via API.
export const TRAJECTORY_OPTIONS = [
    { value: 'improving', label: 'Improving' },
    { value: 'on_track',  label: 'On Track' },
    { value: 'stagnant',  label: 'Stagnant' },
    { value: 'at_risk',   label: 'At Risk' },
    { value: 'failing',   label: 'Failing' },
];

/**
 * Modal for logging a ProgressUpdate against a specific (WGP, YSE) pair.
 *
 * Props:
 *   isOpen / onClose             — Chakra disclosure state
 *   workingGroupPlanIdentifier   — target WGP
 *   yseIdentifier                — YSE the update is "about"
 *   indicatorLabel               — display string for the heading (e.g. '1.1-web — Repair sites')
 *   authorUniqueId               — optional; current user's Person.unique_id
 *   onProgressAdded              — async () => void; called after a successful create
 */
function ProgressUpdateModal({
    isOpen,
    onClose,
    workingGroupPlanIdentifier,
    yseIdentifier,
    indicatorLabel,
    authorUniqueId,
    onProgressAdded,
}) {
    const [note, setNote] = useState('');
    const [trajectory, setTrajectory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const reset = () => {
        setNote('');
        setTrajectory('');
    };

    const handleClose = () => {
        if (!submitting) {
            reset();
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!note.trim()) {
            toast({
                title: 'Note is required',
                status: 'error',
                duration: 2500,
                isClosable: true,
            });
            return;
        }

        setSubmitting(true);
        try {
            await addProgressUpdate(workingGroupPlanIdentifier, yseIdentifier, {
                note: note.trim(),
                trajectory: trajectory || null,
                authorUniqueId: authorUniqueId || null,
            });
            toast({
                title: 'Progress logged',
                status: 'success',
                duration: 2500,
                isClosable: true,
            });
            if (onProgressAdded) await onProgressAdded();
            reset();
            onClose();
        } catch (err) {
            toast({
                title: 'Could not log progress',
                description: err.message || 'Unknown error',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md" color="gray.800">
                    Log progress
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        {indicatorLabel && (
                            <Text fontSize="sm" color="gray.600" fontFamily="mono">
                                {indicatorLabel}
                            </Text>
                        )}
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800">Trajectory</FormLabel>
                            <Select
                                size="sm"
                                placeholder="Choose a trajectory (optional)"
                                value={trajectory}
                                onChange={(e) => setTrajectory(e.target.value)}
                            >
                                {TRAJECTORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800">Note</FormLabel>
                            <Textarea
                                size="sm"
                                placeholder="What changed since the last update?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={5}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="outline" mr={3} onClick={handleClose} isDisabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={submitting}
                        loadingText="Logging"
                    >
                        Log progress
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default ProgressUpdateModal;
