import React, { useContext, useState } from 'react';
import { Box, Button, Input, Textarea, Switch, FormControl, FormLabel, Text, Flex, Collapse, Select } from '@chakra-ui/react';
import { updateMessage } from "../../../services/api/put";
import { addNewMessage } from "../../../services/api/post";
import { DataContext } from "../../../context/DataContext";
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';  // Import the UserContext

const messageTypes = ["e-mail", "voice mail", "text message", "letter", "memo", "report", "meeting minutes", "presentation"];

function MessageViewer({ messages, onSubmit, yearSuccessEvidence, createdBy }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewMessage, setIsAddingNewMessage] = useState(false); // State for adding new message
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);  // Get the current user from UserContext

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated messages
    const handleFormSubmit = async (index, messageData, isNew) => {
        try {
            if (isNew) {
                // If adding a new message, set date_created to now
                messageData.date_created = new Date().toISOString().split('T')[0];  // Format as YYYY-MM-DD
                await addNewMessage(yearSuccessEvidence,
                    messageData,
                    createdBy);
            } else {
                await updateMessage(yearSuccessEvidence,
                    messageData,
                    createdBy);
            }
            loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewMessage(false);
        } catch (error) {
            console.error('Error submitting message:', error);
        }
    };

    return (
        <Box>
            {/* Button to add a new message */}
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

            {/* Render the MessageForm for adding a new message if isAddingNewMessage is true */}
            {isAddingNewMessage ? (
                <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <MessageForm
                        message={null}  // Pass null for a new message
                        onSubmit={(messageData) => handleFormSubmit(null, messageData, true)}  // Pass true to indicate new message
                        createdBy={user?.properties || user}  // Pass user data or null
                    />
                </Box>
            ) : (
                // Render existing messages if not adding a new message
                messages && messages.length > 0 ? (
                    messages.map((messageWrapper, index) => {
                        const message = messageWrapper.message;
                        const createdByPerson = messageWrapper.created_by?.properties;

                        return (
                            <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                                <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                                    <Text fontWeight="bold" fontSize="lg">
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
                                            message={message}  // Pass the actual message object
                                            onSubmit={(messageData) => handleFormSubmit(index, messageData, false)}  // Pass false to indicate update
                                            createdBy={createdByPerson}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })
                ) : (
                    <Text>No messages available.</Text>
                )
            )}
        </Box>
    );
}

function MessageForm({ message, onSubmit, createdBy }) {
    const [messageData, setMessageData] = useState({
        name: message?.properties?.name || '',
        date_created: message?.properties?.date_created || new Date().toISOString().split('T')[0],  // Default to today's date if new
        content: message?.properties?.content || '',
        file_path: message?.properties?.file_path || '',
        uri_path: message?.properties?.uri_path || '',
        message_type: message?.properties?.message_type || messageTypes[0],  // Default to first message type
        depreciated: message?.properties?.depreciated || false,
        depreciated_date: message?.properties?.depreciated_date || '',
        include_in_report: message?.properties?.include_in_report || true,
        created_by: createdBy || {},  // Use the passed createdBy data or fallback to an empty object
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMessageData({
            ...messageData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(messageData);
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Message Name</FormLabel>
                <Input name="name" value={messageData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input name="date_created" type="date" value={messageData.date_created} onChange={handleChange} />
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

            {/* Dropdown for message type */}
            <FormControl mb={4}>
                <FormLabel>Message Type</FormLabel>
                <Select name="message_type" value={messageData.message_type} onChange={handleChange}>
                    {messageTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </Select>
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

            <Button type="submit" colorScheme="teal" mt={4}>
                {message?.properties?.name ? 'Update Message' : 'Submit Message'}
            </Button>
        </Box>
    );
}

export default MessageViewer;
