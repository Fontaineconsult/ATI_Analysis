import React, { useContext, useState } from 'react';
import {
    Box,
    Heading,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Button,
    HStack,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { StatusLevelContext } from '../../../context/StatusLevelContext';
import EditStatusLevel from './EditStatusLevel';

const STATUS_COLORS = {
    '0': 'red',
    '1': 'orange',
    '2': 'yellow',
    '3': 'green',
    '4': 'green',
    '5': 'teal',
};

function StatusLevels() {
    const { statusLevels, loading, error, refreshStatusLevels } = useContext(StatusLevelContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(null);

    const openCreateModal = () => {
        setSelectedLevel(null);
        setIsModalOpen(true);
    };

    const openEditModal = (level) => {
        setSelectedLevel(level);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        refreshStatusLevels();
    };

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Text color="red.500" fontSize="sm">{error}</Text>
            </Box>
        );
    }

    const levels = (statusLevels || []).sort((a, b) =>
        (a.status_value || '0').localeCompare(b.status_value || '0')
    );

    return (
        <Box>
            <HStack justifyContent="space-between" mb={4}>
                <Heading size="md" color="gray.800">Status Levels</Heading>
                <Button colorScheme="teal" size="sm" onClick={openCreateModal}>
                    Add Status Level
                </Button>
            </HStack>

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                boxShadow="sm"
            >
                <TableContainer>
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="50px">Level</Th>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="130px">Status</Th>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold">Procedures</Th>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold">Documentation</Th>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold">Resources</Th>
                                <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="80px">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {levels.map((level) => (
                                <Tr key={level.status_level} _hover={{ bg: 'gray.50' }}>
                                    <Td>
                                        <Badge
                                            fontSize="xs"
                                            colorScheme={STATUS_COLORS[level.status_value] || 'gray'}
                                            variant="solid"
                                            borderRadius="full"
                                            px={2}
                                        >
                                            {level.status_value}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                            {level.status_level}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="xs" color="gray.600" whiteSpace="normal" maxW="250px">
                                            {level.description_of_procedures || '-'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="xs" color="gray.600" whiteSpace="normal" maxW="250px">
                                            {level.description_of_documentation || '-'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Text fontSize="xs" color="gray.600" whiteSpace="normal" maxW="250px">
                                            {level.description_of_resources || '-'}
                                        </Text>
                                    </Td>
                                    <Td>
                                        <Button
                                            size="xs"
                                            colorScheme="teal"
                                            variant="ghost"
                                            onClick={() => openEditModal(level)}
                                        >
                                            Edit
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            {levels.length === 0 && (
                <Box p={6} textAlign="center">
                    <Text fontSize="sm" color="gray.500">No status levels available.</Text>
                </Box>
            )}

            <EditStatusLevel
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                statusLevelData={selectedLevel}
                onSave={handleSave}
            />
        </Box>
    );
}

export default StatusLevels;
