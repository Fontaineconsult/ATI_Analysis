import React, { useContext, useState } from 'react';
import {
    Box,
    Heading,
    Text,
    Badge,
    Button,
    HStack,
    VStack,
    Spinner,
    Center,
    Divider,
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

const SubNodeColumn = ({ label, descriptions, requirements, descField, reqField }) => {
    const hasContent = (descriptions?.length > 0) || (requirements?.length > 0);

    return (
        <Box flex={1} minW="0">
            <Text fontSize="xs" fontWeight="bold" color="teal.700" mb={1}>{label}</Text>
            {!hasContent && (
                <Text fontSize="xs" color="gray.400" fontStyle="italic">—</Text>
            )}
            {descriptions?.length > 0 && (
                <Box mb={requirements?.length > 0 ? 2 : 0}>
                    <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>Descriptions</Text>
                    <VStack align="stretch" spacing={1}>
                        {descriptions.map((item) => (
                            <HStack key={item.unique_id} spacing={2} align="flex-start">
                                <Box w="6px" h="6px" borderRadius="full" bg="teal.400" mt="5px" flexShrink={0} />
                                <Text fontSize="xs" color="gray.700">{item[descField]}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            )}
            {requirements?.length > 0 && (
                <Box>
                    <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>Requirements</Text>
                    <VStack align="stretch" spacing={1}>
                        {requirements.map((item) => (
                            <HStack key={item.unique_id} spacing={2} align="flex-start">
                                <Box w="6px" h="6px" borderRadius="full" bg="gray.400" mt="5px" flexShrink={0} />
                                <Text fontSize="xs" color="gray.700">{item[reqField]}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            )}
        </Box>
    );
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
        <Box textAlign="left">
            <HStack justifyContent="space-between" mb={3}>
                <Heading size="md" color="gray.800">Status Levels</Heading>
                <Button colorScheme="teal" size="sm" onClick={openCreateModal}>
                    Add Status Level
                </Button>
            </HStack>

            <VStack align="stretch" spacing={2}>
                {levels.map((level) => (
                    <Box
                        key={level.status_level}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg="white"
                        boxShadow="sm"
                    >
                        <HStack px={3} py={2} bg="gray.50" borderBottomWidth="1px" borderColor="gray.200" justify="space-between">
                            <HStack spacing={2}>
                                <Badge
                                    fontSize="xs"
                                    colorScheme={STATUS_COLORS[level.status_value] || 'gray'}
                                    variant="solid"
                                    borderRadius="full"
                                    px={2}
                                >
                                    {level.status_value}
                                </Badge>
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                    {level.status_level}
                                </Text>
                            </HStack>
                            <Button size="xs" colorScheme="teal" variant="ghost" onClick={() => openEditModal(level)}>
                                Edit
                            </Button>
                        </HStack>

                        <HStack px={3} py={2} spacing={3} align="flex-start">
                            <SubNodeColumn label="Procedures" descriptions={level.procedure_descriptions} requirements={level.procedure_requirements} descField="description" reqField="requirement_description" />
                            <Divider orientation="vertical" h="auto" alignSelf="stretch" borderColor="gray.200" />
                            <SubNodeColumn label="Resources" descriptions={level.resource_descriptions} requirements={level.resource_requirements} descField="description" reqField="requirement_description" />
                            <Divider orientation="vertical" h="auto" alignSelf="stretch" borderColor="gray.200" />
                            <SubNodeColumn label="Documentation" descriptions={level.documentation_descriptions} requirements={level.documentation_requirements} descField="description" reqField="requirement_description" />
                            <Divider orientation="vertical" h="auto" alignSelf="stretch" borderColor="gray.200" />
                            <SubNodeColumn label="Doc. Evidence" descriptions={level.documentation_evidence_descriptions} requirements={level.documentation_evidence_requirements} descField="description" reqField="requirement_description" />
                        </HStack>
                    </Box>
                ))}
            </VStack>

            {levels.length === 0 && (
                <Box p={4} textAlign="center">
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
