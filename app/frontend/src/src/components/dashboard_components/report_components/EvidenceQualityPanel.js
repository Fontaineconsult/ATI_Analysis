import React, { useContext, useMemo } from 'react';
import {
    Box,
    Text,
    Heading,
    Flex,
    List,
    ListItem,
    HStack,
    VStack,
    Badge,
    Spinner,
} from '@chakra-ui/react';
import { StatusLevelContext } from '../../../context/StatusLevelContext';
import { getStatusColor } from '../../../services/utils/tools';

const CATEGORIES = [
    {
        name: 'Procedures',
        descKey: 'procedure_descriptions',
        reqKey: 'procedure_requirements',
        descField: 'description',
        reqField: 'requirement_description',
    },
    {
        name: 'Resources',
        descKey: 'resource_descriptions',
        reqKey: 'resource_requirements',
        descField: 'description',
        reqField: 'requirement_description',
    },
    {
        name: 'Documentation',
        descKey: 'documentation_descriptions',
        reqKey: 'documentation_requirements',
        descField: 'description',
        reqField: 'requirement_description',
    },
    {
        name: 'Documentation Evidence',
        descKey: 'documentation_evidence_descriptions',
        reqKey: 'documentation_evidence_requirements',
        descField: 'description',
        reqField: 'requirement_description',
    },
];

const CategoryBlock = ({ category, level }) => {
    const descriptions = level?.[category.descKey] || [];
    const requirements = level?.[category.reqKey] || [];
    const hasContent = descriptions.length > 0 || requirements.length > 0;

    return (
        <Box borderBottomWidth="1px" borderColor="gray.100" pb={3}>
            <Text
                fontSize="2xs"
                fontWeight="bold"
                color="gray.600"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
            >
                {category.name}
            </Text>

            {!hasContent && (
                <Text fontSize="xs" color="gray.400" fontStyle="italic">
                    No criteria defined
                </Text>
            )}

            {descriptions.length > 0 && (
                <Box mb={requirements.length > 0 ? 2 : 0}>
                    <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>
                        Descriptions ({descriptions.length})
                    </Text>
                    <List spacing={1} pl={4} styleType="disc">
                        {descriptions.map((item) => (
                            <ListItem key={item.unique_id} color="gray.700" fontSize="xs">
                                {item[category.descField]}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {requirements.length > 0 && (
                <Box>
                    <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>
                        Requirements ({requirements.length})
                    </Text>
                    <List spacing={1} pl={4} styleType="disc">
                        {requirements.map((item) => (
                            <ListItem key={item.unique_id} color="gray.700" fontSize="xs">
                                {item[category.reqField]}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
};

const LevelCard = ({ level }) => {
    if (!level) return null;

    const statusColor = getStatusColor(level.status_level);

    return (
        <Box
            p={4}
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.300"
            position="relative"
            overflow="hidden"
        >
            <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                width="3px"
                bg={statusColor}
            />

            <HStack justify="space-between" mb={3} pl={2}>
                <HStack spacing={2}>
                    <Badge
                        color="white"
                        bg={statusColor}
                        fontSize="2xs"
                        textTransform="uppercase"
                    >
                        Current Level
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="gray.800">
                        {level.status_level}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        (Level {level.status_value})
                    </Text>
                </HStack>
            </HStack>

            <VStack align="stretch" spacing={3} pl={2}>
                {CATEGORIES.map((cat) => (
                    <CategoryBlock key={cat.name} category={cat} level={level} />
                ))}
            </VStack>
        </Box>
    );
};

const EvidenceQualityPanel = ({ currentStatusLevelName }) => {
    const { statusLevels, loading, error } = useContext(StatusLevelContext);

    const current = useMemo(() => {
        if (!statusLevels?.length || !currentStatusLevelName) return null;
        return statusLevels.find(
            (l) => l.status_level?.toLowerCase() === currentStatusLevelName.toLowerCase()
        ) || null;
    }, [statusLevels, currentStatusLevelName]);

    if (!currentStatusLevelName) return null;

    if (loading) {
        return (
            <Box
                p={5}
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                boxShadow="sm"
            >
                <Flex justify="center" py={4}>
                    <Spinner size="md" color="teal.500" />
                </Flex>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                p={5}
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                boxShadow="sm"
            >
                <Text fontSize="sm" color="red.500">{error}</Text>
            </Box>
        );
    }

    if (!current) {
        return (
            <Box
                p={5}
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                boxShadow="sm"
            >
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No quality criteria found for status level "{currentStatusLevelName}".
                </Text>
            </Box>
        );
    }

    return (
        <Box
            p={5}
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
        >
            <Heading as="h3" size="sm" color="teal.700" mb={1}>
                Evidence Quality Criteria
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={4}>
                Descriptions and requirements tied to this indicator's status level.
            </Text>

            <LevelCard level={current} />
        </Box>
    );
};

export default EvidenceQualityPanel;
