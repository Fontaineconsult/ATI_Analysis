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
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext'; // Import the UserContext

function NoteViewer({ notes, onSubmit, yearSuccessEvidence, createdBy }) {

    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewNote, setIsAddingNewNote] = useState(false); // State for adding new note
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext); // Get the current user from UserContext

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated notes
    const handleFormSubmit = async (index, noteData, isNew) => {
        try {
            if (isNew) {
                await addNewNote(yearSuccessEvidence, noteData, createdBy);
            } else {
                await updateNote(yearSuccessEvidence, noteData, createdBy);
            }
            await loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewNote(false);
        } catch (error) {
            console.error('Error submitting note:', error);
        }
    };

    return (
        <Box>
            {/* Button to add a new note */}
            <Button
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewNote(true);
                    setExpandedIndex(null); // Collapse any other expanded notes
                }}
                mb={4}
            >
                Add New Note
            </Button>

            {/* Render the NoteForm for adding a new note if isAddingNewNote is true */}
            {isAddingNewNote ? (
                    <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                        <NoteForm
                            note={null} // Pass null for a new note
                            onSubmit={(noteData) => handleFormSubmit(null, noteData, true)} // Pass true to indicate new note
                            createdBy={user?.properties || user} // Pass user data or null
                        />
                    </Box>
                ) : // Render existing notes if not adding a new note
                notes && notes.length > 0 ? (
                    notes.map((noteWrapper, index) => {
                        const note = noteWrapper.note;
                        const createdByPerson = noteWrapper.created_by?.properties;

                        return (
                            <Box
                                key={index}
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
                                        {note.properties.name || 'Untitled Note'}
                                    </Text>
                                    <Button size="sm" colorScheme="teal">
                                        {expandedIndex === index ? 'Collapse' : 'Expand'}
                                    </Button>
                                </Flex>

                                <Text fontSize="sm" color="gray.600" mt={2}>
                                    Created by: {createdByPerson ? createdByPerson.name : 'Unknown Author'}
                                </Text>

                                <Collapse in={expandedIndex === index} animateOpacity>
                                    <Box mt={4}>
                                        <NoteForm
                                            note={note} // Pass the actual note object
                                            onSubmit={(noteData) => handleFormSubmit(index, noteData, false)} // Pass false to indicate update
                                            createdBy={createdByPerson}
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

function NoteForm({ note, onSubmit, createdBy }) {
    const [noteData, setNoteData] = useState({
        unique_id: note?.properties?.unique_id || '',
        name: note?.properties?.name || '',
        date_created: note?.properties?.date_created || '',
        content: note?.properties?.content || '',
        depreciated: note?.properties?.depreciated || false,
        depreciated_date: note?.properties?.depreciated_date || '',
        include_in_report: note?.properties?.include_in_report ?? true,
        created_by: createdBy || {}, // Use the passed createdBy data or fallback to an empty object
    });

    // New state to track submission status
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setNoteData({
            unique_id: note?.properties?.unique_id || '',
            name: note?.properties?.name || '',
            date_created: note?.properties?.date_created || '',
            content: note?.properties?.content || '',
            depreciated: note?.properties?.depreciated || false,
            depreciated_date: note?.properties?.depreciated_date || '',
            include_in_report: note?.properties?.include_in_report ?? true,
            created_by: createdBy || {},
        });
    }, [note, createdBy]); // Add `note` and `createdBy` to dependency array

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNoteData({
            ...noteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start the spinner
        try {
            await onSubmit(noteData);
        } catch (error) {
            console.error('Error submitting note:', error);
        } finally {
            setIsSubmitting(false); // Stop the spinner
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
                <Textarea name="content" value={noteData.content} onChange={handleChange} />
            </FormControl>

            {/* Display created_by person details */}
            {createdBy?.name ? (
                <Box mb={4}>
                    <Text fontSize="sm" color="gray.600">
                        Created by: {createdBy.name} ({createdBy.title || 'Unknown Title'})
                    </Text>
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.600">Created by: Unknown</Text>
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
                isLoading={isSubmitting} // Chakra UI prop to show spinner
                loadingText={note?.properties?.name ? 'Updating...' : 'Submitting...'}
            >
                {note?.properties?.name ? 'Update Note' : 'Submit Note'}
            </Button>
        </Box>
    );
}

export default NoteViewer;
