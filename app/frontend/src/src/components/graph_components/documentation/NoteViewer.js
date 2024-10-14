import React, { useState } from 'react';
import { Box, Button, Input, Textarea, Switch, FormControl, FormLabel, Text, Flex, Collapse } from '@chakra-ui/react';

function NoteViewer({ notes, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Toggle expanded/collapsed state, allowing only one to be expanded at a time
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index); // Toggle the selected note
    };

    const handleFormSubmit = (index, updatedNote) => {
        onSubmit(index, updatedNote);  // Pass the updated note data and index to the parent
        setExpandedIndex(null);  // Collapse the form after submitting
    };

    return (
        <Box>
            {notes.map((note, index) => (
                <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                        <Text fontWeight="bold" fontSize="lg">
                            {note.properties.name || 'Untitled Note'}
                        </Text>
                        <Button size="sm" colorScheme="teal">
                            {expandedIndex === index ? 'Collapse' : 'Expand'}
                        </Button>
                    </Flex>

                    {/* Collapsible form content */}
                    <Collapse in={expandedIndex === index} animateOpacity>
                        <Box mt={4}>
                            <NoteForm
                                note={note}  // Pass the current note to the form
                                onSubmit={(updatedNote) => handleFormSubmit(index, updatedNote)}  // Handle form submit
                            />
                        </Box>
                    </Collapse>
                </Box>
            ))}
        </Box>
    );
}

function NoteForm({ note, onSubmit }) {
    const [noteData, setNoteData] = useState({
        name: note.properties.name || '',
        date_created: note.properties.date_created || '',
        content: note.properties.content || '',
        depreciated: note.properties.depreciated || false,
        depreciated_date: note.properties.depreciated_date || '',
        include_in_report: note.properties.include_in_report || true,
        created_by: note.created_by || {},
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNoteData({
            ...noteData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(noteData);  // Pass the updated note data to the parent
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Note Name</FormLabel>
                <Input name="name" value={noteData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input name="date_created" type="date" value={noteData.date_created} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Note Content</FormLabel>
                <Textarea name="content" value={noteData.content} onChange={handleChange} />
            </FormControl>

            {/* Created By (Person details) */}
            {noteData.created_by?.properties && (
                <Box mb={4}>
                    <Text><strong>Created By:</strong></Text>
                    <Text>Name: {noteData.created_by.properties.name}</Text>
                    <Text>Title: {noteData.created_by.properties.title}</Text>
                    <Text>Email: {noteData.created_by.properties.email}</Text>
                </Box>
            )}

            {/* Flex box to split the toggles and date fields into two columns */}
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

            <Button type="submit" colorScheme="teal" mt={4}>Submit Changes</Button>
        </Box>
    );
}

export default NoteViewer;
