import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Input,
    Textarea,
    Switch,
    FormControl,
    FormLabel,
    Text,
    Flex,
    Collapse,
} from '@chakra-ui/react';
import { updateNote } from '../../../services/api/put';
import { addNewNote } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function NoteViewer({ notes, onSubmit, yearSuccessEvidence, implementation_id, implementation_type }) {
    const [isImplementation, setIsImplementation] = useState(false);
    const [isYearSuccessEvidence, setIsYearSuccessEvidence] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewNote, setIsAddingNewNote] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    useEffect(() => {
        setIsYearSuccessEvidence(!!yearSuccessEvidence);
        setIsImplementation(!!implementation_id && !!implementation_type);
    }, [yearSuccessEvidence, implementation_id, implementation_type]);

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated notes
    const handleFormSubmit = async (index, noteData, isNew) => {
        try {
            // Set date_created if new
            if (isNew) {
                noteData.date_created = new Date().toISOString().split('T')[0];
            }

            if (isNew) {
                if (isYearSuccessEvidence) {
                    await addNewNote(yearSuccessEvidence, noteData, user?.employee_id || '');
                } else if (isImplementation) {
                    await addNewNote(null, noteData, user?.employee_id || '', implementation_id, implementation_type);
                } else {
                    console.error('No valid context to add a new note.');
                    return;
                }
            } else {
                if (isYearSuccessEvidence) {
                    await updateNote(yearSuccessEvidence, noteData, user?.employee_id || '');
                } else if (isImplementation) {
                    await updateNote(null, noteData, user?.employee_id || '', implementation_id, implementation_type);
                } else {
                    console.error('No valid context to update the note.');
                    return;
                }
            }

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setExpandedIndex(null);
            setIsAddingNewNote(false);

            toast({
                title: "Success",
                description: isNew ? "Note created successfully" : "Note updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error submitting note:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to save note",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            {(isYearSuccessEvidence || isImplementation) && (
                <Button
                    colorScheme="teal"
                    onClick={() => {
                        setIsAddingNewNote(true);
                        setExpandedIndex(null);
                    }}
                    mb={4}
                >
                    Add New Note
                </Button>
            )}

            {isAddingNewNote ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <NoteForm
                        note={null}
                        onSubmit={(noteData) => handleFormSubmit(null, noteData, true)}
                        createdBy={user}
                        isNewNote={true}
                    />
                </Box>
            ) : notes && notes.length > 0 ? (
                notes.map((noteWrapper, index) => {
                    // Extract note and created_by from wrapper
                    const note = noteWrapper.note || noteWrapper;
                    const createdBy = noteWrapper.created_by || note.created_by || null;

                    return (
                        <Box
                            key={note.properties?.unique_id || index}
                            mb={4}
                            border="1px solid teal"
                            borderRadius="md"
                            p={4}
                            boxShadow="sm"
                        >
                            <Flex
                                justify="space-between"
                                alignItems="center"
                                cursor="pointer"
                                onClick={() => toggleCollapse(index)}
                            >
                                <Text fontWeight="bold" fontSize="sm">
                                    {note.properties?.name || 'Untitled Note'}
                                </Text>
                                <Button size="sm" colorScheme="teal">
                                    {expandedIndex === index ? 'Collapse' : 'Expand'}
                                </Button>
                            </Flex>

                            <Text fontSize="sm" color="gray.600" mt={2}>
                                Created by: {createdBy?.properties?.name || 'Unknown Author'}
                            </Text>

                            <Collapse in={expandedIndex === index} animateOpacity>
                                <Box mt={4}>
                                    <NoteForm
                                        note={note}
                                        onSubmit={(noteData) => handleFormSubmit(index, noteData, false)}
                                        createdBy={createdBy}
                                        isNewNote={false}
                                    />
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })
            ) : (
                <Text>No notes available.</Text>
            )}
        </Box>
    );
}

function NoteForm({ note, onSubmit, createdBy, isNewNote }) {
    const [noteData, setNoteData] = useState({
        unique_id: note?.properties?.unique_id || '',
        name: note?.properties?.name || '',
        date_created: note?.properties?.date_created || new Date().toISOString().split('T')[0],
        content: note?.properties?.content || '',
        depreciated: note?.properties?.depreciated || false,
        depreciated_date: note?.properties?.depreciated_date || '',
        include_in_report: note?.properties?.include_in_report ?? true,
        created_by: createdBy || {},
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setNoteData({
            unique_id: note?.properties?.unique_id || '',
            name: note?.properties?.name || '',
            date_created: note?.properties?.date_created || new Date().toISOString().split('T')[0],
            content: note?.properties?.content || '',
            depreciated: note?.properties?.depreciated || false,
            depreciated_date: note?.properties?.depreciated_date || '',
            include_in_report: note?.properties?.include_in_report ?? true,
            created_by: createdBy || {},
        });
    }, [note, createdBy]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNoteData({
            ...noteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(noteData);
        } catch (error) {
            console.error('Error submitting note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Note Name</FormLabel>
                <Input name="name" value={noteData.name} onChange={handleChange} />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input
                    name="date_created"
                    type="date"
                    value={noteData.date_created}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Note Content</FormLabel>
                <Textarea
                    name="content"
                    value={noteData.content}
                    onChange={handleChange}
                    rows={6}
                />
            </FormControl>

            {createdBy ? (
                <Box mb={4}>
                    <Text fontSize="sm" color="gray.600">
                        Created by: {createdBy?.properties?.name || createdBy?.name || 'Unknown'} ({createdBy?.properties?.title || createdBy?.title || 'Unknown Title'})
                    </Text>
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.600" mb={4}>Created by: Unknown</Text>
            )}

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciated</FormLabel>
                        <Switch
                            name="depreciated"
                            isChecked={noteData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Include in Report</FormLabel>
                        <Switch
                            name="include_in_report"
                            isChecked={noteData.include_in_report}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Depreciation Date</FormLabel>
                        <Input
                            type="date"
                            name="depreciated_date"
                            value={noteData.depreciated_date}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>
            </Flex>

            <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting}
                loadingText={isNewNote ? 'Submitting...' : 'Updating...'}
            >
                {isNewNote ? 'Submit Note' : 'Update Note'}
            </Button>
        </Box>
    );
}

export default NoteViewer;