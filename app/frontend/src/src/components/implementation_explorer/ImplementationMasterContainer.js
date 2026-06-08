import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    Heading,
    Text,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Card,
    CardBody
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import ImplementationTypeOverview from './ImplementationTypeOverview';
import CreateImplementationModal from '../graph_components/implementation/CreateImplementation';
import { DataContext } from '../../context/DataContext';
import { useDescriptors } from '../../hooks/useDescriptors';

function ImplementationExplorer() {
    const implementationTypes = [
        'Process',
        'Project',
        'Procedure',
        'Service',
        'Guidance',
        'Tracking',
        'InternalPolicy'
    ];

    const { implementationType, implementationId, campus } = useParams();
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState(implementationType || implementationTypes[0]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { refreshImplementations } = useContext(DataContext);
    const { getNodeTypeDefinition } = useDescriptors();

    // Update selected type when URL changes
    useEffect(() => {
        if (implementationType && implementationTypes.includes(implementationType)) {
            setSelectedType(implementationType);
        }
    }, [implementationType]);

    // Navigate when type is selected
    const handleTypeSelect = (type) => {
        setSelectedType(type);
        navigate(`/${campus}/ati-explorer/implementations/${type}`);
    };

    // If no type in URL, redirect to first type
    useEffect(() => {
        if (!implementationType) {
            navigate(`/${campus}/ati-explorer/implementations/${implementationTypes[0]}`, { replace: true });
        }
    }, [implementationType, navigate]);

    const handleModalClose = () => {
        onClose();
        if (refreshImplementations) {
            refreshImplementations();
        }
    };

    // Get the definition for the selected type (from the ontology descriptions store)
    const selectedDefinition = getNodeTypeDefinition(selectedType);

    return (
        <Box maxW="1400px" mx="auto" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
                <Box>
                    <Heading size="lg" color="gray.800">Implementation Explorer</Heading>
                    <Text color="gray.600" mt={2}>Select an implementation type to view details</Text>
                </Box>
                <IconButton
                    aria-label="Create new implementation"
                    icon={<AddIcon />}
                    colorScheme="teal"
                    size="sm"
                    onClick={onOpen}
                    borderRadius="lg"
                    _hover={{
                        boxShadow: 'md',
                        transform: 'scale(1.05)'
                    }}
                    transition="all 0.2s"
                />
            </Flex>

            <Flex wrap="wrap" gap={3} mb={6}>
                {implementationTypes.map(type => (
                    <Button
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        colorScheme={selectedType === type ? "teal" : "gray"}
                        variant={selectedType === type ? "solid" : "outline"}
                        size="sm"
                        borderRadius="lg"
                        _hover={{
                            boxShadow: 'md',
                            transform: 'translateY(-1px)'
                        }}
                        transition="all 0.2s"
                    >
                        {type}
                    </Button>
                ))}
            </Flex>

            {/* Definition Card */}
            {selectedDefinition && (
                <Card
                    mb={6}
                    borderRadius="lg"
                    bg="gray.50"
                    borderWidth="1px"
                    borderColor="gray.200"
                    shadow="sm"
                >
                    <CardBody>
                        <Heading size="sm" mb={2} color="teal.700">
                            {selectedDefinition.name}
                        </Heading>
                        <Text
                            color="gray.700"
                            fontSize="sm"
                            lineHeight="tall"
                        >
                            {selectedDefinition.description}
                        </Text>
                    </CardBody>
                </Card>
            )}

            {selectedType && (
                <ImplementationTypeOverview
                    implementationType={selectedType}
                 initialImplementationId={implementationId}
                />
            )}

            <Modal isOpen={isOpen} onClose={handleModalClose} size="2xl">
                <ModalOverlay />
                <ModalContent borderRadius="lg">
                    <ModalHeader
                        fontSize="md"
                        color="gray.800"
                        borderBottomWidth="1px"
                        borderColor="gray.200"
                        pb={3}
                    >
                        Create New Implementation
                    </ModalHeader>
                    <ModalCloseButton borderRadius="lg" />
                    <ModalBody py={4}>
                        <CreateImplementationModal
                            implementationTypes={implementationTypes}
                            yearIdentifier={null}
                            onClose={handleModalClose}
                            onSuccess={() => {}}
                            currentWorkingGroup={null}
                            loadSingleWorkingGroupData={null}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default ImplementationExplorer;