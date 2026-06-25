import React, { useState, useContext } from 'react';
import { Badge, Box, Collapse, Flex, Text, VStack, useToast } from '@chakra-ui/react';
import { addMessageToImplementation, unlinkDocumentationFromImplementation } from '../../../services/api/post';
import { updateMessageForImplementation } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import {
    AddRow, EmptyText, Field, FieldLabel, FormActions, FormShell,
    ItemShell, MetaLine, PathLinks, ReportBadges, SwitchRow,
} from './docPrimitives';

const messageTypes = [
    'e-mail', 'voice mail', 'text message', 'letter',
    'memo', 'report', 'meeting minutes', 'presentation',
];

function MessageForm({ message, onSubmit, onCancel, isNewMessage }) {
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();

    const isIncludedInCurrentYear = () => {
        if (!message?.relationship) return true;
        const { included_in_years = [], excluded_from_years = [] } = message.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return true;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    const [messageData, setMessageData] = useState({
        unique_id: message?.unique_id || '',
        name: message?.name || '',
        date_created: message?.date_created || new Date().toISOString().split('T')[0],
        content: message?.content || '',
        file_path: message?.file_path || '',
        uri_path: message?.uri_path || '',
        type: message?.type || messageTypes[0],
        depreciated: message?.depreciated || false,
        depreciated_date: message?.depreciated_date || '',
        include_in_report: message?.include_in_report ?? false,
        include_in_current_year: isIncludedInCurrentYear(),
        created_by: user || {},
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMessageData({ ...messageData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...messageData, academic_year: currentAcademicYear, include_in_year: messageData.include_in_current_year });
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeOptions = messageTypes.map((t) => <option key={t} value={t}>{t}</option>);

    return (
        <FormShell onSubmit={handleSubmit}>
            <Field label="Message Name" name="name" value={messageData.name} onChange={handleChange} isRequired />
            <Field as="textarea" label="Content" name="content" value={messageData.content} onChange={handleChange} rows={3} />
            <Flex gap={3}>
                <Field as="select" label="Message Type" name="type" value={messageData.type} onChange={handleChange} options={typeOptions} />
                <Field label="Date Created" name="date_created" type="date" value={messageData.date_created} onChange={handleChange} />
            </Flex>
            <Flex gap={3}>
                <Field label="File Path" name="file_path" value={messageData.file_path} onChange={handleChange} />
                <Field label="URI Path" name="uri_path" value={messageData.uri_path} onChange={handleChange} />
            </Flex>
            <Box>
                <FieldLabel mb={2}>Flags</FieldLabel>
                <VStack align="stretch" spacing={1.5}>
                    <SwitchRow name="include_in_current_year" label={`Include in ${currentAcademicYear} report`} isChecked={messageData.include_in_current_year} onChange={handleChange} emphasize />
                    <SwitchRow name="include_in_report" label="Include in all reports (global)" isChecked={messageData.include_in_report} onChange={handleChange} colorScheme="gray" />
                    <SwitchRow name="depreciated" label="Depreciated" isChecked={messageData.depreciated} onChange={handleChange} colorScheme="orange" />
                </VStack>
                {messageData.depreciated && (
                    <Box mt={2}>
                        <Field label="Depreciation Date" name="depreciated_date" type="date" value={messageData.depreciated_date} onChange={handleChange} />
                    </Box>
                )}
            </Box>
            <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel={isNewMessage ? 'Add Message' : 'Update Message'} loadingText={isNewMessage ? 'Adding…' : 'Updating…'} />
        </FormShell>
    );
}

export default function MessagesViewer({ messages = [], implementation_id, implementation_type, formatDate }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { currentAcademicYear } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();
    const canManage = Boolean(implementation_id && implementation_type);

    const handleAddMessage = async (messageData) => {
        try {
            const { academic_year, include_in_year, created_by, ...messageDataForAPI } = messageData;
            await addMessageToImplementation(implementation_id, implementation_type, messageDataForAPI, user?.employee_id || '', academic_year, include_in_year);
            toast({ title: 'Message added', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setIsAddingNew(false);
        } catch (error) {
            toast({ title: 'Error adding message', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUpdateMessage = async (messageData, index) => {
        try {
            const { academic_year, include_in_year, created_by, ...messageDataForAPI } = messageData;
            await updateMessageForImplementation(implementation_id, implementation_type, messageDataForAPI, user?.employee_id || '', academic_year, include_in_year);
            toast({ title: 'Message updated', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setEditingIndex(null);
        } catch (error) {
            toast({ title: 'Error updating message', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUnlink = async (msg) => {
        if (!window.confirm(`Unlink "${msg.name || 'this message'}" from this implementation? It won't be deleted.`)) return;
        try {
            await unlinkDocumentationFromImplementation(implementation_id, implementation_type, 'message', msg.unique_id);
            toast({ title: 'Message unlinked', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
        } catch (error) {
            toast({ title: 'Error unlinking message', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const isIncludedInCurrentYear = (msg) => {
        if (!msg.relationship) return msg.include_in_report !== false;
        const { included_in_years = [], excluded_from_years = [] } = msg.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return msg.include_in_report !== false;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    return (
        <Box>
            <AddRow onAdd={() => { setIsAddingNew(true); setEditingIndex(null); }} label="Add Message" canAdd={canManage} isAdding={isAddingNew} />

            {isAddingNew && (
                <Box mb={3}>
                    <MessageForm message={null} onSubmit={handleAddMessage} onCancel={() => setIsAddingNew(false)} isNewMessage />
                </Box>
            )}

            {messages.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {messages.map((msg, index) => (
                        <Box key={msg.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={2}>
                                    <MessageForm message={msg} onSubmit={(data) => handleUpdateMessage(data, index)} onCancel={() => setEditingIndex(null)} isNewMessage={false} />
                                </Box>
                            </Collapse>
                            <Collapse in={editingIndex !== index} animateOpacity>
                                <ItemShell
                                    titleNode={<Text fontSize="sm" fontWeight="semibold" color="gray.800" noOfLines={1}>{msg.name}</Text>}
                                    badge={msg.type && <Badge colorScheme="purple" fontSize="2xs">{msg.type}</Badge>}
                                    onEdit={() => { setEditingIndex(index); setIsAddingNew(false); }}
                                    canEdit={canManage}
                                    onUnlink={() => handleUnlink(msg)}
                                    canUnlink={canManage}
                                >
                                    {msg.content && <Text fontSize="xs" color="gray.700" noOfLines={3}>{msg.content}</Text>}
                                    <PathLinks filePath={msg.file_path} uriPath={msg.uri_path} />
                                    {msg.date_created && (
                                        <MetaLine>Created {formatDate ? formatDate(msg.date_created) : msg.date_created}</MetaLine>
                                    )}
                                    <ReportBadges
                                        inYear={isIncludedInCurrentYear(msg)}
                                        year={currentAcademicYear}
                                        global={msg.include_in_report !== false}
                                        depreciated={msg.depreciated === true}
                                    />
                                </ItemShell>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <EmptyText>No messages attached.</EmptyText>
            )}
        </Box>
    );
}
