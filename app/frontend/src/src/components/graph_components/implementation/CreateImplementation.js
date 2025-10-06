import React, { useState } from 'react';
import {
    VStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Button,
    HStack,
    useToast
} from '@chakra-ui/react';
import { createImplementation } from '../../../services/api/post';

function CreateImplementationModal({
                                       implementationTypes,
                                       yearIdentifier,
                                       onClose,
                                       onSuccess,
                                       currentWorkingGroup,
                                       loadSingleWorkingGroupData
                                   }) {
    const [selectedType, setSelectedType] = useState('');
    const [newImplementation, setNewImplementation] = useState({
        title: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleCreateOnly = async () => {
        if (!selectedType || !newImplementation.title || !newImplementation.description) {
            toast({
                title: "Missing fields",
                description: "All fields are required.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createImplementation(
                selectedType,
                newImplementation.title,
                newImplementation.description
            );

            toast({
                title: "Success",
                description: `${selectedType} created.`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAndAssign = async () => {
        if (!selectedType || !newImplementation.title || !newImplementation.description) {
            toast({
                title: "Missing fields",
                description: "All fields are required.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createImplementation(
                selectedType,
                newImplementation.title,
                newImplementation.description,
                yearIdentifier
            );

            toast({
                title: "Success",
                description: `${selectedType} created and assigned.`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });

            if (currentWorkingGroup && loadSingleWorkingGroupData) {
                await loadSingleWorkingGroupData(currentWorkingGroup);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create implementation.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                    <FormLabel
                        fontSize="xs"
                        color="gray.600"
                        fontWeight="semibold"
                        textTransform="uppercase"
                    >
                        Type
                    </FormLabel>
                    <Select
                        placeholder="Select implementation type"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        size="sm"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'teal.300' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px rgba(56, 178, 172, 0.3)' }}
                    >
                        {implementationTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel
                        fontSize="xs"
                        color="gray.600"
                        fontWeight="semibold"
                        textTransform="uppercase"
                    >
                        Title
                    </FormLabel>
                    <Input
                        placeholder="Enter title"
                        value={newImplementation.title}
                        onChange={(e) => setNewImplementation({
                            ...newImplementation,
                            title: e.target.value
                        })}
                        size="sm"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'teal.300' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px rgba(56, 178, 172, 0.3)' }}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel
                        fontSize="xs"
                        color="gray.600"
                        fontWeight="semibold"
                        textTransform="uppercase"
                    >
                        Description
                    </FormLabel>
                    <Textarea
                        placeholder="Enter description"
                        value={newImplementation.description}
                        onChange={(e) => setNewImplementation({
                            ...newImplementation,
                            description: e.target.value
                        })}
                        rows={4}
                        size="sm"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'teal.300' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px rgba(56, 178, 172, 0.3)' }}
                    />
                </FormControl>
            </VStack>

            <HStack mt={6} justify="flex-end" spacing={3}>
                <Button
                    variant="outline"
                    size="sm"
                    colorScheme="gray"
                    onClick={onClose}
                    isDisabled={isSubmitting}
                    borderRadius="lg"
                    _hover={{ boxShadow: 'md' }}
                    transition="all 0.2s"
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    colorScheme="blue"
                    onClick={handleCreateOnly}
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                    borderRadius="lg"
                    _hover={{ boxShadow: 'md', bg: 'blue.50' }}
                    transition="all 0.2s"
                >
                    Create Only
                </Button>
                {yearIdentifier && (
                    <Button
                        variant="solid"
                        size="sm"
                        colorScheme="teal"
                        onClick={handleCreateAndAssign}
                        isLoading={isSubmitting}
                        loadingText="Creating..."
                        borderRadius="lg"
                        _hover={{ bg: 'teal.600', boxShadow: 'md' }}
                        transition="all 0.2s"
                    >
                        Create & Assign
                    </Button>
                )}
            </HStack>
        </>
    );
}

export default CreateImplementationModal;