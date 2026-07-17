import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useToast,
    VStack,
} from '@chakra-ui/react';

import { addPrioritizedIndicator } from '../../../services/api/post';
import StatusProgression from './StatusProgression';

/**
 * Modal that lists all `availableIndicators` for a working group and lets the
 * user prioritize any that aren't already on the WGP. Already-prioritized
 * indicators render with a "Prioritized" badge and a disabled button.
 *
 * Props:
 *   isOpen / onClose             — Chakra disclosure state
 *   workingGroupPlanIdentifier   — target WGP ('2025-2026-sfsu-web')
 *   workingGroupName             — heading hint ('Web')
 *   availableIndicators          — full list of SIs for the WG (from the API)
 *   prioritizedIndicatorIds      — Set/array of unique_ids already prioritized
 *   onIndicatorAdded             — async () => void; called after a successful add
 *                                  so the parent can re-fetch the campus plan
 */
function IndicatorSelectorModal({
    isOpen,
    onClose,
    workingGroupPlanIdentifier,
    workingGroupName,
    availableIndicators,
    prioritizedIndicatorIds,
    onIndicatorAdded,
}) {
    const [submitting, setSubmitting] = useState(null);  // composite_key being added
    const toast = useToast();

    const prioritizedSet = useMemo(
        () => new Set(prioritizedIndicatorIds || []),
        [prioritizedIndicatorIds]
    );

    const handleAdd = async (indicator) => {
        setSubmitting(indicator.composite_key);
        try {
            await addPrioritizedIndicator(workingGroupPlanIdentifier, indicator.composite_key);
            toast({
                title: 'Indicator prioritized',
                description: `${indicator.composite_key} added to ${workingGroupName}.`,
                status: 'success',
                duration: 2500,
                isClosable: true,
            });
            if (onIndicatorAdded) await onIndicatorAdded();
        } catch (err) {
            toast({
                title: 'Could not prioritize indicator',
                description: err.message || 'Unknown error',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md" color="gray.800">
                    Add Prioritized Indicator — {workingGroupName}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {availableIndicators.length === 0 ? (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            No indicators are available for this working group.
                        </Text>
                    ) : (
                        <VStack align="stretch" spacing={2}>
                            {availableIndicators.map((indicator) => {
                                const alreadyPrioritized = prioritizedSet.has(indicator.unique_id);
                                const isSubmitting = submitting === indicator.composite_key;

                                return (
                                    <Box
                                        key={indicator.unique_id}
                                        p={3}
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        bg={alreadyPrioritized ? 'gray.50' : 'white'}
                                    >
                                        <HStack justify="space-between" align="center" spacing={3}>
                                            <Box flex={1}>
                                                <HStack align="baseline" spacing={2}>
                                                    <Text fontFamily="mono" fontSize="xs" color="gray.600" minW="60px">
                                                        {indicator.composite_key}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.800">
                                                        {indicator.success_indicator}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                            <StatusProgression
                                                previousStatusLevel={indicator.previous_status_level}
                                                currentStatusLevel={indicator.status_level}
                                            />
                                            {alreadyPrioritized ? (
                                                <Text fontSize="xs" color="teal.600" fontWeight="medium">
                                                    Prioritized
                                                </Text>
                                            ) : (
                                                <Button
                                                    size="xs"
                                                    colorScheme="teal"
                                                    onClick={() => handleAdd(indicator)}
                                                    isLoading={isSubmitting}
                                                    loadingText="Adding"
                                                >
                                                    Add
                                                </Button>
                                            )}
                                        </HStack>
                                    </Box>
                                );
                            })}
                        </VStack>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="outline" onClick={onClose}>
                        Done
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default IndicatorSelectorModal;
