import React, { useState, useEffect } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Link,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    Checkbox,
    Text,
    Textarea,
    VStack,
    useToast,
    CheckboxGroup,
    Divider
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { updateIndividual } from '../../../services/api/put';
import { createIndividual, addPositionDescription } from '../../../services/api/post';
import { getPositionDescriptions } from '../../../services/api/get';
import { deletePositionDescription } from '../../../services/api/delete';
import { useSettings } from '../../../context/SettingsContext';
import { WORKING_GROUPS, WORKING_GROUP_ORDER } from '../../graph_components/people/peopleConfig';
import FileUploadField from '../../implementation_explorer/doc_components/FileUploadField';

const EditIndividual = ({ isOpen, onClose, individualData, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        employee_id: '',
        email: '',
        title: '',
        ati_role: '',
        host_campus: '',
        active: true,
        non_committee_member_active: false,
        can_approve_yse: false,
        workingGroups: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { campuses, campusesLoading } = useSettings();

    const isEditMode = Boolean(individualData);

    // Position descriptions attach directly to the person and save immediately,
    // independent of the main form submit (the person must already exist).
    const [positionDescriptions, setPositionDescriptions] = useState([]);
    const [pdLoading, setPdLoading] = useState(false);
    const [pdSaving, setPdSaving] = useState(false);
    const [pdName, setPdName] = useState('');
    const [pdEffectiveDate, setPdEffectiveDate] = useState('');
    const [pdNotes, setPdNotes] = useState('');
    const [pdFile, setPdFile] = useState(null);

    const employeeId = individualData?.employee_id;

    useEffect(() => {
        if (!isOpen || !isEditMode || !employeeId) {
            setPositionDescriptions([]);
            return undefined;
        }
        let cancelled = false;
        setPdLoading(true);
        getPositionDescriptions(employeeId)
            .then((items) => { if (!cancelled) setPositionDescriptions(items); })
            .catch(() => { if (!cancelled) setPositionDescriptions([]); })
            .finally(() => { if (!cancelled) setPdLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, isEditMode, employeeId]);

    const handleAddPositionDescription = async () => {
        const name = pdName.trim() || pdFile?.original_filename || '';
        if (!name) return;
        setPdSaving(true);
        try {
            await addPositionDescription(employeeId, {
                name,
                ...(pdNotes.trim() ? { description: pdNotes.trim() } : {}),
                ...(pdEffectiveDate ? { effective_date: pdEffectiveDate } : {}),
                ...(pdFile || {}),
            });
            toast({
                title: 'Position description added.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
            setPdName('');
            setPdEffectiveDate('');
            setPdNotes('');
            setPdFile(null);
            setPositionDescriptions(await getPositionDescriptions(employeeId));
        } catch (error) {
            toast({
                title: 'Error adding position description.',
                description: error.message || 'An error occurred.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setPdSaving(false);
        }
    };

    const handleRemovePositionDescription = async (uniqueId) => {
        try {
            await deletePositionDescription(uniqueId);
            setPositionDescriptions((prev) => prev.filter((pd) => pd.unique_id !== uniqueId));
        } catch (error) {
            toast({
                title: 'Error removing position description.',
                description: error.message || 'An error occurred.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        if (isEditMode) {
            setFormData({ host_campus: '', ...individualData });
        } else {
            // Clear form data for create mode
            setFormData({
                name: '',
                employee_id: '',
                email: '',
                title: '',
                ati_role: '',
                host_campus: '',
                active: true,
                non_committee_member_active: false,
                can_approve_yse: false,
                workingGroups: [],
            });
        }
    }, [individualData, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleWorkingGroupChange = (wgName, isChecked) => {
        setFormData((prev) => {
            const prevWorkingGroups = Array.isArray(prev.workingGroups) ? prev.workingGroups : [];

            let updatedWorkingGroups;
            if (isChecked) {
                // Add working group if not already present
                if (!prevWorkingGroups.some((wg) => wg.name === wgName)) {
                    updatedWorkingGroups = [...prevWorkingGroups, { name: wgName }];
                } else {
                    updatedWorkingGroups = prevWorkingGroups;
                }
            } else {
                // Remove working group
                updatedWorkingGroups = prevWorkingGroups.filter((wg) => wg.name !== wgName);
            }

            return { ...prev, workingGroups: updatedWorkingGroups };
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await updateIndividual(formData);
                toast({
                    title: 'Individual updated successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } else {
                await createIndividual(formData);
                toast({
                    title: 'Individual created successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            }
            onSave(); // Callback to refresh data in parent component
            onClose(); // Close the modal
        } catch (error) {
            toast({
                title: 'Error saving individual.',
                description: error.message || 'An error occurred.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader color="gray.800" fontWeight="bold">
                    {isEditMode ? 'Edit Individual' : 'Add Individual'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Name
                            </FormLabel>
                            <Input
                                size="sm"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter name"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Employee ID
                            </FormLabel>
                            <Input
                                size="sm"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                placeholder="Enter employee ID"
                                isReadOnly={isEditMode}
                                borderColor="gray.300"
                                bg={isEditMode ? "gray.50" : "white"}
                                _hover={{ borderColor: isEditMode ? "gray.300" : "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Email
                            </FormLabel>
                            <Input
                                size="sm"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Title
                            </FormLabel>
                            <Input
                                size="sm"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter title"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                ATI Role
                            </FormLabel>
                            <Input
                                size="sm"
                                name="ati_role"
                                value={formData.ati_role}
                                onChange={handleInputChange}
                                placeholder="Enter ATI role"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Host Campus
                            </FormLabel>
                            <Select
                                size="sm"
                                name="host_campus"
                                value={formData.host_campus || ''}
                                onChange={handleInputChange}
                                placeholder={campusesLoading ? 'Loading campuses…' : 'Select a campus'}
                                isDisabled={campusesLoading}
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            >
                                {campuses.map((c) => (
                                    <option key={c.abbreviation} value={c.abbreviation}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={3}>
                                Status Options
                            </FormLabel>
                            <VStack align="start" spacing={2}>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="active"
                                    isChecked={formData.active}
                                    onChange={handleInputChange}
                                >
                                    Active Member
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="non_committee_member_active"
                                    isChecked={formData.non_committee_member_active}
                                    onChange={handleInputChange}
                                >
                                    Active Non-Committee Member
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="can_approve_yse"
                                    isChecked={formData.can_approve_yse}
                                    onChange={handleInputChange}
                                >
                                    Can Approve YSE
                                </Checkbox>
                            </VStack>
                        </FormControl>

                        <Divider />

                        <CheckboxGroup>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={3}>
                                Working Groups
                            </FormLabel>
                            <VStack align="start" spacing={2}>
                                {WORKING_GROUP_ORDER.map((key) => {
                                    const wg = WORKING_GROUPS[key];
                                    return (
                                        <Checkbox
                                            key={wg.key}
                                            size="sm"
                                            colorScheme="teal"
                                            isChecked={formData.workingGroups?.some((w) => w.name === wg.name)}
                                            onChange={(e) => handleWorkingGroupChange(wg.name, e.target.checked)}
                                        >
                                            {wg.name}
                                        </Checkbox>
                                    );
                                })}
                            </VStack>
                        </CheckboxGroup>

                        {isEditMode && (
                            <>
                                <Divider />

                                <FormControl>
                                    <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={3}>
                                        Position Description
                                    </FormLabel>
                                    {pdLoading ? (
                                        <Text fontSize="sm" color="gray.600">Loading…</Text>
                                    ) : (
                                        <VStack align="stretch" spacing={2}>
                                            {positionDescriptions.length === 0 && (
                                                <Text fontSize="sm" color="gray.600">
                                                    No position description on file.
                                                </Text>
                                            )}
                                            {positionDescriptions.map((pd) => (
                                                <HStack
                                                    key={pd.unique_id}
                                                    justify="space-between"
                                                    borderWidth="1px"
                                                    borderColor="gray.200"
                                                    borderRadius="md"
                                                    px={2}
                                                    py={1}
                                                >
                                                    <Box>
                                                        <HStack spacing={2}>
                                                            {pd.file?.download_url ? (
                                                                <Link
                                                                    href={pd.file.download_url}
                                                                    isExternal
                                                                    color="teal.600"
                                                                    fontSize="sm"
                                                                    display="flex"
                                                                    alignItems="center"
                                                                >
                                                                    {pd.name}
                                                                    <ExternalLinkIcon ml={1} />
                                                                </Link>
                                                            ) : (
                                                                <Text fontSize="sm">{pd.name}</Text>
                                                            )}
                                                            {pd.depreciated && (
                                                                <Badge colorScheme="gray" fontSize="xs">
                                                                    Superseded
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                        {pd.effective_date && (
                                                            <Text fontSize="xs" color="gray.600">
                                                                Effective {pd.effective_date}
                                                            </Text>
                                                        )}
                                                        {pd.description && (
                                                            <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                                                {pd.description}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={() => handleRemovePositionDescription(pd.unique_id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    )}
                                </FormControl>

                                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                                    <VStack align="stretch" spacing={3}>
                                        <FileUploadField
                                            value={pdFile}
                                            onUploaded={setPdFile}
                                            onClear={() => setPdFile(null)}
                                            label="PD Document"
                                        />
                                        <FormControl>
                                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                                Name
                                            </FormLabel>
                                            <Input
                                                size="sm"
                                                value={pdName}
                                                onChange={(e) => setPdName(e.target.value)}
                                                placeholder={pdFile?.original_filename || 'e.g. Alt Media Coordinator PD'}
                                                borderColor="gray.300"
                                                _hover={{ borderColor: "gray.400" }}
                                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                                            />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                                Effective Date
                                            </FormLabel>
                                            <Input
                                                size="sm"
                                                type="date"
                                                value={pdEffectiveDate}
                                                onChange={(e) => setPdEffectiveDate(e.target.value)}
                                                borderColor="gray.300"
                                                _hover={{ borderColor: "gray.400" }}
                                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                                            />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                                Notes About the Job
                                            </FormLabel>
                                            <Textarea
                                                size="sm"
                                                value={pdNotes}
                                                onChange={(e) => setPdNotes(e.target.value)}
                                                placeholder="What the position covers, context on the PD"
                                                borderColor="gray.300"
                                                _hover={{ borderColor: "gray.400" }}
                                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                                            />
                                        </FormControl>
                                        <Button
                                            size="sm"
                                            colorScheme="teal"
                                            variant="outline"
                                            onClick={handleAddPositionDescription}
                                            isLoading={pdSaving}
                                            isDisabled={!pdFile && !pdName.trim()}
                                        >
                                            Add Position Description
                                        </Button>
                                    </VStack>
                                </Box>
                            </>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onClose}
                        mr={3}
                        borderColor="gray.300"
                        _hover={{ bg: "gray.50" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={!formData.name || !formData.employee_id}
                    >
                        {isEditMode ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditIndividual;