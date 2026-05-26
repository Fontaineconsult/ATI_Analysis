import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Button,
    Text,
    Flex,
    Collapse,
    Link,
    HStack,
    VStack,
    Badge,
    IconButton,
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { updateWebpage } from '../../../services/api/put';
import { addWebpageToImplementation } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import WebsiteForm from './WebsiteForm';

function WebsiteViewer({ websites, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewWebsite, setIsAddingNewWebsite] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = async (index, websiteData, isNew) => {
        try {
            let response;

            if (isNew) {
                websiteData.date_created = new Date().toISOString().split('T')[0];
                response = await addWebpageToImplementation(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            } else {
                response = await updateWebpage(
                    implementation_id,
                    implementation_type,
                    websiteData,
                    user?.properties || user
                );
            }

            toast({
                title: "Success",
                description: response.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setExpandedIndex(null);
            setIsAddingNewWebsite(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "An unexpected error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <Button
                size="xs"
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewWebsite(true);
                    setExpandedIndex(null);
                }}
                mb={3}
            >
                Add New Website
            </Button>

            {isAddingNewWebsite && (
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <WebsiteForm
                        website={null}
                        onSubmit={(websiteData) => handleFormSubmit(null, websiteData, true)}
                        createdBy={user?.properties || user}
                        isNewWebsite={true}
                        onCancel={() => setIsAddingNewWebsite(false)}
                    />
                </Box>
            )}

            {websites && websites.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {websites.map((webWrapper, index) => {
                        const website = webWrapper.webpage || webWrapper;
                        const createdByPerson = webWrapper.created_by?.properties || website.created_by?.properties;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={website.properties.unique_id || index}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                bg="white"
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                                transition="all 0.2s"
                            >
                                {/* Compact view */}
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex="1">
                                        {/* Title row with status badges */}
                                        <HStack spacing={2} width="full" flexWrap="wrap">
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {website.properties.name || 'Untitled Website'}
                                            </Text>
                                            {website.properties.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {website.properties.no_longer_exists && (
                                                <Badge colorScheme="red" fontSize="10px">404</Badge>
                                            )}
                                            {website.properties.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                        </HStack>

                                        {/* URL and description */}
                                        <HStack spacing={3} fontSize="xs" width="full">
                                            <Link
                                                href={website.properties.url}
                                                isExternal
                                                color="teal.600"
                                                display="flex"
                                                alignItems="center"
                                                maxW="300px"
                                                isTruncated
                                            >
                                                {website.properties.url} <ExternalLinkIcon ml={1} />
                                            </Link>
                                            {createdByPerson && (
                                                <Text color="gray.500">
                                                    By: {createdByPerson.name}
                                                </Text>
                                            )}
                                        </HStack>

                                        {website.properties.description && (
                                            <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                                {website.properties.description}
                                            </Text>
                                        )}
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit website"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleEdit(index)}
                                        ml={2}
                                    />
                                </Flex>

                                {/* Collapsible edit form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <WebsiteForm
                                            website={website}
                                            onSubmit={(websiteData) => handleFormSubmit(index, websiteData, false)}
                                            createdBy={createdByPerson}
                                            isNewWebsite={false}
                                            onCancel={() => toggleEdit(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.500" fontSize="sm">No websites available.</Text>
            )}
        </Box>
    );
}

export default WebsiteViewer;