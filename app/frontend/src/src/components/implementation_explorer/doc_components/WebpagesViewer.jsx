import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast, Textarea
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { addWebpageToImplementation } from '../../../services/api/post';
import { updateWebpage } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

function WebpageForm({ webpage, onSubmit, onCancel, isNewWebpage }) {
    const { user } = useContext(UserContext);
    const [webpageData, setWebpageData] = useState({
        unique_id: webpage?.unique_id || '',
        url: webpage?.url || '',
        name: webpage?.name || '',
        description: webpage?.description || '',
        no_longer_exists: webpage?.no_longer_exists || false,
        depreciated: webpage?.depreciated || false,
        depreciated_date: webpage?.depreciated_date || '',
        include_in_report: webpage?.include_in_report ?? true,
        date_created: webpage?.date_created || new Date().toISOString().split('T')[0],
        created_by: user || {}
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWebpageData({
            ...webpageData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(webpageData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="teal.300">
            <FormControl mb={3}>
                <FormLabel fontSize="sm">URL</FormLabel>
                <Input size="sm" name="url" type="url" value={webpageData.url} onChange={handleChange} required />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Name</FormLabel>
                <Input size="sm" name="name" value={webpageData.name} onChange={handleChange} required />
            </FormControl>

            <FormControl mb={3}>
                <FormLabel fontSize="sm">Description</FormLabel>
                <Textarea size="sm" name="description" value={webpageData.description} onChange={handleChange} rows={2} />
            </FormControl>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={webpageData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Include in Report</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="no_longer_exists"
                                    isChecked={webpageData.no_longer_exists} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>No Longer Exists</FormLabel>
                        </HStack>
                    </FormControl>
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={webpageData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    {webpageData.depreciated && (
                        <FormControl>
                            <FormLabel fontSize="sm">Depreciation Date</FormLabel>
                            <Input size="sm" type="date" name="depreciated_date"
                                   value={webpageData.depreciated_date} onChange={handleChange} />
                        </FormControl>
                    )}
                </Box>
            </Flex>

            <HStack spacing={2}>
                <Button size="sm" type="submit" colorScheme="teal"
                        isLoading={isSubmitting} loadingText={isNewWebpage ? 'Adding...' : 'Updating...'}>
                    {isNewWebpage ? 'Add Webpage' : 'Update Webpage'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
                    Cancel
                </Button>
            </HStack>
        </Box>
    );
}

export default function WebpagesViewer({ webpages = [], implementation_id, implementation_type }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddWebpage = async (webpageData) => {
        try {
            await addWebpageToImplementation(
                implementation_id,
                implementation_type,
                webpageData,
                user?.employee_id || ''
            );

            toast({
                title: "Webpage added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations()
            setIsAddingNew(false);
        } catch (error) {
            toast({
                title: "Error adding webpage",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleUpdateWebpage = async (webpageData, index) => {
        try {
            await updateWebpage(
                implementation_id,
                implementation_type,
                webpageData,
                user?.employee_id || ''
            );

            toast({
                title: "Webpage updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations()
            setEditingIndex(null);
        } catch (error) {
            toast({
                title: "Error updating webpage",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <HStack justify="space-between" mb={3}>
                <Heading size="sm" color="gray.700" fontWeight="bold">
                    Webpages ({webpages.length || 0})
                </Heading>
                {implementation_id && implementation_type && (
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => {setIsAddingNew(true); setEditingIndex(null);}}
                        isDisabled={isAddingNew}
                    >
                        Add Webpage
                    </Button>
                )}
            </HStack>

            {isAddingNew && (
                <Box mb={4}>
                    <WebpageForm
                        webpage={null}
                        onSubmit={handleAddWebpage}
                        onCancel={() => setIsAddingNew(false)}
                        isNewWebpage={true}
                    />
                </Box>
            )}

            {webpages.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                    {webpages.map((wp, index) => (
                        <Box key={wp.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={3}>
                                    <WebpageForm
                                        webpage={wp}
                                        onSubmit={(data) => handleUpdateWebpage(data, index)}
                                        onCancel={() => setEditingIndex(null)}
                                        isNewWebpage={false}
                                    />
                                </Box>
                            </Collapse>

                            <Collapse in={editingIndex !== index} animateOpacity>
                                <Box
                                    p={4}
                                    bg="white"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="teal.300"
                                    boxShadow="sm"
                                    _hover={{ boxShadow: 'md' }}
                                    transition="box-shadow 0.2s"
                                >
                                    <HStack justify="space-between" align="start">
                                        <Box flex="1">
                                            <Link href={wp.url} isExternal color="teal.600">
                                                <HStack>
                                                    <Heading as='h3' fontSize="sm" fontWeight="bold">
                                                        {wp.name || wp.url}
                                                    </Heading>
                                                    <ExternalLinkIcon />
                                                </HStack>
                                            </Link>

                                            {wp.description && (
                                                <Text fontSize="xs" color="gray.700" mt={2}>
                                                    {wp.description}
                                                </Text>
                                            )}

                                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                                {(wp.no_longer_exists === true) && (
                                                    <Badge colorScheme="red" fontSize="xs">No Longer Exists</Badge>
                                                )}
                                                {(wp.depreciated === true) && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
                                                )}
                                                {(wp.include_in_report !== false) && (
                                                    <Badge colorScheme="green" fontSize="xs">In Report</Badge>
                                                )}
                                            </HStack>
                                        </Box>

                                        {implementation_id && implementation_type && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorScheme="blue"
                                                onClick={() => {setEditingIndex(index); setIsAddingNew(false);}}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </HStack>
                                </Box>
                            </Collapse>
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