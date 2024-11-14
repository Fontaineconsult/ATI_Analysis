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

        const indicatorData = {
            indicator_number: number,
            goal_number: goalNumber,
            sub_committee: subCommittee,
            success_indicator_text: successIndicatorText,
            date_added: dateAdded,
            removed,
        };

        try {
            await createSuccessIndicator(
                indicatorData.indicator_number,
                indicatorData.goal_number,
                indicatorData.sub_committee,
                indicatorData.success_indicator_text,
                indicatorData.date_added,
                indicatorData.removed
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
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
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
