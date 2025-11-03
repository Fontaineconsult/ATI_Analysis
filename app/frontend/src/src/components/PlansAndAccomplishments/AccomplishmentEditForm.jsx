import React, { useState, useContext, useMemo } from 'react';
import {
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Button,
    useToast,
    Text,
    Box,
    Grid,
    GridItem,
    Heading,
    Badge
} from '@chakra-ui/react';
import { updateAccomplishment } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import YSECheckboxSelector from '../../services/utils/YSECheckboxSelector';

function AccomplishmentEditForm({ accomplishment, onClose, onSuccess }) {
    const { data } = useContext(DataContext);
    const { currentAcademicYear } = useContext(SettingsContext);

    // Initialize form with existing accomplishment data
    const [formData, setFormData] = useState({
        unique_id: accomplishment.unique_id,
        name: accomplishment.name || '',
        description: accomplishment.description || '',
        academic_year: accomplishment.academic_year || currentAcademicYear,
        advanced_goal_number: accomplishment.goalNumber || '',
        working_group: accomplishment.workingGroup || '',
        furthered_yse_identifiers: accomplishment.yse_identifiers || [] // Changed to array
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    // Get available academic years - memoized for performance
    const availableYears = useMemo(() => {
        const years = new Set();
        years.add(currentAcademicYear); // Always include current year

        // Extract unique years from data
        ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
            if (data[wg]?.goals) {
                data[wg].goals.forEach(goal => {
                    if (goal.indicators) {
                        goal.indicators.forEach(indicator => {
                            if (indicator.evidences) {
                                indicator.evidences.forEach(evidence => {
                                    const yearId = evidence.evidence?.properties?.year_identifier;
                                    if (yearId) {
                                        const year = yearId.split('_')[0]; // Extract year from identifier
                                        years.add(year);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        return Array.from(years).sort().reverse();
    }, [data, currentAcademicYear]);

    // Removed getAvailableYSEs - now handled by YSECheckboxSelector component

    // Get source plan info if accomplishment was created from a plan
    const sourcePlan = useMemo(() => {
        // This would need backend support to fetch the relationship
        // For now, return null
        return null;
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await updateAccomplishment(formData);
            toast({
                title: "Accomplishment updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            onSuccess();
        } catch (error) {
            toast({
                title: "Error updating accomplishment",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleYSEChange = (selectedIdentifiers) => {
        // Update formData with the selected YSE identifiers
        setFormData({
            ...formData,
            furthered_yse_identifiers: selectedIdentifiers
        });
    };

    return (
        <Grid templateColumns="2fr 1fr" gap={3}>
            {/* Left Column - Form */}
            <GridItem>
                <VStack spacing={2} align="stretch">
                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Name
                        </FormLabel>
                        <Input
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Description
                        </FormLabel>
                        <Textarea
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={4}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Academic Year
                        </FormLabel>
                        <Select
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.academic_year}
                            onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <YSECheckboxSelector
                        value={formData.furthered_yse_identifiers}
                        onChange={handleYSEChange}
                        isDisabled={isSubmitting}
                    />

                    <HStack justify="flex-end" pt={1}>
                        <Button
                            size="sm"
                            variant="outline"
                            borderColor="gray.300"
                            color="gray.700"
                            _hover={{
                                borderColor: "gray.400",
                                bg: "gray.50"
                            }}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                        >
                            Save Changes
                        </Button>
                    </HStack>
                </VStack>
            </GridItem>

            {/* Right Column - Related Information */}
            <GridItem>
                <Box
                    borderWidth="1px"
                    borderColor="gray.300"
                    borderRadius="lg"
                    p={3}
                    bg="white"
                    maxHeight="50vh"
                    overflowY="auto"
                    boxShadow="sm"
                >
                    <Heading
                        size="sm"
                        mb={2}
                        color="gray.800"
                        fontWeight="bold"
                        position="sticky"
                        top={-3}
                        bg="white"
                        pb={1}
                        borderBottomWidth="1px"
                        borderBottomColor="gray.200"
                    >
                        Accomplishment Details
                    </Heading>

                    <VStack spacing={3} align="stretch">
                        {/* Source Plan (if applicable) */}
                        {sourcePlan && (
                            <Box
                                p={2}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="green.300"
                                bg="green.50"
                            >
                                <Text fontWeight="bold" color="green.800" fontSize="sm" mb={1}>
                                    Created from Plan
                                </Text>
                                <Text color="gray.700" fontSize="xs">
                                    {sourcePlan.name}
                                </Text>
                            </Box>
                        )}

                        {/* Current Working Group */}
                        {formData.working_group && (
                            <Box
                                p={2}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="gray.300"
                                bg="gray.50"
                            >
                                <HStack justify="space-between">
                                    <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                                        Working Group
                                    </Text>
                                    <Badge colorScheme="purple" fontSize="xs">
                                        {formData.working_group}
                                    </Badge>
                                </HStack>
                            </Box>
                        )}

                        {/* Goal Information */}
                        {formData.advanced_goal_number && (
                            <Box
                                p={2}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="gray.300"
                                bg="gray.50"
                            >
                                <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                                    Goal {formData.advanced_goal_number}
                                </Text>
                            </Box>
                        )}

                        {/* Selected YSE Indicators */}
                        {formData.furthered_yse_identifiers.length > 0 && (
                            <Box
                                p={2}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor="purple.300"
                                bg="purple.50"
                            >
                                <Text fontWeight="bold" color="purple.800" fontSize="sm" mb={1}>
                                    Selected YSE ({formData.furthered_yse_identifiers.length})
                                </Text>
                                <VStack spacing={1} align="stretch">
                                    {formData.furthered_yse_identifiers.map(id => (
                                        <Badge key={id} colorScheme="purple" fontSize="xs">
                                            {id}
                                        </Badge>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    </VStack>
                </Box>
            </GridItem>
        </Grid>
    );
}

export default AccomplishmentEditForm;