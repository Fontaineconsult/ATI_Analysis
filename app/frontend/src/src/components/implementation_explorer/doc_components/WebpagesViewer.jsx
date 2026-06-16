import React, { useState, useContext } from 'react';
import { Badge, Box, Collapse, HStack, Heading, Link, Text, VStack, WrapItem, useToast } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { addWebpageToImplementation } from '../../../services/api/post';
import { updateWebpage } from '../../../services/api/put';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import {
    AddRow, EmptyText, Field, FieldLabel, FormActions, FormShell,
    ItemShell, MetaLine, ReportBadges, SwitchRow,
} from './docPrimitives';

function WebpageForm({ webpage, onSubmit, onCancel, isNewWebpage }) {
    const { individuals } = useContext(UserContext);
    const { currentAcademicYear } = useSettings();

    const isIncludedInCurrentYear = () => {
        if (!webpage?.relationship) return true;
        const { included_in_years = [], excluded_from_years = [] } = webpage.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return true;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
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
        maintainer_id: webpage?.maintained_by?.unique_id || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setWebpageData({ ...webpageData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ ...webpageData, academic_year: currentAcademicYear, include_in_year: webpageData.include_in_current_year });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedIndividuals = individuals ? [...individuals].sort((a, b) => a.name.localeCompare(b.name)) : [];
    const currentMaintainer = webpage?.maintained_by;
    const maintainerOptions = (
        <>
            {currentMaintainer && !sortedIndividuals.find((p) => p.unique_id === currentMaintainer.unique_id) && (
                <option value={currentMaintainer.unique_id}>
                    {currentMaintainer.name} {currentMaintainer.title ? `(${currentMaintainer.title})` : ''}
                </option>
            )}
            {sortedIndividuals.map((person) => (
                <option key={person.unique_id} value={person.unique_id}>
                    {person.name} {person.title ? `(${person.title})` : ''}
                </option>
            ))}
        </>
    );

    return (
        <FormShell onSubmit={handleSubmit}>
            <Field label="URL" name="url" type="url" value={webpageData.url} onChange={handleChange} isRequired />
            <Field label="Name" name="name" value={webpageData.name} onChange={handleChange} isRequired />
            <Field as="textarea" label="Description" name="description" value={webpageData.description} onChange={handleChange} rows={2} />
            <Field as="select" label="Maintained By" name="maintainer_id" value={webpageData.maintainer_id} onChange={handleChange} placeholder="Select a maintainer" options={maintainerOptions} />
            <Box>
                <FieldLabel mb={2}>Flags</FieldLabel>
                <VStack align="stretch" spacing={1.5}>
                    <SwitchRow name="include_in_current_year" label={`Include in ${currentAcademicYear} report`} isChecked={webpageData.include_in_current_year} onChange={handleChange} emphasize />
                    <SwitchRow name="include_in_report" label="Include in all reports (global)" isChecked={webpageData.include_in_report} onChange={handleChange} colorScheme="gray" />
                    <SwitchRow name="no_longer_exists" label="No longer exists" isChecked={webpageData.no_longer_exists} onChange={handleChange} colorScheme="red" />
                    <SwitchRow name="depreciated" label="Depreciated" isChecked={webpageData.depreciated} onChange={handleChange} colorScheme="orange" />
                </VStack>
                {webpageData.depreciated && (
                    <Box mt={2}>
                        <Field label="Depreciation Date" name="depreciated_date" type="date" value={webpageData.depreciated_date} onChange={handleChange} />
                    </Box>
                )}
            </Box>
            <FormActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel={isNewWebpage ? 'Add Webpage' : 'Update Webpage'} loadingText={isNewWebpage ? 'Adding…' : 'Updating…'} />
        </FormShell>
    );
}

export default function WebpagesViewer({ webpages = [], implementation_id, implementation_type }) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { refreshImplementations } = useContext(DataContext);
    const { currentAcademicYear } = useSettings();
    const toast = useToast();
    const canManage = Boolean(implementation_id && implementation_type);

    const handleAddWebpage = async (webpageData) => {
        try {
            const { maintainer_id, academic_year, include_in_year, ...webpageDataForAPI } = webpageData;
            await addWebpageToImplementation(implementation_id, implementation_type, webpageDataForAPI, maintainer_id, academic_year, include_in_year);
            toast({ title: 'Webpage added', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setIsAddingNew(false);
        } catch (error) {
            toast({ title: 'Error adding webpage', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleUpdateWebpage = async (webpageData, index) => {
        try {
            const { maintainer_id, academic_year, include_in_year, ...webpageDataForAPI } = webpageData;
            await updateWebpage(implementation_id, implementation_type, webpageDataForAPI, maintainer_id, academic_year, include_in_year);
            toast({ title: 'Webpage updated', status: 'success', duration: 3000, isClosable: true });
            await refreshImplementations();
            setEditingIndex(null);
        } catch (error) {
            toast({ title: 'Error updating webpage', description: error.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    const isIncludedInCurrentYear = (wp) => {
        if (!wp.relationship) return wp.include_in_report !== false;
        const { included_in_years = [], excluded_from_years = [] } = wp.relationship;
        if (!included_in_years.length && !excluded_from_years.length) return wp.include_in_report !== false;
        return included_in_years.includes(currentAcademicYear) && !excluded_from_years.includes(currentAcademicYear);
    };

    return (
        <Box>
            <AddRow onAdd={() => { setIsAddingNew(true); setEditingIndex(null); }} label="Add Webpage" canAdd={canManage} isAdding={isAddingNew} />

            {isAddingNew && (
                <Box mb={3}>
                    <WebpageForm webpage={null} onSubmit={handleAddWebpage} onCancel={() => setIsAddingNew(false)} isNewWebpage />
                </Box>
            )}

            {webpages.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {webpages.map((wp, index) => (
                        <Box key={wp.unique_id || index}>
                            <Collapse in={editingIndex === index} animateOpacity>
                                <Box mb={2}>
                                    <WebpageForm webpage={wp} onSubmit={(data) => handleUpdateWebpage(data, index)} onCancel={() => setEditingIndex(null)} isNewWebpage={false} />
                                </Box>
                            </Collapse>
                            <Collapse in={editingIndex !== index} animateOpacity>
                                <ItemShell
                                    titleNode={
                                        <Link href={wp.url} isExternal color="teal.700" minW={0}>
                                            <HStack spacing={1} minW={0}>
                                                <Heading as="h3" fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                                    {wp.name || wp.url}
                                                </Heading>
                                                <ExternalLinkIcon boxSize={3} flexShrink={0} />
                                            </HStack>
                                        </Link>
                                    }
                                    onEdit={() => { setEditingIndex(index); setIsAddingNew(false); }}
                                    canEdit={canManage}
                                >
                                    {wp.description && <Text fontSize="xs" color="gray.600" noOfLines={2}>{wp.description}</Text>}
                                    {wp.maintained_by && <MetaLine>Maintained by {wp.maintained_by.name || 'Unknown'}</MetaLine>}
                                    <ReportBadges
                                        inYear={isIncludedInCurrentYear(wp)}
                                        year={currentAcademicYear}
                                        global={wp.include_in_report !== false}
                                        depreciated={wp.depreciated === true}
                                        extra={wp.no_longer_exists === true && <WrapItem><Badge colorScheme="red" fontSize="2xs">No Longer Exists</Badge></WrapItem>}
                                    />
                                </ItemShell>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            ) : (
                <EmptyText>No webpages attached.</EmptyText>
            )}
        </Box>
    );
}
