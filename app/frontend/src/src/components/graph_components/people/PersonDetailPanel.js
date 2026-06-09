import React, { useState } from 'react';
import {
    Box,
    Button,
    Collapse,
    Divider,
    Heading,
    HStack,
    Text,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import PersonHeader from './PersonHeader';
import PersonYseList from './PersonYseList';
import RoleHoldingsEditor from './RoleHoldingsEditor';
import YseAssignmentSelector from '../../functional_components/YseAssignmentSelector';

/**
 * Right-column composition for the People Explorer.
 *
 * Composes:
 *   - PersonHeader            — identity + working groups + host campus
 *   - PersonYseList           — current YSE assignments with attached impls
 *   - YseAssignmentSelector   — reused via entityType="Person" to add more
 *
 * Props:
 *   person       Rich detail object from get_person_implementation_details.
 *   onChange()   Async; called after any assign/unassign so the container
 *                can refetch the person.
 *   placeholder  Optional ReactNode shown when no person is selected.
 */
function PersonDetailPanel({ person, onChange, placeholder }) {
    const { selectedYear } = useSettings();
    const [assignOpen, setAssignOpen] = useState(false);

    if (!person) {
        return (
            placeholder || (
                <Box
                    p={8}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="gray.50"
                    textAlign="center"
                >
                    <Text color="gray.500" fontSize="sm">
                        Select a person on the left to see their YSEs and implementations.
                    </Text>
                </Box>
            )
        );
    }

    const yses = Array.isArray(person.yearSuccessEvidences) ? person.yearSuccessEvidences : [];

    // YseAssignmentSelector expects { year_identifier, indicator_composite_key, campus }
    const currentLinks = yses.map((yse) => ({
        year_identifier: yse.year_identifier,
        indicator_composite_key: yse.indicator_composite_key,
        campus: yse.campus || null,
    }));

    return (
        <VStack align="stretch" spacing={4}>
            <PersonHeader person={person} />

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} boxShadow="sm">
                <HStack mb={3} justify="space-between" align="baseline">
                    <Heading as="h3" size="sm" color="teal.700">
                        Roles
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                        held + worked · PD coverage
                    </Text>
                </HStack>
                <RoleHoldingsEditor
                    employeeId={person.employee_id}
                    roles={Array.isArray(person.roles) ? person.roles : []}
                    participatedRoleHandles={Array.isArray(person.participatedRoleHandles) ? person.participatedRoleHandles : []}
                    onChange={onChange}
                />
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} boxShadow="sm">
                <HStack mb={3} justify="space-between" align="baseline">
                    <Heading as="h3" size="sm" color="teal.700">
                        Year Success Evidence
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                        {yses.length} assignment{yses.length === 1 ? '' : 's'}
                    </Text>
                </HStack>
                <PersonYseList
                    yses={yses}
                    personEmployeeId={person.employee_id}
                    onChange={onChange}
                />
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4} boxShadow="sm">
                <HStack justify="space-between" align="baseline">
                    <Heading as="h3" size="sm" color="teal.700">
                        Assign to additional YSEs
                    </Heading>
                    <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => setAssignOpen((o) => !o)}>
                        {assignOpen ? 'Hide' : 'Show'}
                    </Button>
                </HStack>
                <Collapse in={assignOpen} animateOpacity>
                    <Divider my={3} borderColor="gray.200" />
                    {selectedYear ? (
                        <YseAssignmentSelector
                            entityType="Person"
                            personEmployeeId={person.employee_id}
                            academicYear={selectedYear}
                            currentLinks={currentLinks}
                            onChange={onChange}
                        />
                    ) : (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                            No academic year selected.
                        </Text>
                    )}
                </Collapse>
            </Box>
        </VStack>
    );
}

export default PersonDetailPanel;
