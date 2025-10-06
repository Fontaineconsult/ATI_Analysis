import React, { useState } from 'react';
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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import ImplementationTypeOverview from './ImplementationTypeOverview';
import CreateImplementationModal from '../graph_components/implementation/CreateImplementation';
import { useContext } from 'react';
import { DataContext } from '../../context/DataContext';



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

    const [selectedType, setSelectedType] = useState(implementationTypes[0]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { refreshImplementations } = useContext(DataContext);

    const handleModalClose = () => {
        onClose();
        if (refreshImplementations) {
            refreshImplementations();
        }
    };

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
                    colorScheme="green"
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
                        onClick={() => setSelectedType(type)}
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

            {selectedType && (
                <ImplementationTypeOverview implementationType={selectedType} />
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
                            yearIdentifier={null}  // No YSE to assign to from here
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