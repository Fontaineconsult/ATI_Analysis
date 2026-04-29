import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    VStack,
    HStack,
    Divider,
    Text,
    Box,
    IconButton,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    useToast,
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { createStatusLevel, addStatusLevelSubNode, connectStatusLevelSubNode } from '../../../services/api/post';
import { updateStatusLevelNode, removeStatusLevelSubNode } from '../../../services/api/put';
import { fetchSubNodes } from '../../../services/api/get';

const SUB_NODE_CATEGORIES = [
    {
        label: 'Procedures',
        descriptions: { key: 'procedure_descriptions', textField: 'description' },
        requirements: { key: 'procedure_requirements', textField: 'requirement_description' },
    },
    {
        label: 'Resources',
        descriptions: { key: 'resource_descriptions', textField: 'description' },
        requirements: { key: 'resource_requirements', textField: 'requirement_description' },
    },
    {
        label: 'Documentation',
        descriptions: { key: 'documentation_descriptions', textField: 'description' },
        requirements: { key: 'documentation_requirements', textField: 'requirement_description' },
    },
    {
        label: 'Documentation Evidence',
        descriptions: { key: 'documentation_evidence_descriptions', textField: 'description' },
        requirements: { key: 'documentation_evidence_requirements', textField: 'requirement_description' },
    },
];

const SubNodeList = ({ items, textField, onRemove, onConnect, onCreate, category, statusLevelId }) => {
    const [allNodes, setAllNodes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState('');
    const [newText, setNewText] = useState('');
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch all existing nodes of this type
    useEffect(() => {
        loadAllNodes();
    }, [category]);

    const loadAllNodes = async () => {
        try {
            const response = await fetchSubNodes(category);
            setAllNodes(response.data || []);
        } catch (error) {
            console.error('Error loading sub-nodes:', error);
        }
    };

    // Filter out nodes already connected to this status level
    const connectedIds = new Set((items || []).map(i => i.unique_id));
    const availableNodes = allNodes.filter(n => !connectedIds.has(n.unique_id));

    const handleConnect = async () => {
        if (!selectedNodeId) return;
        setIsLoading(true);
        await onConnect(category, selectedNodeId);
        setSelectedNodeId('');
        await loadAllNodes();
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newText.trim()) return;
        setIsLoading(true);
        await onCreate(category, newText.trim());
        setNewText('');
        setShowCreateInput(false);
        await loadAllNodes();
        setIsLoading(false);
    };

    return (
        <Box>
            {/* Connected items list */}
            <VStack align="stretch" spacing={1} mb={3}>
                {(items || []).length === 0 && (
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">None connected</Text>
                )}
                {(items || []).map((item) => (
                    <HStack
                        key={item.unique_id}
                        bg="gray.50"
                        px={3}
                        py={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                        justify="space-between"
                    >
                        <Text fontSize="xs" color="gray.700" flex={1}>
                            {item[textField]}
                        </Text>
                        <IconButton
                            icon={<CloseIcon />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Disconnect"
                            onClick={() => onRemove(category, item.unique_id)}
                        />
                    </HStack>
                ))}
            </VStack>

            {/* Select existing node dropdown */}
            <HStack mb={2}>
                <Select
                    size="sm"
                    placeholder="Select existing..."
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'teal.500' }}
                    flex={1}
                >
                    {availableNodes.map((node) => (
                        <option key={node.unique_id} value={node.unique_id}>
                            {node[textField]}
                        </option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={handleConnect}
                    isLoading={isLoading && !!selectedNodeId}
                    isDisabled={!selectedNodeId}
                >
                    Connect
                </Button>
            </HStack>

            {/* Create new node */}
            {!showCreateInput ? (
                <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="teal"
                    leftIcon={<AddIcon />}
                    onClick={() => setShowCreateInput(true)}
                >
                    Create New
                </Button>
            ) : (
                <HStack>
                    <Input
                        size="sm"
                        placeholder="Enter new text..."
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                        flex={1}
                    />
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleCreate}
                        isLoading={isLoading && !!newText}
                        isDisabled={!newText.trim()}
                    >
                        Add
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowCreateInput(false); setNewText(''); }}
                    >
                        Cancel
                    </Button>
                </HStack>
            )}
        </Box>
    );
};

const EditStatusLevel = ({ isOpen, onClose, statusLevelData, onSave }) => {
    const [formData, setFormData] = useState({
        status_level: '',
        status_value: '',
        description_of_procedures: '',
        description_of_documentation: '',
        description_of_documentation_evidence: '',
        description_of_resources: '',
        ati_report_evidence_column: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const isEditMode = Boolean(statusLevelData);

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                unique_id: statusLevelData.unique_id,
                status_level: statusLevelData.status_level || '',
                status_value: statusLevelData.status_value || '',
                description_of_procedures: statusLevelData.description_of_procedures || '',
                description_of_documentation: statusLevelData.description_of_documentation || '',
                description_of_documentation_evidence: statusLevelData.description_of_documentation_evidence || '',
                description_of_resources: statusLevelData.description_of_resources || '',
                ati_report_evidence_column: statusLevelData.ati_report_evidence_column || '',
            });
        } else {
            setFormData({
                status_level: '',
                status_value: '',
                description_of_procedures: '',
                description_of_documentation: '',
                description_of_documentation_evidence: '',
                description_of_resources: '',
                ati_report_evidence_column: '',
            });
        }
    }, [statusLevelData, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await updateStatusLevelNode(formData);
                toast({ title: 'Status level updated.', status: 'success', duration: 2000, isClosable: true });
            } else {
                await createStatusLevel(formData);
                toast({ title: 'Status level created.', status: 'success', duration: 2000, isClosable: true });
            }
            onSave();
            onClose();
        } catch (error) {
            toast({ title: 'Error saving status level.', description: error.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConnectSubNode = async (category, subNodeId) => {
        try {
            await connectStatusLevelSubNode(statusLevelData.unique_id, category, subNodeId);
            toast({ title: 'Connected.', status: 'success', duration: 1500, isClosable: true });
            onSave();
        } catch (error) {
            toast({ title: 'Error connecting.', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleCreateSubNode = async (category, text) => {
        try {
            await addStatusLevelSubNode(statusLevelData.unique_id, category, text);
            toast({ title: 'Created and connected.', status: 'success', duration: 1500, isClosable: true });
            onSave();
        } catch (error) {
            toast({ title: 'Error creating.', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleRemoveSubNode = async (category, subNodeId) => {
        try {
            await removeStatusLevelSubNode(statusLevelData.unique_id, category, subNodeId);
            toast({ title: 'Disconnected.', status: 'info', duration: 1500, isClosable: true });
            onSave();
        } catch (error) {
            toast({ title: 'Error disconnecting.', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxH="90vh">
                <ModalHeader color="gray.800" fontWeight="bold">
                    {isEditMode ? 'Edit Status Level' : 'Add Status Level'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Status Level Name</FormLabel>
                            <Input size="sm" name="status_level" value={formData.status_level} onChange={handleInputChange}
                                placeholder="e.g. Established" isReadOnly={isEditMode} bg={isEditMode ? 'gray.50' : 'white'}
                                borderColor="gray.300" _hover={{ borderColor: isEditMode ? 'gray.300' : 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Status Value</FormLabel>
                            <Input size="sm" name="status_value" value={formData.status_value} onChange={handleInputChange}
                                placeholder="e.g. 3" isReadOnly={isEditMode} bg={isEditMode ? 'gray.50' : 'white'}
                                borderColor="gray.300" _hover={{ borderColor: isEditMode ? 'gray.300' : 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <Divider />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Description of Procedures</FormLabel>
                            <Textarea size="sm" name="description_of_procedures" value={formData.description_of_procedures}
                                onChange={handleInputChange} placeholder="Describe procedure requirements..." rows={3}
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Description of Documentation</FormLabel>
                            <Textarea size="sm" name="description_of_documentation" value={formData.description_of_documentation}
                                onChange={handleInputChange} placeholder="Describe documentation requirements..." rows={3}
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Description of Documentation Evidence</FormLabel>
                            <Textarea size="sm" name="description_of_documentation_evidence" value={formData.description_of_documentation_evidence}
                                onChange={handleInputChange} placeholder="Describe documentation evidence requirements..." rows={3}
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Description of Resources</FormLabel>
                            <Textarea size="sm" name="description_of_resources" value={formData.description_of_resources}
                                onChange={handleInputChange} placeholder="Describe resource requirements..." rows={3}
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">ATI Report Evidence Column</FormLabel>
                            <Textarea size="sm" name="ati_report_evidence_column" value={formData.ati_report_evidence_column}
                                onChange={handleInputChange} placeholder="Evidence column description..." rows={2}
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        {/* Sub-node management — only in edit mode */}
                        {isEditMode && (
                            <>
                                <Divider />
                                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                    Descriptions & Requirements
                                </Text>
                                <Accordion allowMultiple>
                                    {SUB_NODE_CATEGORIES.map((cat) => (
                                        <AccordionItem key={cat.label} borderColor="gray.200">
                                            <AccordionButton
                                                _hover={{ bg: 'gray.50' }}
                                                _expanded={{ bg: 'teal.50', color: 'teal.700' }}
                                            >
                                                <Box flex="1" textAlign="left" fontSize="sm" fontWeight="medium">
                                                    {cat.label}
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pb={4}>
                                                <VStack align="stretch" spacing={4}>
                                                    <Box>
                                                        <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wide">
                                                            Descriptions
                                                        </Text>
                                                        <SubNodeList
                                                            items={statusLevelData[cat.descriptions.key]}
                                                            textField={cat.descriptions.textField}
                                                            category={cat.descriptions.key}
                                                            statusLevelId={statusLevelData.unique_id}
                                                            onConnect={handleConnectSubNode}
                                                            onCreate={handleCreateSubNode}
                                                            onRemove={handleRemoveSubNode}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wide">
                                                            Requirements
                                                        </Text>
                                                        <SubNodeList
                                                            items={statusLevelData[cat.requirements.key]}
                                                            textField={cat.requirements.textField}
                                                            category={cat.requirements.key}
                                                            statusLevelId={statusLevelData.unique_id}
                                                            onConnect={handleConnectSubNode}
                                                            onCreate={handleCreateSubNode}
                                                            onRemove={handleRemoveSubNode}
                                                        />
                                                    </Box>
                                                </VStack>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button size="sm" variant="outline" onClick={onClose} mr={3} borderColor="gray.300" _hover={{ bg: 'gray.50' }}>
                        Cancel
                    </Button>
                    <Button size="sm" colorScheme="teal" onClick={handleSubmit} isLoading={isSubmitting}
                        disabled={!formData.status_level || !formData.status_value}>
                        {isEditMode ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditStatusLevel;
