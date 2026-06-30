import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Badge,
    Divider,
    Link,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';

function DocumentDetailPanel({ item, documentType }) {
    const navigate = useNavigate();
    const { campus } = useParams();

    if (!item) {
        return (
            <Alert status="info" borderRadius="lg" fontSize="sm">
                <AlertIcon />
                Select an item to view details
            </Alert>
        );
    }

    const handleImplClick = (impl) => {
        navigate(`/${campus}/ati-explorer/implementations/${impl.type}/${impl.unique_id}`);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'None') return null;
        return new Date(dateString).toLocaleDateString();
    };

    const renderPersonBadge = (person, label) => {
        if (!person) return null;
        return (
            <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>
                    {label}
                </Text>
                <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                    {person.name}
                </Badge>
                {person.email && (
                    <Text fontSize="xs" color="gray.500" mt={1}>{person.email}</Text>
                )}
            </Box>
        );
    };

    const renderDocumentFields = () => {
        switch (documentType) {
            case 'documents':
                return (
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Name</Text>
                            <Text fontSize="sm" color="gray.700">{item.name || 'Untitled'}</Text>
                        </Box>
                        {item.description && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Description</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.description}</Text>
                            </Box>
                        )}
                        {item.uri_path && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>URI</Text>
                                <Link href={item.uri_path} isExternal fontSize="sm" color="teal.600">
                                    {item.uri_path} <ExternalLinkIcon mx="2px" />
                                </Link>
                            </Box>
                        )}
                        {item.file_path && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>File Path</Text>
                                <Text fontSize="sm" color="gray.600" fontFamily="mono">{item.file_path}</Text>
                            </Box>
                        )}
                        <HStack spacing={4}>
                            {item.is_administrative_review_documentation === 'true' && (
                                <Badge colorScheme="purple" fontSize="xs">Admin Review Doc</Badge>
                            )}
                            {item.is_milestone_and_measures_documentation === 'true' && (
                                <Badge colorScheme="orange" fontSize="xs">Milestone & Measures</Badge>
                            )}
                            {item.depreciated && (
                                <Badge colorScheme="red" fontSize="xs">
                                    Deprecated{item.depreciated_date ? ` ${formatDate(item.depreciated_date)}` : ''}
                                </Badge>
                            )}
                        </HStack>
                        {renderPersonBadge(item.maintained_by, 'Maintained By')}
                    </VStack>
                );

            case 'webpages':
                return (
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Name</Text>
                            <Text fontSize="sm" color="gray.700">{item.name || 'Untitled'}</Text>
                        </Box>
                        {item.description && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Description</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.description}</Text>
                            </Box>
                        )}
                        {item.url && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>URL</Text>
                                <Link href={item.url} isExternal fontSize="sm" color="teal.600">
                                    {item.url} <ExternalLinkIcon mx="2px" />
                                </Link>
                            </Box>
                        )}
                        <HStack spacing={4}>
                            {item.no_longer_exists && <Badge colorScheme="red" fontSize="xs">No Longer Exists</Badge>}
                            {item.depreciated && (
                                <Badge colorScheme="red" fontSize="xs">
                                    Deprecated{item.depreciated_date ? ` ${formatDate(item.depreciated_date)}` : ''}
                                </Badge>
                            )}
                        </HStack>
                        {renderPersonBadge(item.maintained_by, 'Maintained By')}
                    </VStack>
                );

            case 'notes':
                return (
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Name</Text>
                            <Text fontSize="sm" color="gray.700">{item.name || 'Untitled'}</Text>
                        </Box>
                        {item.content && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Content</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.content}</Text>
                            </Box>
                        )}
                        {item.date_created && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Date Created</Text>
                                <Text fontSize="sm" color="gray.700">{formatDate(item.date_created)}</Text>
                            </Box>
                        )}
                        {item.depreciated && (
                            <Badge colorScheme="red" fontSize="xs" w="fit-content">Deprecated</Badge>
                        )}
                        {renderPersonBadge(item.created_by, 'Created By')}
                    </VStack>
                );

            case 'messages':
                return (
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Name</Text>
                            <Text fontSize="sm" color="gray.700">{item.name || 'Untitled'}</Text>
                        </Box>
                        {item.type && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Type</Text>
                                <Badge colorScheme="teal" fontSize="xs">{item.type}</Badge>
                            </Box>
                        )}
                        {item.content && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Content</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.content}</Text>
                            </Box>
                        )}
                        {item.uri_path && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>URI</Text>
                                <Link href={item.uri_path} isExternal fontSize="sm" color="teal.600">
                                    {item.uri_path} <ExternalLinkIcon mx="2px" />
                                </Link>
                            </Box>
                        )}
                        {item.date_created && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Date Created</Text>
                                <Text fontSize="sm" color="gray.700">{formatDate(item.date_created)}</Text>
                            </Box>
                        )}
                        {item.depreciated && (
                            <Badge colorScheme="red" fontSize="xs" w="fit-content">Deprecated</Badge>
                        )}
                        {renderPersonBadge(item.created_by, 'Created By')}
                    </VStack>
                );

            case 'metrics':
                return (
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Name</Text>
                            <Text fontSize="sm" color="gray.700">{item.name || 'Untitled'}</Text>
                        </Box>
                        {item.metric_type && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Metric Type</Text>
                                <Badge colorScheme="teal" fontSize="xs">{item.metric_type}</Badge>
                            </Box>
                        )}
                        {item.description && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Description</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.description}</Text>
                            </Box>
                        )}
                        {item.single_value && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Value</Text>
                                <Text fontSize="sm" color="gray.700" fontWeight="bold">{item.single_value}</Text>
                            </Box>
                        )}
                        {item.comment && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Comment</Text>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{item.comment}</Text>
                            </Box>
                        )}
                        {item.academic_year && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Academic Year</Text>
                                <Badge colorScheme="blue" fontSize="xs">{item.academic_year}</Badge>
                            </Box>
                        )}
                        {item.uri_path && (
                            <Box>
                                <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>URI</Text>
                                <Link href={item.uri_path} isExternal fontSize="sm" color="teal.600">
                                    {item.uri_path} <ExternalLinkIcon mx="2px" />
                                </Link>
                            </Box>
                        )}
                        {renderPersonBadge(item.created_by, 'Created By')}
                    </VStack>
                );

            default:
                return null;
        }
    };

    return (
        <VStack align="stretch" spacing={6}>
            {/* Properties */}
            <Box>
                <Heading size="sm" color="teal.700" mb={4}>Details</Heading>
                <Divider borderColor="gray.200" mb={4} />
                {renderDocumentFields()}
                {item.file?.download_url && (
                    <Box mt={4}>
                        <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>Attached File</Text>
                        <Link href={item.file.download_url} isExternal fontSize="sm" color="teal.600">
                            {item.file.original_filename || 'Download'} <ExternalLinkIcon mx="2px" />
                        </Link>
                        {item.file.size != null && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                {Math.max(1, Math.round(item.file.size / 1024))} KB
                            </Text>
                        )}
                    </Box>
                )}
            </Box>

            {/* Referenced By */}
            <Box>
                <Heading size="sm" color="teal.700" mb={3}>
                    Referenced By ({item.referenced_by?.length || 0})
                </Heading>
                <Divider borderColor="gray.200" mb={3} />
                {item.referenced_by?.length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                        {item.referenced_by.map((impl) => (
                            <Box
                                key={impl.unique_id}
                                p={3}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                bg="white"
                                cursor="pointer"
                                _hover={{ boxShadow: 'md', borderColor: 'teal.200' }}
                                transition="all 0.2s"
                                onClick={() => handleImplClick(impl)}
                            >
                                <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                        <Text fontSize="sm" color="teal.700" fontWeight="semibold">
                                            {impl.title}
                                        </Text>
                                        <Badge colorScheme="gray" fontSize="xs">
                                            {impl.type}
                                        </Badge>
                                    </VStack>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                ) : (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        No implementations reference this item
                    </Text>
                )}
            </Box>
        </VStack>
    );
}

export default DocumentDetailPanel;
