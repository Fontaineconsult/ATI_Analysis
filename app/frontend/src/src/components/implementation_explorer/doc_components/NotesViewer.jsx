import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast, Textarea
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import {addImplementationNote, addNewNote} from '../../../services/api/post';
import { updateNote } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function NoteForm({ note, onSubmit, onCancel, isNewNote }) {
    const { user } = useContext(UserContext);
    const [noteData, setNoteData] = useState({
        unique_id: note?.unique_id || '',
        name: note?.name || '',
        date_created: note?.date_created || new Date().toISOString().split('T')[0],
        content: note?.content || '',
        file_path: note?.file_path || '',
        uri_path: note?.uri_path || '',
        depreciated: note?.depreciated || false,
        depreciated_date: note?.depreciated_date || '',
        include_in_report: note?.include_in_report ?? true,
        created_by: user || {}
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="teal.300">
            <FormControl mb={3}>
                <FormLabel fontSize="sm">Note Name</FormLabel>
                <Input size="sm" name="name" value={noteData.name} onChange={handleChange} required />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Content</FormLabel>
                <Textarea size="sm" name="content" value={noteData.content} onChange={handleChange} rows={4} />
            </FormControl>

            <Flex gap={4} mb={3}>
                <FormControl flex="1">
                    <FormLabel fontSize="sm">Date Created</FormLabel>
                    <Input size="sm" name="date_created" type="date" value={noteData.date_created} onChange={handleChange} />
                </FormControl>
            </Flex>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">File Path</FormLabel>
                <Input size="sm" name="file_path" value={noteData.file_path} onChange={handleChange} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">URI Path</FormLabel>
                <Input size="sm" name="uri_path" value={noteData.uri_path} onChange={handleChange} />
            </FormControl>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={noteData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Include in Report</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={noteData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    {noteData.depreciated && (
                        <FormControl>
                            <FormLabel fontSize="sm">Depreciation Date</FormLabel>
                            <Input size="sm" type="date" name="depreciated_date"
                                   value={noteData.depreciated_date} onChange={handleChange} />
                        </FormControl>
                    )}
                </Box>
            </Flex>

            <HStack spacing={2}>
                <Button size="sm" type="submit" colorScheme="teal"
                        isLoading={isSubmitting} loadingText={isNewNote ? 'Adding...' : 'Updating...'}>
                    {isNewNote ? 'Add Note' : 'Update Note'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                    Cancel
                </Button>
            </HStack>
        </Box>
    );
}

const NotesViewer = ({ notes = [], implementation_id, implementation_type, formatDate }) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddNote = async (noteData) => {
        try {
            await addImplementationNote(implementation_id, implementation_type, noteData, user?.employee_id || '', implementation_id, implementation_type);

            toast({
                title: "Note added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setIsAddingNew(false);
        } catch (error) {
            toast({
                title: "Error adding note",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateNote = async (noteData, index) => {
        try {
            await updateNote(null, noteData, user?.employee_id || '', implementation_id, implementation_type);

            toast({
                title: "Note updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setEditingIndex(null);
        } catch (error) {
            toast({
                title: "Error updating note",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <HStack justify="space-between" mb={3}>
                <Heading size="sm" color="gray.700" fontWeight="bold">
                    Notes ({notes.length})
                </Heading>
                {implementation_id && implementation_type && (
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => {setIsAddingNew(true); setEditingIndex(null);}}
                        isDisabled={isAddingNew}
                    >
                        Add Note
                    </Button>
                )}
            </HStack>

            {isAddingNew && (
                <Box mb={4}>
                    <NoteForm
                        note={null}
                        onSubmit={handleAddNote}
                        onCancel={() => setIsAddingNew(false)}
                        isNewNote={true}
                    />
                </Box>
            )}

            {notes.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {notes.map((note, index) => (
                        <Box key={note.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={3}>
                                    <NoteForm
                                        note={note}
                                        onSubmit={(data) => handleUpdateNote(data, index)}
                                        onCancel={() => setEditingIndex(null)}
                                        isNewNote={false}
                                    />
                                </Box>
                            </Collapse>

                            <Collapse in={editingIndex !== index} animateOpacity>
                                <Box
                                    p={4}
                                    bg="gray.50"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    boxShadow="sm"
                                    _hover={{ boxShadow: 'md' }}
                                    transition="box-shadow 0.2s"
                                >
                                    <HStack justify="space-between" align="start">
                                        <Box flex="1">
                                            <Heading as='h3' fontSize="sm" fontWeight="bold" color="gray.800" mb={2}>
                                                {note.name || 'Untitled Note'}
                                            </Heading>

                                            {note.content && (
                                                <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap">
                                                    {note.content}
                                                </Text>
                                            )}

                                            {note.file_path && (
                                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                                    File: {note.file_path}
                                                </Link>
                                            )}

                                            {note.uri_path && (
                                                <Link href={note.uri_path} isExternal fontSize="xs" color="teal.600" mt={2} display="block">
                                                    <HStack spacing={1}>
                                                        <Text>URI: {note.uri_path}</Text>
                                                        <ExternalLinkIcon />
                                                    </HStack>
                                                </Link>
                                            )}

                                            {note.date_created && (
                                                <Text fontSize="xs" color="gray.500" mt={2}>
                                                    Created: {formatDate ? formatDate(note.date_created) : note.date_created}
                                                </Text>
                                            )}

                                            <HStack mt={3} spacing={2}>
                                                {note.include_in_report !== false && (
                                                    <Badge colorScheme="green" fontSize="xs">In Report</Badge>
                                                )}
                                                {note.depreciated === true && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
                                                )}
                                            </HStack>
                                        </Box>

                                        {implementation_id && implementation_type && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorScheme="blue"
                                                onClick={() => {setEditingIndex(index); setIsAddingNew(false);}}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </HStack>
                                </Box>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No notes attached
                </Text>
            )}
        </Box>
    );
};

export default NotesViewer;