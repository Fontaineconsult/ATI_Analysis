import React from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

export default function DocumentsViewer({ documents = [] }) {
    return (
        <Box>
            <Heading size="sm" color="gray.700" fontWeight="bold" mb={3}>
                Documents ({documents.length || 0})
            </Heading>

            {documents.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {documents.map((doc) => (
                        <Box
                            key={doc.unique_id}
                            p={4}
                            bg="teal.50"
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                        >
                            <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                {doc.name}
                            </Text>

                            {doc.description && (
                                <Text fontSize="xs" color="gray.700" mt={2}>
                                    {doc.description}
                                </Text>
                            )}

                            {doc.file_path && (
                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                    {doc.file_path}
                                </Link>
                            )}

                            {doc.uri_path && (
                                <Link
                                    href={doc.uri_path}
                                    isExternal
                                    fontSize="xs"
                                    color="teal.600"
                                    mt={2}
                                    display="block"
                                >
                                    <HStack spacing={1}>
                                        <Text>URI: {doc.uri_path}</Text>
                                        <ExternalLinkIcon />
                                    </HStack>
                                </Link>
                            )}

                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                {doc.is_administrative_review_documentation && (
                                    <Badge colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Admin Review
                                    </Badge>
                                )}
                                {doc.is_milestone_and_measures_documentation && (
                                    <Badge colorScheme="orange" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Milestone Doc
                                    </Badge>
                                )}
                                {doc.depreciated && (
                                    <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated
                                    </Badge>
                                )}
                                {doc.include_in_report && (
                                    <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                                        In Report
                                    </Badge>
                                )}
                                {doc.depreciated_date && (
                                    <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated: {formatDate(doc.depreciated_date)}
                                    </Badge>
                                )}
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No documents attached
                </Text>
            )}
        </Box>
    );
}
