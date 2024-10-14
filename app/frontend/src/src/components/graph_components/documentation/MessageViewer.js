import React, { useState } from 'react';
import { Box, Button, Input, Textarea, Switch, FormControl, FormLabel, Text, Flex, Collapse, Select } from '@chakra-ui/react';

// Available message types
const messageTypes = ["e-mail", "voice mail", "text message", "letter", "memo"];

function MessageViewer({ messages, onSubmit }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Toggle expanded/collapsed state, allowing only one to be expanded at a time
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index); // Toggle the selected message
    };

    const handleFormSubmit = (index, updatedMessage) => {
        onSubmit(index, updatedMessage);  // Pass the updated message data and index to the parent
        setExpandedIndex(null);  // Collapse the form after submitting
    };

    return (
        <Box>
            {messages.map((message, index) => (
                <Box key={index} mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                    <Flex justify="space-between" alignItems="center" cursor="pointer" onClick={() => toggleCollapse(index)}>
                        <Text fontWeight="bold" fontSize="lg">
                            {message.properties.name || 'Untitled Message'}
                        </Text>
                        <Button size="sm" colorScheme="teal">
                            {expandedIndex === index ? 'Collapse' : 'Expand'}
                        </Button>
                    </Flex>

                    {/* Collapsible form content */}
                    <Collapse in={expandedIndex === index} animateOpacity>
                        <Box mt={4}>
                            <MessageForm
                                message={message}  // Pass the current message to the form
                                onSubmit={(updatedMessage) => handleFormSubmit(index, updatedMessage)}  // Handle form submit
                            />
                        </Box>
                    </Collapse>
                </Box>
            ))}
        </Box>
    );
}

function MessageForm({ message, onSubmit }) {
    const [messageData, setMessageData] = useState({
        name: message.properties.name || '',
        content: message.properties.content || '',
        file_path: message.properties.file_path || '',
        uri_path: message.properties.uri_path || '',
        date_created: message.properties.date_created || '',
        type: message.properties.type || '',
        depreciated: message.properties.depreciated || false,
        depreciated_date: message.properties.depreciated_date || '',
        include_in_report: message.properties.include_in_report || true,
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
        onSubmit(messageData);  // Pass the updated message data to the parent
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Message Name</FormLabel>
                <Input name="name" value={messageData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Content</FormLabel>
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
                <Select name="type" value={messageData.type} onChange={handleChange}>
                    {messageTypes.map((msgType) => (
                        <option key={msgType} value={msgType}>
                            {msgType}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Date Created</FormLabel>
                <Input name="date_created" type="date" value={messageData.date_created} onChange={handleChange} />
            </FormControl>

            {/* Flex box to split the toggles and date fields into two columns */}
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

            <Button type="submit" colorScheme="teal" mt={4}>Submit Changes</Button>
        </Box>
    );
}

export default MessageViewer;
