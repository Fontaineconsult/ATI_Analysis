import React, { useState, useContext } from 'react';
import { Box, Collapse, Flex, Text, VStack, useToast } from '@chakra-ui/react';
import { addImplementationNote } from '../../../services/api/post';
import { updateNoteForImplementation } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import {
    AddRow, EmptyText, Field, FieldLabel, FormActions, FormShell,
    ItemShell, MetaLine, PathLinks, ReportBadges, SwitchRow,
} from './docPrimitives';

function NoteForm({ note, onSubmit, onCancel, isNewNote }) {
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();

    const isIncludedInCurrentYear = () => {
        if (!note?.relationship) return true;
        const { included_in_years = [], excluded_from_years = [] } = note.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return true;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    const [noteData, setNoteData] = useState({
        unique_id: note?.unique_id || '',
        name: note?.name || '',
        date_created: note?.date_created || new Date().toISOString().split('T')[0],
        content: note?.content || '',
        file_path: note?.file_path || '',
        uri_path: note?.uri_path || '',
        depreciated: note?.depreciated || false,
        depreciated_date: note?.depreciated_date || '',
        include_in_report: note?.include_in_report ?? false,
        include_in_current_year: isIncludedInCurrentYear(),
        created_by: user || {},
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNoteData({ ...noteData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...noteData, academic_year: currentAcademicYear, include_in_year: noteData.include_in_current_year });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormShell onSubmit={handleSubmit}>
            <Field label="Note Name" name="name" value={noteData.name} onChange={handleChange} isRequired />
            <Field as="textarea" label="Content" name="content" value={noteData.content} onChange={handleChange} rows={4} />
            <Flex gap={3}>
                <Field label="Date Created" name="date_created" type="date" value={noteData.date_created} onChange={handleChange} />
                <Field label="File Path" name="file_path" value={noteData.file_path} onChange={handleChange} />
            </Flex>
            <Field label="URI Path" name="uri_path" value={noteData.uri_path} onChange={handleChange} />
            <Box>
                <FieldLabel mb={2}>Flags</FieldLabel>
                <VStack align="stretch" spacing={1.5}>
                    <SwitchRow name="include_in_current_year" label={`Include in ${currentAcademicYear} report`} isChecked={noteData.include_in_current_year} onChange={handleChange} emphasize />
                    <SwitchRow name="include_in_report" label="Include in all reports (global)" isChecked={noteData.include_in_report} onChange={handleChange} colorScheme="gray" />
                    <SwitchRow name="depreciated" label="Depreciated" isChecked={noteData.depreciated} onChange={handleChange} colorScheme="orange" />
                </VStack>
                {noteData.depreciated && (
                    <Box mt={2}>
                        <Field label="Depreciation Date" name="depreciated_date" type="date" value={noteData.depreciated_date} onChange={handleChange} />
                    </Box>
                )}
            </Box>
            <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel={isNewNote ? 'Add Note' : 'Update Note'} loadingText={isNewNote ? 'Adding…' : 'Updating…'} />
        </FormShell>
    );
}

export default function NotesViewer({ notes = [], implementation_id, implementation_type, formatDate }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { currentAcademicYear } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();
    const canManage = Boolean(implementation_id && implementation_type);

    const handleAddNote = async (noteData) => {
        try {
            const { academic_year, include_in_year, created_by, ...noteDataForAPI } = noteData;
            await addImplementationNote(implementation_id, implementation_type, noteDataForAPI, user?.employee_id || '', academic_year, include_in_year);
            toast({ title: 'Note added', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setIsAddingNew(false);
        } catch (error) {
            toast({ title: 'Error adding note', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUpdateNote = async (noteData, index) => {
        try {
            const { academic_year, include_in_year, created_by, ...noteDataForAPI } = noteData;
            await updateNoteForImplementation(implementation_id, implementation_type, noteDataForAPI, user?.employee_id || '', academic_year, include_in_year);
            toast({ title: 'Note updated', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setEditingIndex(null);
        } catch (error) {
            toast({ title: 'Error updating note', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const isIncludedInCurrentYear = (note) => {
        if (!note.relationship) return note.include_in_report !== false;
        const { included_in_years = [], excluded_from_years = [] } = note.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return note.include_in_report !== false;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    return (
        <Box>
            <AddRow onAdd={() => { setIsAddingNew(true); setEditingIndex(null); }} label="Add Note" canAdd={canManage} isAdding={isAddingNew} />

            {isAddingNew && (
                <Box mb={3}>
                    <NoteForm note={null} onSubmit={handleAddNote} onCancel={() => setIsAddingNew(false)} isNewNote />
                </Box>
            )}

            {notes.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {notes.map((note, index) => (
                        <Box key={note.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={2}>
                                    <NoteForm note={note} onSubmit={(data) => handleUpdateNote(data, index)} onCancel={() => setEditingIndex(null)} isNewNote={false} />
                                </Box>
                            </Collapse>
                            <Collapse in={editingIndex !== index} animateOpacity>
                                <ItemShell
                                    titleNode={<Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>{note.name || 'Untitled Note'}</Text>}
                                    onEdit={() => { setEditingIndex(index); setIsAddingNew(false); }}
                                    canEdit={canManage}
                                >
                                    {note.content && (
                                        <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap" noOfLines={6}>
                                            {note.content}
                                        </Text>
                                    )}
                                    <PathLinks filePath={note.file_path} uriPath={note.uri_path} />
                                    {note.date_created && (
                                        <MetaLine>Created {formatDate ? formatDate(note.date_created) : note.date_created}</MetaLine>
                                    )}
                                    <ReportBadges
                                        inYear={isIncludedInCurrentYear(note)}
                                        year={currentAcademicYear}
                                        global={note.include_in_report !== false}
                                        depreciated={note.depreciated === true}
                                    />
                                </ItemShell>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <EmptyText>No notes attached.</EmptyText>
            )}
        </Box>
    );
}
