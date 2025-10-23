import React, { useState } from 'react';
import {
    Box,
    Button,
    Textarea,
    Text,
    VStack,
    HStack,
    useToast
} from '@chakra-ui/react';

/**
 * AdminSummaryForm - Component for adding/editing admin reviewer description (evidence summary)
 *
 * @param {string} yearIdentifier - The year success evidence identifier
 * @param {string} currentValue - The current admin_reviewer_description value
 * @param {function} onUpdate - Callback function after successful update
 */
function AdminSummaryForm({ yearIdentifier, currentValue, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(currentValue || '');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSave = async () => {
        if (!description.trim()) {
            toast({
                title: "Validation Error",
                description: "Evidence summary cannot be empty",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/evidence`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_admin_reviewer_description',
                    year_success_evidence: yearIdentifier,
                    description: description
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update evidence summary');
            }

            toast({
                title: "Success",
                description: "Evidence summary updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            setIsEditing(false);

            // Call onUpdate callback if provided
            if (onUpdate) {
                onUpdate(description);
            }
        } catch (error) {
            console.error('Error updating evidence summary:', error);
            toast({
                title: "Update Failed",
                description: error.message || "There was an issue updating the evidence summary",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setDescription(currentValue || '');
        setIsEditing(false);
    };

    // Check if current value is the default "No Review" value
    const hasValue = currentValue && currentValue !== "No Review";

    return (
        <Box
            p={4}
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
            transition="box-shadow 0.2s"
            _hover={{ boxShadow: "md" }}
        >
            <Text fontSize="xs" fontWeight="semibold" color="teal.600" textTransform="uppercase" mb={3}>
                Evidence Summary
            </Text>

            {!isEditing ? (
                <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={hasValue ? "gray.700" : "gray.500"}>
                        {hasValue ? currentValue : "Provide a summary before review"}
                    </Text>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => setIsEditing(true)}
                        alignSelf="flex-end"
                        boxShadow="sm"
                        _hover={{ boxShadow: "md" }}
                    >
                        {hasValue ? "Edit Summary" : "Add Summary"}
                    </Button>
                </VStack>
            ) : (
                <VStack align="stretch" spacing={4}>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter a summary of the evidence provided for this indicator..."
                        size="sm"
                        rows={6}
                        resize="vertical"
                        borderColor="gray.200"
                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px teal.400" }}
                    />
                    <HStack spacing={3} w="100%" justify="flex-end">
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleSave}
                            isLoading={loading}
                            loadingText="Saving..."
                            boxShadow="sm"
                            _hover={{ boxShadow: "md" }}
                        >
                            Save Summary
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            colorScheme="gray"
                            onClick={handleCancel}
                            isDisabled={loading}
                        >
                            Cancel
                        </Button>
                    </HStack>
                </VStack>
            )}
        </Box>
    );
}

export default AdminSummaryForm;
