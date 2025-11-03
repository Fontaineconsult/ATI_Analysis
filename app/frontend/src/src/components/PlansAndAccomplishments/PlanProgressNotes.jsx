import React, { useState, useMemo, useContext } from 'react';
import {
    VStack,
    HStack,
    Box,
    Text,
    Textarea,
    Input,
    Button,
    useToast,
    Heading,
    Divider,
    Badge
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { addProgressNoteToPlan } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';

function PlanProgressNotes({ planUniqueId, planName, progressNotesData, onUpdate }) {
    const { refreshImplementations } = useContext(DataContext);
    const { currentUser } = useContext(UserContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newNote, setNewNote] = useState({
        name: '',
        content: ''
    });
    const toast = useToast();

    // Parse and sort the progress notes from the data
    const progressNotes = useMemo(() => {
        if (!progressNotesData || progressNotesData.length === 0) {
            return [];
        }

        // Transform the data structure
        const notes = progressNotesData.map(noteData => {
            const note = noteData.note?.properties || noteData.note || {};
            const creator = noteData.created_by?.properties || noteData.created_by || null;

            return {
                unique_id: note.unique_id,
                name: note.name,
                content: note.content,
                date_created: note.date_created,
                created_by: creator ? {
                    unique_id: creator.unique_id,
                    name: creator.name,
                    email: creator.email,
                    employee_id: creator.employee_id
                } : null
            };
        });

        // Sort by date, newest first
        return notes.sort((a, b) => {
            if (!a.date_created) return 1;
            if (!b.date_created) return -1;
            return new Date(b.date_created) - new Date(a.date_created);
        });
    }, [progressNotesData]);

    const handleAddNote = async () => {
        if (!newNote.name.trim() || !newNote.content.trim()) {
            toast({
                title: "Missing required fields",
                description: "Please provide both a title and content for the note",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        // Check if user is logged in
        if (!currentUser?.unique_id) {
            toast({
                title: "User not identified",
                description: "Please select a user from the settings to add notes",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await addProgressNoteToPlan(
                planUniqueId,
                newNote.name,
                newNote.content,
                currentUser.unique_id  // Pass the current user's unique_id
            );

            // Always show success toast and refresh on successful API call
            toast({
                title: "Progress note added",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });

            // Reset form
            setNewNote({ name: '', content: '' });
            setShowAddForm(false);

            // Use specific onUpdate if provided, otherwise fall back to refreshImplementations
            if (onUpdate) {
                await onUpdate();
            } else if (refreshImplementations) {
                await refreshImplementations();
            }

        } catch (error) {
            toast({
                title: "Error adding progress note",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
            bg="white"
        >
            <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                    <Heading size="sm" color="gray.700">
                        Progress Updates
                    </Heading>
                    <Button
                        size="xs"
                        colorScheme="teal"
                        leftIcon={<FaPlus />}
                        onClick={() => setShowAddForm(!showAddForm)}
                        variant={showAddForm ? "solid" : "outline"}
                    >
                        {showAddForm ? 'Cancel' : 'Add Note'}
                    </Button>
                </HStack>

                {showAddForm && (
                    <Box
                        p={3}
                        borderWidth="1px"
                        borderColor="teal.300"
                        borderRadius="md"
                        bg="teal.50"
                    >
                        <VStack spacing={2} align="stretch">
                            <Input
                                size="sm"
                                placeholder="Note title (e.g., 'Week 1 Update')"
                                value={newNote.name}
                                onChange={(e) => setNewNote({ ...newNote, name: e.target.value })}
                                bg="white"
                                borderColor="teal.300"
                            />
                            <Textarea
                                size="sm"
                                placeholder="Progress description..."
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                rows={3}
                                bg="white"
                                borderColor="teal.300"
                            />
                            <HStack justify="flex-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewNote({ name: '', content: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    colorScheme="teal"
                                    onClick={handleAddNote}
                                    isLoading={isSubmitting}
                                    loadingText="Adding..."
                                >
                                    Add Note
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                )}

                <Divider />

                <Box maxHeight="300px" overflowY="auto">
                    {progressNotes.length === 0 ? (
                        <Box py={4} textAlign="center">
                            <Text fontSize="sm" color="gray.500">
                                No progress notes yet. Add your first update!
                            </Text>
                        </Box>
                    ) : (
                        <VStack spacing={2} align="stretch" pr={1}>
                            {progressNotes.map((note, index) => (
                            <Box
                                key={note.unique_id || index}
                                p={2}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor="gray.200"
                                bg="gray.50"
                                transition="all 0.2s"
                                _hover={{
                                    boxShadow: "sm",
                                    borderColor: "teal.300"
                                }}
                            >
                                <VStack align="stretch" spacing={1}>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" color="gray.800" fontSize="sm">
                                            {note.name}
                                        </Text>
                                        <Badge colorScheme="gray" fontSize="xs">
                                            {formatDate(note.date_created)}
                                        </Badge>
                                    </HStack>
                                    <Text color="gray.700" fontSize="sm" whiteSpace="pre-wrap">
                                        {note.content}
                                    </Text>
                                    {note.created_by && (
                                        <Text color="gray.500" fontSize="xs" fontStyle="italic">
                                            by {note.created_by.name}
                                        </Text>
                                    )}
                                </VStack>
                            </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </VStack>
        </Box>
    );
}

export default PlanProgressNotes;
