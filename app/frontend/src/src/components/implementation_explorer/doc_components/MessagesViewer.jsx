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

const MessagesSection = ({ messages = [], formatDate }) => {
    return (
        <Box>
            <Heading size="sm" color="gray.700" fontWeight="bold" mb={3}>
                Messages ({messages.length})
            </Heading>

            {messages.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {messages.map((msg) => (
                        <Box
                            key={msg.unique_id}
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
                                    {msg.name}
                                </Text>
                                {msg.type && (
                                    <Badge colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="md">
                                        {msg.type}
                                    </Badge>
                                )}
                            </HStack>

                            {msg.content && (
                                <Text fontSize="xs" color="gray.700" mt={2} noOfLines={3}>
                                    {msg.content}
                                </Text>
                            )}

                            {msg.file_path && (
                                <Link fontSize="xs" color="teal.600" mt={2} display="block">
                                    File: {msg.file_path}
                                </Link>
                            )}

                            {msg.uri_path && (
                                <Link
                                    href={msg.uri_path}
                                    isExternal
                                    fontSize="xs"
                                    color="teal.600"
                                    mt={2}
                                    display="block"
                                >
                                    <HStack spacing={1}>
                                        <Text>URI: {msg.uri_path}</Text>
                                        <ExternalLinkIcon />
                                    </HStack>
                                </Link>
                            )}

                            {msg.date_created && (
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                    Created: {formatDate(msg.date_created)}
                                </Text>
                            )}

                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                {msg.depreciated && (
                                    <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated
                                    </Badge>
                                )}
                                {msg.include_in_report && (
                                    <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                                        In Report
                                    </Badge>
                                )}
                                {msg.depreciated_date && (
                                    <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated: {formatDate(msg.depreciated_date)}
                                    </Badge>
                                )}
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No messages attached
                </Text>
            )}
        </Box>
    );
};

export default MessagesSection;
