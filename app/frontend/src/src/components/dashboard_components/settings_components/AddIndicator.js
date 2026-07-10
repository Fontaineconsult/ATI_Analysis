import React, { useContext, useState } from 'react';
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
    Input,
    Select,
    Checkbox,
    Textarea,
    FormHelperText,
    useToast,
} from '@chakra-ui/react';
import { createSuccessIndicator } from '../../../services/api/post';
import { DataContext } from "../../../context/DataContext"; // Adjust the import path if necessary

const AddIndicator = ({ indicators = { goals: [] }, wg, isOpen, onClose, onSubmit }) => {
    const [number, setNumber] = useState('');
    const [goalNumber, setGoalNumber] = useState('');
    const [subCommittee, setSubCommittee] = useState(wg || '');
    const [successIndicatorText, setSuccessIndicatorText] = useState('');
    const [dateAdded, setDateAdded] = useState('');
    const [removed, setRemoved] = useState(false);
    // Optional companion-guide fields (empty → sent as [] / null by the service layer).
    const [examplesOfEvidenceText, setExamplesOfEvidenceText] = useState('');
    const [establishedExample, setEstablishedExample] = useState('');
    const [managedExample, setManagedExample] = useState('');
    const [optimizingExample, setOptimizingExample] = useState('');
    const { refreshIndicators } = useContext(DataContext);

    const toast = useToast();

    // Extract goal options safely
    const goalOptions = indicators.goals?.map((goal) => ({
        value: goal.goal_number,
        label: `${goal.goal_number}: ${goal.goal}`,
    })) || [];

    const handleFormSubmit = async () => {
        if (!number || !goalNumber || !subCommittee || !successIndicatorText || !dateAdded) {
            toast({
                title: 'Missing fields',
                description: 'Please fill in all required fields.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Examples of evidence: one bullet per non-empty line.
        const examplesOfEvidence = examplesOfEvidenceText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        const indicatorData = {
            indicator_number: number,
            goal_number: goalNumber,
            sub_committee: subCommittee,
            success_indicator_text: successIndicatorText,
            date_added: dateAdded,
            removed,
            examples_of_evidence: examplesOfEvidence,
            established_example: establishedExample || null,
            managed_example: managedExample || null,
            optimizing_example: optimizingExample || null,
        };

        try {
            await createSuccessIndicator(
                indicatorData.indicator_number,
                indicatorData.goal_number,
                indicatorData.sub_committee,
                indicatorData.success_indicator_text,
                indicatorData.date_added,
                indicatorData.removed,
                indicatorData.examples_of_evidence,
                indicatorData.established_example,
                indicatorData.managed_example,
                indicatorData.optimizing_example
            );

            toast({
                title: 'Success Indicator Added',
                description: 'The success indicator has been successfully added.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onSubmit(indicatorData);
            refreshIndicators();
            onClose();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to add the success indicator.';
            toast({
                title: 'Error',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add New Indicator for {indicators.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={3} isRequired>
                        <FormLabel>Goal Number</FormLabel>
                        <Select
                            placeholder="Select a Goal Number"
                            value={goalNumber}
                            onChange={(e) => setGoalNumber(e.target.value)}
                        >
                            {goalOptions.map((goal) => (
                                <option key={goal.value} value={goal.value}>
                                    {goal.label}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl mb={3} isRequired>
                        <FormLabel>Sub Committee</FormLabel>
                        <Input
                            type="text"
                            value={subCommittee}
                            onChange={(e) => setSubCommittee(e.target.value)}
                        />
                    </FormControl>
                    <FormControl mb={3} isRequired>
                        <FormLabel>Indicator Number</FormLabel>
                        <Input
                            type="text"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                        />
                    </FormControl>
                    <FormControl mb={3} isRequired>
                        <FormLabel>Success Indicator Text</FormLabel>
                        <Textarea
                            value={successIndicatorText}
                            onChange={(e) => setSuccessIndicatorText(e.target.value)}
                        />
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Examples of Evidence</FormLabel>
                        <Textarea
                            value={examplesOfEvidenceText}
                            onChange={(e) => setExamplesOfEvidenceText(e.target.value)}
                            placeholder="One example per line"
                            rows={4}
                        />
                        <FormHelperText>One bullet per line. Optional.</FormHelperText>
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Established Level</FormLabel>
                        <Textarea
                            value={establishedExample}
                            onChange={(e) => setEstablishedExample(e.target.value)}
                            placeholder="Markdown supported"
                            rows={4}
                        />
                        <FormHelperText>The common case. Optional; Markdown supported.</FormHelperText>
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Managed Level</FormLabel>
                        <Textarea
                            value={managedExample}
                            onChange={(e) => setManagedExample(e.target.value)}
                            placeholder="Optional — rarely used"
                            rows={2}
                        />
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Example of Optimizing Level</FormLabel>
                        <Textarea
                            value={optimizingExample}
                            onChange={(e) => setOptimizingExample(e.target.value)}
                            placeholder="Optional — rarely used"
                            rows={2}
                        />
                    </FormControl>
                    <FormControl mb={3} isRequired>
                        <FormLabel>Date Added</FormLabel>
                        <Input
                            type="date"
                            value={dateAdded}
                            onChange={(e) => setDateAdded(e.target.value)}
                        />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                        <Checkbox isChecked={removed} onChange={(e) => setRemoved(e.target.checked)}>
                            Removed
                        </Checkbox>
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="blue" onClick={handleFormSubmit}>Add Indicator</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddIndicator;
