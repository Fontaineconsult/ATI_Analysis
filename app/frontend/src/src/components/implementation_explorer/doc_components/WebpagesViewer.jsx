import React from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

export default function WebpagesViewer({ webpages = [] }) {
    return (
        <Box>
            <Heading size="sm" color="gray.700" fontWeight="bold" mb={3}>
                Webpages ({webpages.length || 0})
            </Heading>

            {webpages.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {webpages.map((wp) => (
                        <Box
                            key={wp.unique_id}
                            p={4}
                            bg="white"
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="teal.300"
                            boxShadow="sm"
                            _hover={{ boxShadow: 'md' }}
                            transition="box-shadow 0.2s"
                        >
                            <Link href={wp.url} isExternal color="teal.600">
                                <HStack>
                                    <Text fontSize="sm" fontWeight="bold">
                                        {wp.name || wp.url}
                                    </Text>
                                    <ExternalLinkIcon />
                                </HStack>
                            </Link>

                            {wp.description && (
                                <Text fontSize="xs" color="gray.700" mt={2}>
                                    {wp.description}
                                </Text>
                            )}

                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                {wp.no_longer_exists && (
                                    <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="md">
                                        No Longer Exists
                                    </Badge>
                                )}
                                {wp.depreciated && (
                                    <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated
                                    </Badge>
                                )}
                                {wp.include_in_report && (
                                    <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                                        In Report
                                    </Badge>
                                )}
                                {wp.depreciated_date && (
                                    <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated: {formatDate(wp.depreciated_date)}
                                    </Badge>
                                )}
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No webpages attached
                </Text>
            )}
        </Box>
    );
}
