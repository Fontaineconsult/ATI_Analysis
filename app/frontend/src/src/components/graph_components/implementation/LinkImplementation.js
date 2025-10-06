import React, { useState, useEffect } from 'react';
import {
    VStack,
    FormControl,
    FormLabel,
    Select,
    Button,
    HStack,
    Box,
    Text,
    useToast
} from '@chakra-ui/react';
import { assignImplementationToYSE } from '../../../services/api/put';
import { fetchImplementationsByType } from '../../../services/api/get';

function LinkImplementationModal({
                                     implementationTypes,
                                     yearIdentifier,
                                     onClose,
                                     onSuccess,
                                     currentWorkingGroup,
                                     loadSingleWorkingGroupData
                                 }) {
    const [selectedType, setSelectedType] = useState('');
    const [existingImplementations, setExistingImplementations] = useState([]);
    const [selectedExisting, setSelectedExisting] = useState('');
    const [selectedDescription, setSelectedDescription] = useState('');
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (selectedType) {
            loadExistingImplementations(selectedType);
        }
    }, [selectedType]);

    const loadExistingImplementations = async (type) => {
        setIsLoadingExisting(true);
        try {
            const response = await fetchImplementationsByType(type);
            const implementations = response?.status?.data || response?.data || [];
            setExistingImplementations(implementations);
        } catch (error) {
            console.error('Error loading implementations:', error);
            setExistingImplementations([]);
        } finally {
            setIsLoadingExisting(false);
        }
    };

    const handleLink = async () => {
        if (!selectedType || !selectedExisting) {
            toast({
                title: "Missing selection",
                description: "Please select an implementation.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await assignImplementationToYSE(
                yearIdentifier,
                selectedType,
                selectedExisting
            );

            toast({
                title: "Success",
                description: "Implementation linked successfully.",
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
                description: error.response?.data?.error || "Failed to link implementation.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setSelectedExisting('');
        setSelectedDescription('');
    };

    const handleExistingChange = (e) => {
        setSelectedExisting(e.target.value);
        const selected = existingImplementations.find(impl => impl.title === e.target.value);
        setSelectedDescription(selected?.description || '');
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
                        onChange={handleTypeChange}
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
                        Select Existing
                    </FormLabel>
                    <Select
                        placeholder={isLoadingExisting ? "Loading..." : "Select implementation"}
                        value={selectedExisting}
                        onChange={handleExistingChange}
                        isDisabled={!selectedType || isLoadingExisting}
                        size="sm"
                        borderColor="gray.200"
                        fontSize="sm"
                        _hover={{ borderColor: 'teal.300' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px rgba(56, 178, 172, 0.3)' }}
                    >
                        {existingImplementations.map((impl) => (
                            <option key={impl.unique_id} value={impl.title}>
                                {impl.title}
                            </option>
                        ))}
                    </Select>
                </FormControl>

                {selectedDescription && (
                    <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                        transition="all 0.2s"
                        _hover={{ boxShadow: 'md' }}
                    >
                        <Text
                            fontSize="xs"
                            color="teal.600"
                            fontWeight="semibold"
                            textTransform="uppercase"
                            mb={2}
                        >
                            Description
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                            {selectedDescription}
                        </Text>
                    </Box>
                )}
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
                    variant="solid"
                    size="sm"
                    colorScheme="teal"
                    onClick={handleLink}
                    isLoading={isSubmitting}
                    loadingText="Linking..."
                    isDisabled={!selectedType || !selectedExisting}
                    borderRadius="lg"
                    _hover={{ bg: 'teal.600', boxShadow: 'md' }}
                    transition="all 0.2s"
                >
                    Link to Success Indicator
                </Button>
            </HStack>
        </>
    );
}

export default LinkImplementationModal;