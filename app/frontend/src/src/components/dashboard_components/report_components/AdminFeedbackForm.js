import React, { useState, useContext } from 'react';
import {
    Box,
    Button,
    Textarea,
    Text,
    VStack,
    HStack,
    useToast,
    Badge,
    Divider
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';

/**
 * AdminFeedbackForm - Component for displaying and adding admin reviewer notes
 *
 * @param {string} yearIdentifier - The year success evidence identifier
 * @param {Array} adminReviewNotes - Array of existing admin review notes with creators
 * @param {function} onUpdate - Callback function after successful note addition
 */
function AdminFeedbackForm({ yearIdentifier, adminReviewNotes = [], onUpdate }) {
    const [isAdding, setIsAdding] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleSave = async () => {
        if (!noteContent.trim()) {
            toast({
                title: "Validation Error",
                description: "Feedback cannot be empty",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!user?.employee_id) {
            toast({
                title: "Error",
                description: "User information not available",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/evidence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add_admin_reviewer_note',
                    year_success_evidence: yearIdentifier,
                    note_content: noteContent,
                    created_by_employee_id: user.employee_id
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add feedback');
            }

            toast({
                title: "Success",
                description: "Administrative review feedback added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            setNoteContent('');
            setIsAdding(false);

            // Call onUpdate callback if provided
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error adding feedback:', error);
            toast({
                title: "Failed to Add Feedback",
                description: error.message || "There was an issue adding the feedback",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setNoteContent('');
        setIsAdding(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

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
                Administrative Review Notes
            </Text>

            {/* Display existing notes */}
            {adminReviewNotes && adminReviewNotes.length > 0 ? (
                <VStack align="stretch" spacing={3} mb={4}>
                    {adminReviewNotes.map((item, index) => (
                        <Box
                            key={index}
                            p={3}
                            bg="teal.50"
                            borderRadius="md"
                            borderLeft="3px solid"
                            borderLeftColor="teal.400"
                        >
                            <HStack justify="space-between" mb={2}>
                                <HStack spacing={2}>
                                    <Badge colorScheme="teal" fontSize="xs" px={2} py={1} borderRadius="md">
                                        {item.created_by?.properties?.name || 'Unknown'}
                                    </Badge>
                                    <Text fontSize="xs" color="gray.600">
                                        {formatDate(item.note?.properties?.date_created)}
                                    </Text>
                                </HStack>
                            </HStack>
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                                {item.note?.properties?.content}
                            </Text>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="sm" color="gray.500" mb={4}>
                    No admin reviewer feedback provided yet
                </Text>
            )}

            {adminReviewNotes && adminReviewNotes.length > 0 && <Divider borderColor="gray.200" my={4} />}

            {/* Add new note form */}
            {!isAdding ? (
                <HStack justify="flex-end" mb={4}>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => setIsAdding(true)}
                        boxShadow="sm"
                        _hover={{ boxShadow: "md" }}
                    >
                        Add Feedback
                    </Button>
                </HStack>
            ) : (
                <VStack align="stretch" spacing={4}>
                    <Textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Enter administrative review notes or feedback for the implementers..."
                        size="sm"
                        rows={4}
                        resize="vertical"
                        autoFocus
                        borderColor="gray.200"
                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px teal.400" }}
                    />
                    <HStack spacing={3} justify="flex-end">
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleSave}
                            isLoading={loading}
                            loadingText="Saving..."
                            boxShadow="sm"
                            _hover={{ boxShadow: "md" }}
                        >
                            Save Feedback
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

export default AdminFeedbackForm;
