import React, { useState, useContext } from 'react';
import { Badge, Box, Collapse, Flex, Text, VStack, WrapItem, useToast } from '@chakra-ui/react';
import { addDocumentToImplementation, unlinkDocumentationFromImplementation } from '../../../services/api/post';
import { updateDocument } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import {
    AddRow, EmptyText, Field, FieldLabel, FormActions, FormShell,
    ItemShell, MetaLine, PathLinks, ReportBadges, SwitchRow,
} from './docPrimitives';

const truthy = (v) => v === true || v === 'True';

function DocumentForm({ document, onSubmit, onCancel, isNewDocument }) {
    const { individuals } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();

    const isIncludedInCurrentYear = () => {
        if (!document?.relationship) return true;
        const { included_in_years = [], excluded_from_years = [] } = document.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return true;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    const [documentData, setDocumentData] = useState({
        unique_id: document?.unique_id || '',
        name: document?.name || '',
        file_path: document?.file_path || '',
        uri_path: document?.uri_path || '',
        description: document?.description || '',
        is_administrative_review_documentation: document?.is_administrative_review_documentation || false,
        is_milestone_and_measures_documentation: document?.is_milestone_and_measures_documentation || false,
        include_in_report: document?.include_in_report ?? false,
        include_in_current_year: isIncludedInCurrentYear(),
        depreciated: document?.depreciated || false,
        depreciated_date: document?.depreciated_date || '',
        date_created: document?.date_created || new Date().toISOString().split('T')[0],
        maintainer_id: document?.maintained_by?.unique_id || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDocumentData({ ...documentData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...documentData, academic_year: currentAcademicYear, include_in_year: documentData.include_in_current_year });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedIndividuals = individuals ? [...individuals].sort((a, b) => a.name.localeCompare(b.name)) : [];
    const currentMaintainer = document?.maintained_by;
    const maintainerOptions = (
        <>
            {currentMaintainer && !sortedIndividuals.find((p) => p.unique_id === currentMaintainer.unique_id) && (
                <option value={currentMaintainer.unique_id}>
                    {currentMaintainer.name} {currentMaintainer.title ? `(${currentMaintainer.title})` : ''}
                </option>
            )}
            {sortedIndividuals.map((person) => (
                <option key={person.unique_id} value={person.unique_id}>
                    {person.name} {person.title ? `(${person.title})` : ''}
                </option>
            ))}
        </>
    );

    return (
        <FormShell onSubmit={handleSubmit}>
            <Field label="Document Name" name="name" value={documentData.name} onChange={handleChange} isRequired />
            <Field label="Description" name="description" value={documentData.description} onChange={handleChange} />
            <Field as="select" label="Maintained By" name="maintainer_id" value={documentData.maintainer_id} onChange={handleChange} placeholder="Select a maintainer" options={maintainerOptions} />
            <Flex gap={3}>
                <Field label="Date Created" name="date_created" type="date" value={documentData.date_created} onChange={handleChange} />
                <Field label="File Path" name="file_path" value={documentData.file_path} onChange={handleChange} />
            </Flex>
            <Field label="URI Path" name="uri_path" value={documentData.uri_path} onChange={handleChange} />
            <Box>
                <FieldLabel mb={2}>Flags</FieldLabel>
                <VStack align="stretch" spacing={1.5}>
                    <SwitchRow name="include_in_current_year" label={`Include in ${currentAcademicYear} report`} isChecked={documentData.include_in_current_year} onChange={handleChange} emphasize />
                    <SwitchRow name="include_in_report" label="Include in all reports (global)" isChecked={documentData.include_in_report} onChange={handleChange} colorScheme="gray" />
                    <SwitchRow name="is_administrative_review_documentation" label="Admin review doc" isChecked={truthy(documentData.is_administrative_review_documentation)} onChange={handleChange} colorScheme="purple" />
                    <SwitchRow name="is_milestone_and_measures_documentation" label="Milestones doc" isChecked={truthy(documentData.is_milestone_and_measures_documentation)} onChange={handleChange} colorScheme="blue" />
                    <SwitchRow name="depreciated" label="Depreciated" isChecked={documentData.depreciated} onChange={handleChange} colorScheme="orange" />
                </VStack>
                {documentData.depreciated && (
                    <Box mt={2}>
                        <Field label="Depreciation Date" name="depreciated_date" type="date" value={documentData.depreciated_date} onChange={handleChange} />
                    </Box>
                )}
            </Box>
            <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel={isNewDocument ? 'Add Document' : 'Update Document'} loadingText={isNewDocument ? 'Adding…' : 'Updating…'} />
        </FormShell>
    );
}

export default function DocumentsViewer({ documents = [], implementation_id, implementation_type }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { currentAcademicYear } = useSettings();
    const toast = useToast();
    const canManage = Boolean(implementation_id && implementation_type);

    const handleAddDocument = async (documentData) => {
        try {
            const { maintainer_id, academic_year, include_in_year, ...documentDataForAPI } = documentData;
            await addDocumentToImplementation(implementation_id, implementation_type, documentDataForAPI, maintainer_id, academic_year, include_in_year);
            toast({ title: 'Document added', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setIsAddingNew(false);
        } catch (error) {
            toast({ title: 'Error adding document', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUpdateDocument = async (documentData, index) => {
        try {
            const { maintainer_id, academic_year, include_in_year, ...documentDataForAPI } = documentData;
            await updateDocument(implementation_id, implementation_type, documentDataForAPI, maintainer_id, academic_year, include_in_year);
            toast({ title: 'Document updated', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setEditingIndex(null);
        } catch (error) {
            toast({ title: 'Error updating document', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUnlink = async (doc) => {
        if (!window.confirm(`Unlink "${doc.name || 'this document'}" from this implementation? It won't be deleted.`)) return;
        try {
            await unlinkDocumentationFromImplementation(implementation_id, implementation_type, 'document', doc.unique_id);
            toast({ title: 'Document unlinked', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
        } catch (error) {
            toast({ title: 'Error unlinking document', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const isIncludedInCurrentYear = (doc) => {
        if (!doc.relationship) return doc.include_in_report !== false;
        const { included_in_years = [], excluded_from_years = [] } = doc.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return doc.include_in_report !== false;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    return (
        <Box>
            <AddRow onAdd={() => { setIsAddingNew(true); setEditingIndex(null); }} label="Add Document" canAdd={canManage} isAdding={isAddingNew} />

            {isAddingNew && (
                <Box mb={3}>
                    <DocumentForm document={null} onSubmit={handleAddDocument} onCancel={() => setIsAddingNew(false)} isNewDocument />
                </Box>
            )}

            {documents.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {documents.map((doc, index) => (
                        <Box key={doc.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={2}>
                                    <DocumentForm document={doc} onSubmit={(data) => handleUpdateDocument(data, index)} onCancel={() => setEditingIndex(null)} isNewDocument={false} />
                                </Box>
                            </Collapse>
                            <Collapse in={editingIndex !== index} animateOpacity>
                                <ItemShell
                                    titleNode={<Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>{doc.name}</Text>}
                                    onEdit={() => { setEditingIndex(index); setIsAddingNew(false); }}
                                    canEdit={canManage}
                                    onUnlink={() => handleUnlink(doc)}
                                    canUnlink={canManage}
                                >
                                    {doc.description && <Text fontSize="xs" color="gray.600" noOfLines={2}>{doc.description}</Text>}
                                    {doc.maintained_by && <MetaLine>Maintained by {doc.maintained_by.name || 'Unknown'}</MetaLine>}
                                    <PathLinks filePath={doc.file_path} uriPath={doc.uri_path} />
                                    <ReportBadges
                                        inYear={isIncludedInCurrentYear(doc)}
                                        year={currentAcademicYear}
                                        global={doc.include_in_report !== false}
                                        depreciated={doc.depreciated === true}
                                        extra={<>
                                            {truthy(doc.is_administrative_review_documentation) && <WrapItem><Badge colorScheme="purple" fontSize="2xs">Admin Review</Badge></WrapItem>}
                                            {truthy(doc.is_milestone_and_measures_documentation) && <WrapItem><Badge colorScheme="blue" fontSize="2xs">Milestones</Badge></WrapItem>}
                                        </>}
                                    />
                                </ItemShell>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <EmptyText>No documents attached.</EmptyText>
            )}
        </Box>
    );
}
