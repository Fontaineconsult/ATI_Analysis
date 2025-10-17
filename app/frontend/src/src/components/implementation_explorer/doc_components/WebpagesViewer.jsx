import React, { useState, useContext } from 'react';
import {
    Box, VStack, Heading, Text, Badge, Link, HStack, Button, Input, Switch,
    FormControl, FormLabel, Flex, Collapse, useToast, Textarea, Select
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
    const { user, individuals } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();

    // Check if webpage is included for current year
    const isIncludedInCurrentYear = () => {
        if (!webpage?.relationship) return true; // Default to included for new webpages
        const { included_in_years = [], excluded_from_years = [] } = webpage.relationship;

        if (!included_in_years.length && !excluded_from_years.length) {
            return true;
        }

        return included_in_years.includes(currentAcademicYear) &&
            !excluded_from_years.includes(currentAcademicYear);
    };

    const [webpageData, setWebpageData] = useState({
        unique_id: webpage?.unique_id || '',
        url: webpage?.url || '',
        name: webpage?.name || '',
        description: webpage?.description || '',
        no_longer_exists: webpage?.no_longer_exists || false,
        depreciated: webpage?.depreciated || false,
        depreciated_date: webpage?.depreciated_date || '',
        include_in_report: webpage?.include_in_report ?? false,
        include_in_current_year: isIncludedInCurrentYear(),
        date_created: webpage?.date_created || new Date().toISOString().split('T')[0],
        maintainer_id: webpage?.maintained_by?.unique_id || ''
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
            await onSubmit({
                ...webpageData,
                academic_year: currentAcademicYear,
                include_in_year: webpageData.include_in_current_year
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sort individuals alphabetically
    const sortedIndividuals = individuals ?
        [...individuals].sort((a, b) => a.name.localeCompare(b.name)) :
        [];

    const currentMaintainer = webpage?.maintained_by;

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

            <FormControl mb={3}>
                <FormLabel fontSize="sm">
                    Maintained By
                    {currentMaintainer && !individuals && (
                        <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                            (Current: {currentMaintainer.name})
                        </Text>
                    )}
                </FormLabel>
                <Select
                    size="sm"
                    name="maintainer_id"
                    value={webpageData.maintainer_id}
                    onChange={handleChange}
                    placeholder="Select a maintainer"
                >
                    {currentMaintainer && !sortedIndividuals.find(p => p.unique_id === currentMaintainer.unique_id) && (
                        <option key={currentMaintainer.unique_id} value={currentMaintainer.unique_id}>
                            {currentMaintainer.name} {currentMaintainer.title ? `(${currentMaintainer.title})` : ''}
                        </option>
                    )}
                    {sortedIndividuals.map(person => (
                        <option key={person.unique_id} value={person.unique_id}>
                            {person.name} {person.title ? `(${person.title})` : ''}
                        </option>
                    ))}
                </Select>
            </FormControl>

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    {/* Year-specific inclusion */}
                    <FormControl mb={2}>
                        <HStack>
                            <Switch
                                size="sm"
                                name="include_in_current_year"
                                isChecked={webpageData.include_in_current_year}
                                onChange={handleChange}
                                colorScheme="teal"
                            />
                            <FormLabel fontSize="sm" mb={0} fontWeight="bold">
                                Include in {currentAcademicYear} Report
                            </FormLabel>
                        </HStack>
                    </FormControl>

                    {/* Global inclusion (optional) */}
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="include_in_report"
                                    isChecked={webpageData.include_in_report} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0} color="gray.600">
                                Include in All Reports (Global)
                            </FormLabel>
                        </HStack>
                    </FormControl>

                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="no_longer_exists"
                                    isChecked={webpageData.no_longer_exists} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>No Longer Exists</FormLabel>
                        </HStack>
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={2}>
                        <HStack>
                            <Switch size="sm" name="depreciated"
                                    isChecked={webpageData.depreciated} onChange={handleChange} />
                            <FormLabel fontSize="sm" mb={0}>Depreciated</FormLabel>
                        </HStack>
                    </FormControl>
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
    const { currentAcademicYear } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const handleAddWebpage = async (webpageData) => {
        try {
            const { maintainer_id, academic_year, include_in_year, ...webpageDataForAPI } = webpageData;

            await addWebpageToImplementation(
                implementation_id,
                implementation_type,
                webpageDataForAPI,
                maintainer_id,
                academic_year,
                include_in_year
            );

            toast({
                title: "Webpage added successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations();
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
            const { maintainer_id, academic_year, include_in_year, ...webpageDataForAPI } = webpageData;

            await updateWebpage(
                implementation_id,
                implementation_type,
                webpageDataForAPI,
                maintainer_id,
                academic_year,
                include_in_year
            );

            toast({
                title: "Webpage updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await refreshImplementations();
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

    // Helper to check if webpage is included in current year
    const isWebpageIncludedInCurrentYear = (wp) => {
        if (!wp.relationship) return wp.include_in_report !== false;
        const { included_in_years = [], excluded_from_years = [] } = wp.relationship;

        if (!included_in_years.length && !excluded_from_years.length) {
            return wp.include_in_report !== false;
        }

        return included_in_years.includes(currentAcademicYear) &&
            !excluded_from_years.includes(currentAcademicYear);
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

                                            {wp.maintained_by && (
                                                <Text fontSize="xs" color="gray.600" mt={1}>
                                                    Maintained by: {wp.maintained_by.name || 'Unknown'}
                                                </Text>
                                            )}

                                            <HStack mt={3} spacing={2} flexWrap="wrap">
                                                {wp.no_longer_exists === true && (
                                                    <Badge colorScheme="red" fontSize="xs">No Longer Exists</Badge>
                                                )}
                                                {wp.depreciated === true && (
                                                    <Badge colorScheme="orange" fontSize="xs">Depreciated</Badge>
                                                )}
                                                {isWebpageIncludedInCurrentYear(wp) && (
                                                    <Badge colorScheme="green" fontSize="xs">
                                                        In {currentAcademicYear} Report
                                                    </Badge>
                                                )}
                                                {wp.include_in_report !== false && (
                                                    <Badge colorScheme="gray" fontSize="xs">Global Include</Badge>
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