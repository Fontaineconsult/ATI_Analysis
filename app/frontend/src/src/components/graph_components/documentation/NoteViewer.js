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

function NoteViewer({ notes, onSubmit, yearSuccessEvidence, createdBy }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewNote, setIsAddingNewNote] = useState(false);
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    // Toggle expanded/collapsed state
    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated notes
    const handleFormSubmit = async (index, noteData, isNew) => {
        try {
            let response;

            if (isNew) {
                response = await addNewNote(yearSuccessEvidence, noteData, createdBy);
            } else {
                response = await updateNote(yearSuccessEvidence, noteData, createdBy);
            }

            toast({
                title: "Success",
                description: response?.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setExpandedIndex(null);
            setIsAddingNewNote(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "An unexpected error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
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

            {isAddingNewNote ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <NoteForm
                        note={null}
                        onSubmit={(noteData) => handleFormSubmit(null, noteData, true)}
                        createdBy={user?.properties || user}
                        isNewNote={true}
                        onCancel={() => setIsAddingNewNote(false)}
                    />
                </Box>
            ) : notes && notes.length > 0 ? (
                notes.map((noteWrapper, index) => {
                    const note = noteWrapper.note;
                    const createdByPerson = noteWrapper.created_by?.properties;
                    const isExpanded = expandedIndex === index;

                    return (
                        <Box
                            key={note.properties.unique_id || index}
                            mb={4}
                            border="1px solid teal"
                            borderRadius="md"
                            p={4}
                            boxShadow="sm"
                        >
                            {/* Always visible compact view with Edit button */}
                            <Flex justify="space-between" alignItems="flex-start" mb={2}>
                                <Flex flex="1" gap={4}>
                                    {/* Left side - Basic Info (2/3 width) */}
                                    <Box flex="2" fontSize="sm">
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="70px">
                                                Name:
                                            </Text>
                                            <Text>{note.properties.name || 'Untitled Note'}</Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="70px">
                                                Created:
                                            </Text>
                                            <Text>{note.properties.date_created || 'N/A'}</Text>
                                        </Flex>
                                        <Box>
                                            <Text fontWeight="bold" color="gray.600" mb={1}>
                                                Content:
                                            </Text>
                                            <Text
                                                ml={2}
                                                noOfLines={3}
                                                color="gray.700"
                                                whiteSpace="pre-wrap"
                                            >
                                                {note.properties.content || 'No content provided'}
                                            </Text>
                                        </Box>
                                    </Box>

                                    {/* Right side - Status Info (1/3 width) */}
                                    <Box flex="1" fontSize="sm" borderLeft="1px solid" borderColor="gray.200" pl={4}>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                In Report:
                                            </Text>
                                            <Text color={note.properties.include_in_report ? "green.500" : "red.500"}>
                                                {note.properties.include_in_report ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        <Flex mb={1} align="baseline">
                                            <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                Depreciated:
                                            </Text>
                                            <Text color={note.properties.depreciated ? "orange.500" : "green.500"}>
                                                {note.properties.depreciated ? 'Yes' : 'No'}
                                            </Text>
                                        </Flex>
                                        {note.properties.depreciated && (
                                            <Flex align="baseline">
                                                <Text fontWeight="bold" color="gray.600" minWidth="100px">
                                                    Dep. Date:
                                                </Text>
                                                <Text>{note.properties.depreciated_date || 'N/A'}</Text>
                                            </Flex>
                                        )}
                                    </Box>
                                </Flex>
                                <Button
                                    size="sm"
                                    colorScheme={isExpanded ? "gray" : "blue"}
                                    onClick={() => toggleEdit(index)}
                                    ml={4}
                                >
                                    {isExpanded ? 'Cancel' : 'Edit'}
                                </Button>
                            </Flex>

                            <Text fontSize="xs" color="gray.500">
                                Created by: {createdByPerson ? createdByPerson.name : 'Unknown'}
                            </Text>

                            {/* Collapsible edit form */}
                            <Collapse in={isExpanded} animateOpacity>
                                <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                                    <NoteForm
                                        note={note}
                                        onSubmit={(noteData) => handleFormSubmit(index, noteData, false)}
                                        createdBy={createdByPerson}
                                        isNewNote={false}
                                        onCancel={() => toggleEdit(index)}
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

function NoteForm({ note, onSubmit, createdBy, isNewNote, onCancel }) {
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
                <Input name="name" value={noteData.name} onChange={handleChange} required />
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

            <Flex gap={4} mb={4}>
                <Box flex="1">
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
                        <FormLabel>Depreciated</FormLabel>
                        <Switch
                            name="depreciated"
                            isChecked={noteData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
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

            {/* Action buttons */}
            <Flex gap={2}>
                <Button
                    type="submit"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewNote ? 'Submitting...' : 'Updating...'}
                >
                    {isNewNote ? 'Submit Note' : 'Update Note'}
                </Button>
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        isDisabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </Flex>
        </Box>
    );
}

export default NoteViewer;