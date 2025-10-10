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
    Collapse,
    VStack,
    HStack,
    Badge,
    IconButton,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
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

    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = async (index, noteData, isNew) => {
        try {
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
                    size="xs"
                    colorScheme="teal"
                    onClick={() => {
                        setIsAddingNewNote(true);
                        setExpandedIndex(null);
                    }}
                    mb={3}
                >
                    Add New Note
                </Button>
            )}

            {isAddingNewNote && (
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <NoteForm
                        note={null}
                        onSubmit={(noteData) => handleFormSubmit(null, noteData, true)}
                        createdBy={user}
                        isNewNote={true}
                        onCancel={() => setIsAddingNewNote(false)}
                    />
                </Box>
            )}

            {notes && notes.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {notes.map((noteWrapper, index) => {
                        const note = noteWrapper.note || noteWrapper;
                        const createdBy = noteWrapper.created_by || note.created_by || null;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={note.properties?.unique_id || index}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                bg="white"
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                                transition="all 0.2s"
                            >
                                {/* Compact view */}
                                <HStack justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex="1">
                                        <HStack spacing={2}>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {note.properties?.name || 'Untitled Note'}
                                            </Text>
                                            {note.properties?.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {note.properties?.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                        </HStack>

                                        {note.properties?.content && (
                                            <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                                {note.properties.content}
                                            </Text>
                                        )}

                                        <HStack spacing={3} fontSize="xs" color="gray.500">
                                            <Text>Created: {note.properties?.date_created || 'N/A'}</Text>
                                            {createdBy && (
                                                <Text>By: {createdBy?.properties?.name || 'Unknown'}</Text>
                                            )}
                                        </HStack>
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit note"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleCollapse(index)}
                                    />
                                </HStack>

                                {/* Collapsible edit form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <NoteForm
                                            note={note}
                                            onSubmit={(noteData) => handleFormSubmit(index, noteData, false)}
                                            createdBy={createdBy}
                                            isNewNote={false}
                                            onCancel={() => toggleCollapse(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.500" fontSize="sm">No notes available.</Text>
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
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Note Name</FormLabel>
                        <Input size="sm" name="name" value={noteData.name} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Date Created</FormLabel>
                        <Input size="sm" name="date_created" type="date" value={noteData.date_created} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                        <Input size="sm" type="date" name="depreciated_date" value={noteData.depreciated_date} onChange={handleChange} />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Note Content</FormLabel>
                        <Textarea size="sm" name="content" value={noteData.content} onChange={handleChange} rows={3} />
                    </FormControl>
                </GridItem>
            </Grid>

            {/* Toggle switches */}
            <Grid templateColumns="repeat(2, 1fr)" gap={3} mt={3}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Include in Report</FormLabel>
                    <Switch size="sm" name="include_in_report" isChecked={noteData.include_in_report} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                    <Switch size="sm" name="depreciated" isChecked={noteData.depreciated} onChange={handleChange} />
                </FormControl>
            </Grid>

            {/* Action buttons */}
            <HStack mt={3} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={isNewNote ? 'Submitting...' : 'Updating...'}
                >
                    {isNewNote ? 'Submit' : 'Update'}
                </Button>
                {onCancel && (
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={onCancel}
                        isDisabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </HStack>
        </Box>
    );
}

export default NoteViewer;