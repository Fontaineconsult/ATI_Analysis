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
    Select,
} from '@chakra-ui/react';
import { updateMessage } from '../../../services/api/put';
import { addNewMessage } from '../../../services/api/post';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

const messageTypes = [
    'e-mail',
    'voice mail',
    'text message',
    'letter',
    'memo',
    'report',
    'meeting minutes',
    'presentation',
];

function MessageViewer({ messages, onSubmit, yearSuccessEvidence, createdBy, implementation_id, implementation_type }) {
    const [isImplementation, setIsImplementation] = useState(false);
    const [isYearSuccessEvidence, setIsYearSuccessEvidence] = useState(false);

    useEffect(() => {
        setIsYearSuccessEvidence(!!yearSuccessEvidence);
        setIsImplementation(!!implementation_id && !!implementation_type);
    }, [yearSuccessEvidence, implementation_id, implementation_type]);

    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewMessage, setIsAddingNewMessage] = useState(false);
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated messages
    const handleFormSubmit = async (index, messageData, isNew) => {
        try {
            // Set date_created if new
            if (isNew) {
                messageData.date_created = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }

            // Depending on which state is active, call add/update message differently
            if (isNew) {
                if (isYearSuccessEvidence) {
                    await addNewMessage(yearSuccessEvidence, messageData, user?.employee_id || '');
                } else if (isImplementation) {
                    // Call addNewMessage with implementation params
                    await addNewMessage(null, messageData, user?.employee_id || '', implementation_id, implementation_type);
                } else {
                    console.error('No valid context (YearSuccessEvidence or Implementation) to add a new message.');
                    return;
                }
            } else {
                if (isYearSuccessEvidence) {
                    await updateMessage(yearSuccessEvidence, messageData, user?.employee_id || '');
                } else if (isImplementation) {
                    // Call updateMessage with implementation params
                    await updateMessage(null, messageData, user?.employee_id || '', implementation_id, implementation_type);
                } else {
                    console.error('No valid context (YearSuccessEvidence or Implementation) to update the message.');
                    return;
                }
            }

            await loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewMessage(false);
        } catch (error) {
            console.error('Error submitting message:', error);
        }
    };

    return (
        <Box>
            {(isYearSuccessEvidence || isImplementation) && (
                <Button
                    colorScheme="teal"
                    onClick={() => {
                        setIsAddingNewMessage(true);
                        setExpandedIndex(null); // Collapse any other expanded messages
                    }}
                    mb={4}
                >
                    Add New Message
                </Button>
            )}

            {isAddingNewMessage ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <MessageForm
                        message={null}
                        onSubmit={(messageData) => handleFormSubmit(null, messageData, true)}
                        createdBy={user?.properties || user}
                    />
                </Box>
            ) : messages && messages.length > 0 ? (
                messages.map((message, index) => {
                    // Normalize message object
                    message = message.message ? message.message : message;

                    const createdByPerson = message.created_by?.properties || null;

                    return (
                        <Box
                            key={message.properties.unique_id || index}
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
                                    {message.properties.name || 'Untitled Message'}
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
                                    <MessageForm
                                        message={message}
                                        onSubmit={(messageData) => handleFormSubmit(index, messageData, false)}
                                        createdBy={createdByPerson}
                                    />
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })
            ) : (
                <Text>No messages available.</Text>
            )}
        </Box>
    );
}

function MessageForm({ message, onSubmit, createdBy }) {
    const [messageData, setMessageData] = useState({
        unique_id: message?.properties?.unique_id || '',
        name: message?.properties?.name || '',
        date_created: message?.properties?.date_created || new Date().toISOString().split('T')[0],
        content: message?.properties?.content || '',
        file_path: message?.properties?.file_path || '',
        uri_path: message?.properties?.uri_path || '',
        message_type: message?.properties?.message_type || messageTypes[0],
        depreciated: message?.properties?.depreciated || false,
        depreciated_date: message?.properties?.depreciated_date || '',
        include_in_report: message?.properties?.include_in_report ?? true,
        created_by: createdBy || {},
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMessageData({
            unique_id: message?.properties?.unique_id || '',
            name: message?.properties?.name || '',
            date_created:
                message?.properties?.date_created ||
                new Date().toISOString().split('T')[0],
            content: message?.properties?.content || '',
            file_path: message?.properties?.file_path || '',
            uri_path: message?.properties?.uri_path || '',
            message_type: message?.properties?.message_type || messageTypes[0],
            depreciated: message?.properties?.depreciated || false,
            depreciated_date: message?.properties?.depreciated_date || '',
            include_in_report: message?.properties?.include_in_report ?? true,
            created_by: createdBy || {},
        });
    }, [message, createdBy]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMessageData({
            ...messageData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(messageData);
        } catch (error) {
            console.error('Error submitting message:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Message Name</FormLabel>
                <Input name="name" value={messageData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input
                    name="date_created"
                    type="date"
                    value={messageData.date_created}
                    onChange={handleChange}
                />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Message Content</FormLabel>
                <Textarea name="content" value={messageData.content} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>File Path</FormLabel>
                <Input name="file_path" value={messageData.file_path} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>URI Path</FormLabel>
                <Input name="uri_path" value={messageData.uri_path} onChange={handleChange} />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Message Type</FormLabel>
                <Select name="message_type" value={messageData.message_type} onChange={handleChange}>
                    {messageTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </Select>
            </FormControl>

            {messageData.created_by?.name ? (
                <Box mb={4}>
                    <Text fontSize="sm" color="gray.600">
                        Created by: {messageData.created_by.name} ({messageData.created_by.title || 'Unknown Title'})
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
                            isChecked={messageData.depreciated}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Include in Report</FormLabel>
                        <Switch
                            name="include_in_report"
                            isChecked={messageData.include_in_report}
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
                            value={messageData.depreciated_date}
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
                loadingText={message?.properties?.name ? 'Updating...' : 'Submitting...'}
            >
                {message?.properties?.name ? 'Update Message' : 'Submit Message'}
            </Button>
        </Box>
    );
}

export default MessageViewer;
