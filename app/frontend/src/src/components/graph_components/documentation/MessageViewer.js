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
    HStack,
    VStack,
    Badge,
    IconButton,
    Grid,
    GridItem,
    Link
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { updateMessage } from '../../../services/api/put';
import { addNewMessage } from '../../../services/api/post';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import FileUploadField from '../../implementation_explorer/doc_components/FileUploadField';

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

const messageTypeColors = {
    'e-mail': 'blue',
    'voice mail': 'purple',
    'text message': 'green',
    'letter': 'orange',
    'memo': 'yellow',
    'report': 'red',
    'meeting minutes': 'cyan',
    'presentation': 'pink',
};

function MessageViewer({ messages, onSubmit, yearSuccessEvidence, createdBy, implementation_id, implementation_type }) {
    const [isImplementation, setIsImplementation] = useState(false);
    const [isYearSuccessEvidence, setIsYearSuccessEvidence] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewMessage, setIsAddingNewMessage] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);

    useEffect(() => {
        setIsYearSuccessEvidence(!!yearSuccessEvidence);
        setIsImplementation(!!implementation_id && !!implementation_type);
    }, [yearSuccessEvidence, implementation_id, implementation_type]);

    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = async (index, messageData, isNew) => {
        try {
            if (isNew) {
                messageData.date_created = new Date().toISOString().split('T')[0];
            }

            if (isNew) {
                if (isYearSuccessEvidence) {
                    await addNewMessage(yearSuccessEvidence, messageData, user?.employee_id || '');
                } else if (isImplementation) {
                    await addNewMessage(null, messageData, user?.employee_id || '', implementation_id, implementation_type);
                }
            } else {
                if (isYearSuccessEvidence) {
                    await updateMessage(yearSuccessEvidence, messageData, user?.employee_id || '');
                } else if (isImplementation) {
                    await updateMessage(null, messageData, user?.employee_id || '', implementation_id, implementation_type);
                }
            }

            await loadSingleWorkingGroupData(currentWorkingGroup);
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
                    size="xs"
                    colorScheme="teal"
                    onClick={() => {
                        setIsAddingNewMessage(true);
                        setExpandedIndex(null);
                    }}
                    mb={3}
                >
                    Add New Message
                </Button>
            )}

            {isAddingNewMessage && (
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <MessageForm
                        message={null}
                        onSubmit={(messageData) => handleFormSubmit(null, messageData, true)}
                        createdBy={user}
                        onCancel={() => setIsAddingNewMessage(false)}
                    />
                </Box>
            )}

            {messages && messages.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {messages.map((messageWrapper, index) => {
                        const message = messageWrapper.message || messageWrapper;
                        const createdBy = messageWrapper.created_by || message.created_by || null;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={message.properties?.unique_id || index}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                bg="white"
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                                transition="all 0.2s"
                            >
                                {/* Compact view */}
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex="1">
                                        {/* Title row with badges */}
                                        <HStack spacing={2} width="full">
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {message.properties?.name || 'Untitled Message'}
                                            </Text>
                                            <Badge
                                                colorScheme={messageTypeColors[message.properties?.message_type] || 'gray'}
                                                fontSize="10px"
                                            >
                                                {message.properties?.message_type || 'unknown'}
                                            </Badge>
                                            {message.properties?.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {message.properties?.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                        </HStack>

                                        {/* Content preview and metadata */}
                                        <HStack spacing={3} fontSize="xs" width="full">
                                            {message.properties?.content && (
                                                <Text color="gray.600" noOfLines={1} maxW="400px">
                                                    {message.properties.content}
                                                </Text>
                                            )}
                                            {(message.properties?.file_path || message.properties?.uri_path) && (
                                                <Link
                                                    href={message.properties?.file_path || message.properties?.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    Link <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            {message.properties?.file?.download_url && (
                                                <Link
                                                    href={message.properties.file.download_url}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    {message.properties.file.original_filename || 'Download'} <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                        </HStack>

                                        <HStack spacing={3} fontSize="xs" color="gray.600">
                                            <Text>Created: {message.properties?.date_created || 'N/A'}</Text>
                                            {createdBy?.properties?.name && (
                                                <Text>By: {createdBy.properties.name}</Text>
                                            )}
                                        </HStack>
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit message"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleCollapse(index)}
                                        ml={2}
                                    />
                                </Flex>

                                {/* Collapsible edit form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <MessageForm
                                            message={message}
                                            onSubmit={(messageData) => handleFormSubmit(index, messageData, false)}
                                            createdBy={createdBy}
                                            onCancel={() => toggleCollapse(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.600" fontSize="sm">No messages available.</Text>
            )}
        </Box>
    );
}

function MessageForm({ message, onSubmit, createdBy, onCancel }) {
    const [messageData, setMessageData] = useState({
        unique_id: message?.properties?.unique_id || '',
        name: message?.properties?.name || '',
        date_created: message?.properties?.date_created || new Date().toISOString().split('T')[0],
        content: message?.properties?.content || '',
        file_path: message?.properties?.file_path || '',
        uri_path: message?.properties?.uri_path || '',
        storage_key: message?.properties?.file?.storage_key || '',
        original_filename: message?.properties?.file?.original_filename || '',
        content_type: message?.properties?.file?.content_type || '',
        size: message?.properties?.file?.size ?? null,
        message_type: message?.properties?.message_type || messageTypes[0],
        depreciated: message?.properties?.depreciated || false,
        depreciated_date: message?.properties?.depreciated_date || '',
        include_in_report: message?.properties?.include_in_report ?? true,
        created_by: createdBy || {},
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
        } catch (error) {
            console.error('Error submitting message:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Message Name</FormLabel>
                        <Input size="sm" name="name" value={messageData.name} onChange={handleChange} required />
                    </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                    <FileUploadField
                        value={messageData}
                        onUploaded={(f) => setMessageData({ ...messageData, ...f })}
                        onClear={() => setMessageData({
                            ...messageData,
                            storage_key: '', original_filename: '', content_type: '', size: null,
                        })}
                    />
                </GridItem>

                <FormControl>
                    <FormLabel fontSize="xs">Message Type</FormLabel>
                    <Select size="sm" name="message_type" value={messageData.message_type} onChange={handleChange}>
                        {messageTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">Date Created</FormLabel>
                    <Input size="sm" name="date_created" type="date" value={messageData.date_created} onChange={handleChange} />
                </FormControl>

                <GridItem colSpan={2}>
                    <FormControl>
                        <FormLabel fontSize="xs">Message Content</FormLabel>
                        <Textarea size="sm" name="content" value={messageData.content} onChange={handleChange} rows={3} />
                    </FormControl>
                </GridItem>

                <FormControl>
                    <FormLabel fontSize="xs">File Path</FormLabel>
                    <Input size="sm" name="file_path" value={messageData.file_path} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">URI Path</FormLabel>
                    <Input size="sm" name="uri_path" value={messageData.uri_path} onChange={handleChange} />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="xs">Depreciation Date</FormLabel>
                    <Input size="sm" type="date" name="depreciated_date" value={messageData.depreciated_date} onChange={handleChange} />
                </FormControl>
            </Grid>

            {/* Toggle switches in compact grid */}
            <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={3}>
                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">In Report</FormLabel>
                    <Switch size="sm" name="include_in_report" isChecked={messageData.include_in_report} onChange={handleChange} />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb="0" flex="1">Deprecated</FormLabel>
                    <Switch size="sm" name="depreciated" isChecked={messageData.depreciated} onChange={handleChange} />
                </FormControl>
            </Grid>

            {createdBy?.properties?.name && (
                <Text fontSize="xs" color="gray.600" mt={2}>
                    Created by: {createdBy.properties.name}
                </Text>
            )}

            {/* Action buttons */}
            <HStack mt={3} spacing={2}>
                <Button
                    type="submit"
                    size="xs"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    loadingText={message?.properties?.name ? 'Updating...' : 'Submitting...'}
                >
                    {message?.properties?.name ? 'Update' : 'Submit'}
                </Button>
                {onCancel && (
                    <Button size="xs" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
            </HStack>
        </Box>
    );
}

export default MessageViewer;