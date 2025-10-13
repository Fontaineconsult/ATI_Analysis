import React, { useState } from 'react';
import {
    Box,
    Text,
    Heading,
    Flex,
    Divider,
    Button,
    HStack,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Badge,
    useToast
} from '@chakra-ui/react';
import { FaEdit, FaSave, FaTimes, FaTrophy } from 'react-icons/fa';
import { updateAccomplishment } from '../../../services/api/put';
import { createAccomplishment } from '../../../services/api/post';
import { workingGroupCodeFromName } from '../../../services/utils/tools'


function Accomplishment({
                            accomplishmentData,
                            isNew = false,
                            goalNumber,
                            workingGroup,
                            academicYear,
                            onSuccess,
                            onCancel,
                            onUpdate
                        }) {
    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState({
        name: accomplishmentData?.properties?.name || '',
        description: accomplishmentData?.properties?.description || '',
        academic_year: academicYear,
        advanced_goal_number: goalNumber,
        working_group: workingGroupCodeFromName(workingGroup),  // This needs to be sent
        unique_id: accomplishmentData?.properties?.unique_id || null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!formData.name || !formData.description) {
            toast({
                title: "Missing required fields",
                description: "Please fill in name and description",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isNew) {
                await createAccomplishment(formData);
                toast({
                    title: "Accomplishment created successfully",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
                if (onSuccess) onSuccess();
            } else {
                await updateAccomplishment(formData);
                toast({
                    title: "Accomplishment updated successfully",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
                setIsEditing(false);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            toast({
                title: isNew ? "Error creating accomplishment" : "Error updating accomplishment",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (isNew && onCancel) {
            onCancel();
        } else {
            // Reset form to original data
            setFormData({
                name: accomplishmentData?.properties?.name || '',
                description: accomplishmentData?.properties?.description || '',
                academic_year: academicYear,
                advanced_goal_number: goalNumber,
                working_group: workingGroup,
                unique_id: accomplishmentData?.properties?.unique_id || null
            });
        }
    };

    // Edit/Create Form View
    if (isEditing) {
        return (
            <Box
                p={4}
                mb={3}
                borderWidth="1px"
                borderColor="blue.200"
                borderRadius="lg"
                bg="blue.50"
            >
                <VStack spacing={3} align="stretch">
                    <HStack>
                        <FaTrophy color="blue" />
                        <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                            {isNew ? 'New Accomplishment' : 'Edit Accomplishment'}
                        </Text>
                    </HStack>

                    <FormControl isRequired>
                        <FormLabel fontSize="xs" color="blue.600">Accomplishment Name</FormLabel>
                        <Input
                            size="sm"
                            bg="white"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter accomplishment name"
                            borderColor="blue.200"
                            _hover={{ borderColor: "blue.300" }}
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontSize="xs" color="blue.600">Description</FormLabel>
                        <Textarea
                            size="sm"
                            bg="white"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe what was accomplished and its impact"
                            rows={4}
                            borderColor="blue.200"
                            _hover={{ borderColor: "blue.300" }}
                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                        />
                    </FormControl>

                    {academicYear && (
                        <Box>
                            <Text fontSize="xs" color="gray.600">
                                Academic Year: <Badge colorScheme="gray">{academicYear}</Badge>
                            </Text>
                        </Box>
                    )}

                    <HStack justify="flex-end" pt={2}>
                        <Button
                            size="xs"
                            variant="outline"
                            leftIcon={<FaTimes />}
                            onClick={handleCancel}
                            isDisabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="xs"
                            colorScheme="blue"
                            leftIcon={<FaSave />}
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            loadingText={isNew ? "Creating..." : "Saving..."}
                        >
                            {isNew ? 'Create' : 'Save'}
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        );
    }

    // Display View (for existing accomplishments)
    if (!accomplishmentData) return null;

    // Note: The schema shows 'description' but your current component uses 'accomplishment_description'
    // Adjusting to use 'description' based on the schema
    const { name, description } = accomplishmentData.properties;

    return (
        <Box
            p={4}
            mb={3}
            borderWidth="1px"
            borderColor="blue.200"
            borderRadius="lg"
            bg="white"
            _hover={{ bg: "blue.50" }}
            transition="all 0.2s"
        >
            <Flex justify="space-between" align="start" mb={2}>
                <HStack flex="1">
                    <Heading as="h5" size="sm" color="gray.800">
                        {name}
                    </Heading>
                </HStack>
                <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    leftIcon={<FaEdit />}
                    onClick={() => setIsEditing(true)}
                >
                    Edit
                </Button>
            </Flex>

            <Divider mb={3} borderColor="blue.100" />

            <VStack align="stretch" spacing={2}>
                <Box>
                    <Text fontSize="xs" color="blue.600" fontWeight="semibold">Description:</Text>
                    <Text fontSize="sm" color="gray.700">
                        {description || accomplishmentData.properties.accomplishment_description}
                    </Text>
                </Box>

                {academicYear && (
                    <HStack>
                        <Badge colorScheme="blue" fontSize="xs">
                            {academicYear}
                        </Badge>
                        {workingGroup && (
                            <Badge colorScheme="gray" fontSize="xs">
                                {workingGroup}
                            </Badge>
                        )}
                    </HStack>
                )}
            </VStack>
        </Box>
    );
}

export default Accomplishment;