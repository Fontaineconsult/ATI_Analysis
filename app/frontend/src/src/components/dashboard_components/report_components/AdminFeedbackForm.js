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
import { addAdminReviewerNote } from '../../../services/api/post';
import { updateAdminReviewerNote, deleteAdminReviewerNote } from '../../../services/api/put';

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
    // Inline edit: the unique_id of the note being edited, and its draft text.
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [rowBusy, setRowBusy] = useState(false);
    const { user } = useContext(UserContext);
    const toast = useToast();

    const fail = (title, e) => toast({
        title,
        description: e?.response?.data?.error || e?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
    });

    const startEdit = (note) => {
        setEditingId(note?.unique_id || null);
        setEditContent(note?.content || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleEditSave = async () => {
        if (!editContent.trim()) {
            toast({ title: 'Validation Error', description: 'Feedback cannot be empty',
                    status: 'warning', duration: 3000, isClosable: true });
            return;
        }
        setRowBusy(true);
        try {
            await updateAdminReviewerNote(editingId, editContent.trim());
            toast({ title: 'Feedback updated', status: 'success', duration: 2000, isClosable: true });
            cancelEdit();
            if (onUpdate) await onUpdate();
        } catch (e) {
            fail('Failed to update feedback', e);
        } finally {
            setRowBusy(false);
        }
    };

    const handleDelete = async (note) => {
        if (!note?.unique_id) return;
        setRowBusy(true);
        try {
            await deleteAdminReviewerNote(note.unique_id);
            toast({ title: 'Feedback deleted', status: 'success', duration: 2000, isClosable: true });
            if (editingId === note.unique_id) cancelEdit();
            if (onUpdate) await onUpdate();
        } catch (e) {
            fail('Failed to delete feedback', e);
        } finally {
            setRowBusy(false);
        }
    };

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
            await addAdminReviewerNote(yearIdentifier, noteContent, user.employee_id);

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
                description: error?.response?.data?.error || error.message || "There was an issue adding the feedback",
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
                    {adminReviewNotes.map((item, index) => {
                        const note = item.note?.properties || {};
                        const isEditing = editingId && editingId === note.unique_id;
                        return (
                        <Box
                            key={note.unique_id || index}
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
                                        {formatDate(note.date_created)}
                                    </Text>
                                </HStack>
                                {/* Editing an admin note leaves its author and date alone —
                                    the record is of who gave the feedback, not who last typed. */}
                                {!isEditing && note.unique_id && (
                                    <HStack spacing={1}>
                                        <Button size="xs" variant="ghost" colorScheme="teal"
                                                isDisabled={rowBusy}
                                                aria-label="Edit this feedback"
                                                onClick={() => startEdit(note)}>
                                            Edit
                                        </Button>
                                        <Button size="xs" variant="ghost" colorScheme="red"
                                                isDisabled={rowBusy}
                                                aria-label="Delete this feedback"
                                                onClick={() => handleDelete(note)}>
                                            Delete
                                        </Button>
                                    </HStack>
                                )}
                            </HStack>

                            {isEditing ? (
                                <VStack align="stretch" spacing={2}>
                                    <Textarea
                                        size="sm"
                                        bg="white"
                                        rows={4}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        aria-label="Edit administrative review feedback"
                                    />
                                    <HStack justify="flex-end" spacing={2}>
                                        <Button size="xs" variant="ghost" onClick={cancelEdit} isDisabled={rowBusy}>
                                            Cancel
                                        </Button>
                                        <Button size="xs" colorScheme="teal" onClick={handleEditSave}
                                                isLoading={rowBusy} isDisabled={!editContent.trim()}>
                                            Save
                                        </Button>
                                    </HStack>
                                </VStack>
                            ) : (
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                                    {note.content}
                                </Text>
                            )}
                        </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text fontSize="sm" color="gray.600" mb={4}>
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
