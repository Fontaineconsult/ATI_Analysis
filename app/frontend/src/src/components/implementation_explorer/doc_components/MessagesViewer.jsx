import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast, Textarea, Select
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import {addMessageToImplementation, addNewMessage} from '../../../services/api/post';
import { updateMessage } from '../../../services/api/put';
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

function MessageForm({ message, onSubmit, onCancel, isNewMessage }) {
    const { user } = useContext(UserContext);
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
        include_in_report: message?.include_in_report ?? true,
        created_by: user || {}
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="teal.300">
            <FormControl mb={3}>
                <FormLabel fontSize="sm">Message Name</FormLabel>
                <Input size="sm" name="name" value={messageData.name} onChange={handleChange} required />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Content</FormLabel>
                <Textarea size="sm" name="content" value={messageData.content} onChange={handleChange} rows={3} />
            </FormControl>

            <Flex gap={4} mb={3}>
                <FormControl flex="1">
                    <FormLabel fontSize="sm">Message Type</FormLabel>
                    <Select size="sm" name="type" value={messageData.type} onChange={handleChange}>
                        {messageTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl flex="1">
                    <FormLabel fontSize="sm">Date Created</FormLabel>
                    <Input size="sm" name="date_created" type="date" value={messageData.date_created} onChange={handleChange} />
                </FormControl>
            </Flex>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">File Path</FormLabel>
                <Input size="sm" name="file_path" value={messageData.file_path} onChange={handleChange} />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">URI Path</FormLabel>
                <Input size="sm" name="uri_path" value={messageData.uri_path} onChange={handleChange} />
            </FormControl>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={messageData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Include in Report</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={messageData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    {messageData.depreciated && (
                        <FormControl>
                            <FormLabel fontSize="sm">Depreciation Date</FormLabel>
                            <Input size="sm" type="date" name="depreciated_date"
                                   value={messageData.depreciated_date} onChange={handleChange} />
                        </FormControl>
                    )}
                </Box>
            </Flex>

            <HStack spacing={2}>
                <Button size="sm" type="submit" colorScheme="teal"
                        isLoading={isSubmitting} loadingText={isNewMessage ? 'Adding...' : 'Updating...'}>
                    {isNewMessage ? 'Add Message' : 'Update Message'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                    Cancel
                </Button>
            </HStack>
        </Box>
    );
}

const MessagesViewer = ({ messages = [], implementation_id, implementation_type, formatDate }) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddMessage = async (messageData) => {
        try {
            await addMessageToImplementation(implementation_id, implementation_type, messageData, user?.employee_id || '', implementation_id, implementation_type);

            toast({
                title: "Message added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setIsAddingNew(false);
        } catch (error) {
            toast({
                title: "Error adding message",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateMessage = async (messageData, index) => {
        try {
            await updateMessage(null, messageData, user?.employee_id || '', implementation_id, implementation_type);

            toast({
                title: "Message updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setEditingIndex(null);
        } catch (error) {
            toast({
                title: "Error updating message",
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
                    Messages ({messages.length})
                </Heading>
                {implementation_id && implementation_type && (
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => {setIsAddingNew(true); setEditingIndex(null);}}
                        isDisabled={isAddingNew}
                    >
                        Add Message
                    </Button>
                )}
            </HStack>

            {isAddingNew && (
                <Box mb={4}>
                    <MessageForm
                        message={null}
                        onSubmit={handleAddMessage}
                        onCancel={() => setIsAddingNew(false)}
                        isNewMessage={true}
                    />
                </Box>
            )}

            {messages.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {messages.map((msg, index) => (
                        <Box key={msg.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={3}>
                                    <MessageForm
                                        message={msg}
                                        onSubmit={(data) => handleUpdateMessage(data, index)}
                                        onCancel={() => setEditingIndex(null)}
                                        isNewMessage={false}
                                    />
                                </Box>
                            </Collapse>

                            <Collapse in={editingIndex !== index} animateOpacity>
                                <Box
                                    p={4}
                                    bg="white"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    boxShadow="sm"
                                    _hover={{ boxShadow: 'md' }}
                                    transition="box-shadow 0.2s"
                                >
                                    <HStack justify="space-between" align="start">
                                        <Box flex="1">
                                            <HStack justify="space-between" mb={2}>
                                                <Heading as='h3' fontSize="sm" fontWeight="bold" color="gray.800">
                                                    {msg.name}
                                                </Heading>
                                                {msg.type && (
                                                    <Badge colorScheme="purple" fontSize="xs">
                                                        {msg.type}
                                                    </Badge>
                                                )}
                                            </HStack>

                                            {msg.content && (
                                                <Text fontSize="xs" color="gray.700" mt={2} noOfLines={3}>
                                                    {msg.content}
                                                </Text>
                                            )}

                                            {msg.file_path && (
                                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                                    File: {msg.file_path}
                                                </Link>
                                            )}

                                            {msg.uri_path && (
                                                <Link href={msg.uri_path} isExternal fontSize="xs" color="teal.600" mt={2} display="block">
                                                    <HStack spacing={1}>
                                                        <Text>URI: {msg.uri_path}</Text>
                                                        <ExternalLinkIcon />
                                                    </HStack>
                                                </Link>
                                            )}

                                            {msg.date_created && (
                                                <Text fontSize="xs" color="gray.500" mt={2}>
                                                    Created: {formatDate ? formatDate(msg.date_created) : msg.date_created}
                                                </Text>
                                            )}

                                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                                {msg.depreciated === true && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
                                                )}
                                                {msg.include_in_report !== false && (
                                                    <Badge colorScheme="green" fontSize="xs">In Report</Badge>
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
                    No messages attached
                </Text>
            )}
        </Box>
    );
};

export default MessagesViewer;