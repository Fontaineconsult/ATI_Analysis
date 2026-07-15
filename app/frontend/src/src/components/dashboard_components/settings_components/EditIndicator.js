import React, { useContext, useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Textarea,
    FormHelperText,
    Badge,
    Text,
    HStack,
    useToast,
} from '@chakra-ui/react';
import { updateSuccessIndicatorExamples } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';

// Edit the companion-guide evidence for a single existing SuccessIndicator.
// Scope: the four companion fields (examples of evidence + Established / Managed /
// Optimizing level examples). Identity (composite_key), text, and status are edited
// elsewhere in the settings table, so they're shown read-only here for context.
const EditIndicator = ({ indicator, isOpen, onClose }) => {
    const { refreshIndicators } = useContext(DataContext);
    const toast = useToast();

    const [examplesOfEvidenceText, setExamplesOfEvidenceText] = useState('');
    const [establishedExample, setEstablishedExample] = useState('');
    const [managedExample, setManagedExample] = useState('');
    const [optimizingExample, setOptimizingExample] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Re-seed the form whenever a different indicator is opened for editing.
    useEffect(() => {
        if (!indicator) return;
        setExamplesOfEvidenceText((indicator.examples_of_evidence || []).join('\n'));
        setEstablishedExample(indicator.established_example || '');
        setManagedExample(indicator.managed_example || '');
        setOptimizingExample(indicator.optimizing_example || '');
    }, [indicator, isOpen]);

    if (!indicator) return null;

    const handleSave = async () => {
        // One bullet per non-empty line.
        const examplesOfEvidence = examplesOfEvidenceText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        try {
            setIsSaving(true);
            await updateSuccessIndicatorExamples(
                indicator.composite_key,
                examplesOfEvidence,
                establishedExample || null,
                managedExample || null,
                optimizingExample || null
            );
            toast({
                title: 'Evidence updated',
                description: `Companion guide for ${indicator.composite_key} saved.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            refreshIndicators();
            onClose();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to update the evidence.';
            toast({
                title: 'Error',
                description: errorMessage,
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={2} align="center">
                        <Text>Edit Evidence</Text>
                        <Badge colorScheme="teal" variant="subtle">{indicator.composite_key}</Badge>
                    </HStack>
                    <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1} noOfLines={2}>
                        {indicator.success_indicator}
                    </Text>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={3}>
                        <FormLabel>Examples of Evidence</FormLabel>
                        <Textarea
                            value={examplesOfEvidenceText}
                            onChange={(e) => setExamplesOfEvidenceText(e.target.value)}
                            placeholder="One example per line"
                            rows={6}
                        />
                        <FormHelperText>One bullet per line. Blank lines are ignored.</FormHelperText>
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Established Level</FormLabel>
                        <Textarea
                            value={establishedExample}
                            onChange={(e) => setEstablishedExample(e.target.value)}
                            placeholder="Markdown supported"
                            rows={6}
                        />
                        <FormHelperText>The common case. Clear to hide this sub-section.</FormHelperText>
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Managed Level</FormLabel>
                        <Textarea
                            value={managedExample}
                            onChange={(e) => setManagedExample(e.target.value)}
                            placeholder="Optional"
                            rows={3}
                        />
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Optimizing Level</FormLabel>
                        <Textarea
                            value={optimizingExample}
                            onChange={(e) => setOptimizingExample(e.target.value)}
                            placeholder="Optional"
                            rows={3}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSaving}>Cancel</Button>
                    <Button colorScheme="blue" onClick={handleSave} isLoading={isSaving}>Save Evidence</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditIndicator;
