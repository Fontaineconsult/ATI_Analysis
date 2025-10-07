import React from 'react';
import {
    Box, VStack, Heading, Text, Badge,
} from '@chakra-ui/react';

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

export default function NotesViewer({ notes = [] }) {
    return (
        <Box>
            <Heading size="sm" color="gray.700" fontWeight="bold" mb={3}>
                Notes ({notes.length || 0})
            </Heading>

            {notes.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {notes.map((note) => (
                        <Box
                            key={note.unique_id}
                            p={4}
                            bg="white"
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                            boxShadow="sm"
                            _hover={{ boxShadow: 'md' }}
                            transition="box-shadow 0.2s"
                        >
                            <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                {note.name}
                            </Text>

                            {note.content && (
                                <Text fontSize="xs" color="gray.700" mt={2} noOfLines={3}>
                                    {note.content}
                                </Text>
                            )}

                            {note.date_created && (
                                <Text fontSize="xs" color="gray.500" mt={2}>
                                    Created: {formatDate(note.date_created)}
                                </Text>
                            )}

                            <Box mt={3}>
                                {note.depreciated && (
                                    <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md" mr={2}>
                                        Deprecated
                                    </Badge>
                                )}
                                {note.include_in_report && (
                                    <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md" mr={2}>
                                        In Report
                                    </Badge>
                                )}
                                {note.depreciated_date && (
                                    <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="md">
                                        Deprecated: {formatDate(note.depreciated_date)}
                                    </Badge>
                                )}
                            </Box>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    No notes attached
                </Text>
            )}
        </Box>
    );
}
