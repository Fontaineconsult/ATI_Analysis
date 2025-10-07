import React from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Badge,
    Link,
    HStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const MetricsSection = ({ metrics = [] }) => {
    return (
        <Box>
            <Heading size="sm" color="gray.700" fontWeight="bold" mb={3}>
                Metrics ({metrics.length})
            </Heading>

            {metrics.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {metrics.map((metric) => (
                        <Box
                            key={metric.unique_id}
                            p={4}
                            bg="white"
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                            boxShadow="sm"
                            _hover={{ boxShadow: 'md' }}
                            transition="box-shadow 0.2s"
                        >
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                    {metric.name}
                                </Text>
                                {metric.metric_type && (
                                    <Badge colorScheme="orange" fontSize="xs" px={2} py={1} borderRadius="md">
                                        {metric.metric_type}
                                    </Badge>
                                )}
                            </HStack>

                            {metric.description && (
                                <Text fontSize="xs" color="gray.700" mt={2}>
                                    {metric.description}
                                </Text>
                            )}

                            {metric.single_value && (
                                <Text fontSize="sm" color="gray.800" fontWeight="semibold" mt={2}>
                                    Value: {metric.single_value}
                                </Text>
                            )}

                            {metric.comment && (
                                <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
                                    {metric.comment}
                                </Text>
                            )}

                            {metric.file_path && (
                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                    File: {metric.file_path}
                                </Link>
                            )}

                            {metric.uri_path && (
                                <Link
                                    href={metric.uri_path}
                                    isExternal
                                    fontSize="xs"
                                    color="teal.600"
                                    mt={2}
                                    display="block"
                                >
                                    <HStack spacing={1}>
                                        <Text>URI: {metric.uri_path}</Text>
                                        <ExternalLinkIcon />
                                    </HStack>
                                </Link>
                            )}

                            {metric.composite_key && (
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                    Key: {metric.composite_key}
                                </Text>
                            )}

                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                {metric.include_in_report && (
                                    <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                                        In Report
                                    </Badge>
                                )}
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No metrics attached
                </Text>
            )}
        </Box>
    );
};

export default MetricsSection;
