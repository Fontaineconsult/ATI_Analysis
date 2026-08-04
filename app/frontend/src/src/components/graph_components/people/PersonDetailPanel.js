import React, { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Collapse,
    Divider,
    HStack,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { useData } from '../../../hooks/useData';
import Card from '../common/Card';
import Section from '../common/Section';
import PersonHeader from './PersonHeader';
import PersonYseList from './PersonYseList';
import RoleHoldingsEditor from './RoleHoldingsEditor';
import YseAssignmentSelector from '../../functional_components/YseAssignmentSelector';
import { personCommunities } from './peopleConfig';
// Participation types ARE implementation types — reuse that domain's color map.
import { typeColor } from '../implementation/implementationConfig';

/**
 * Right-column composition for the People Explorer.
 *
 * Composes:
 *   - PersonHeader            — identity + working groups + approver + campus + Edit
 *   - Roles                   — RoleHoldingsEditor (held + worked, PD coverage)
 *   - Working Team            — the Process/Project/Procedure/Service nodes the
 *                               person is a participant of (worked_on edges)
 *   - Year Success Evidence   — implementor assignments + attached impls
 *   - Employed By             — org units that employ the person
 *   - Assign to additional YSEs — YseAssignmentSelector (entityType="Person")
 *
 * Props:
 *   person       Rich detail from get_person_implementation_details.
 *   onChange()   Async; called after any assign/unassign so the container refetches.
 *   onEdit()     Optional; opens the PersonForm edit modal (rendered by the container).
 *   placeholder  Optional ReactNode shown when no person is selected.
 */
function PersonDetailPanel({ person, onChange, onEdit, placeholder }) {
    // The active academic year lives on DataContext (it drives all year-scoped
    // data loading) — SettingsContext has no selectedYear.
    const { selectedYear } = useData();
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
                    <Text color="gray.600" fontSize="sm">
                        Select a person on the left to see their roles, working team, and YSEs.
                    </Text>
                </Box>
            )
        );
    }

    const yses = Array.isArray(person.yearSuccessEvidences) ? person.yearSuccessEvidences : [];
    const participations = Array.isArray(person.participations) ? person.participations : [];
    const employers = Array.isArray(person.employers) ? person.employers : [];

    // YseAssignmentSelector expects { year_identifier, indicator_composite_key, campus }
    const currentLinks = yses.map((yse) => ({
        year_identifier: yse.year_identifier,
        indicator_composite_key: yse.indicator_composite_key,
        campus: yse.campus || null,
    }));

    return (
        <VStack align="stretch" spacing={4}>
            <PersonHeader person={person} onEdit={onEdit} />

            <Card title="Roles" action={<Text fontSize="2xs" color="gray.600">held + worked · PD coverage</Text>}>
                <RoleHoldingsEditor
                    employeeId={person.employee_id}
                    roles={Array.isArray(person.roles) ? person.roles : []}
                    participatedRoleHandles={Array.isArray(person.participatedRoleHandles) ? person.participatedRoleHandles : []}
                    onChange={onChange}
                />
            </Card>

            {/* Working Team — implementations the person is a participant of (worked_on) */}
            {participations.length > 0 && (
                <Section title={`Working Team (${participations.length})`}>
                    <VStack align="stretch" spacing={1}>
                        {participations.map((pt) => (
                            <HStack
                                key={pt.unique_id || `${pt.type}-${pt.title}`}
                                spacing={2}
                                px={2}
                                py={1.5}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                            >
                                <Badge colorScheme={typeColor(pt.type)} fontSize="2xs" flexShrink={0}>{pt.type}</Badge>
                                <Text fontSize="sm" color="gray.800" noOfLines={1} flex="1" minW={0}>{pt.title}</Text>
                                {pt.role_handle && (
                                    <Badge colorScheme="gray" variant="subtle" fontSize="2xs" flexShrink={0}>{pt.role_handle}</Badge>
                                )}
                            </HStack>
                        ))}
                    </VStack>
                </Section>
            )}

            <Card
                title="Year Success Evidence"
                action={<Text fontSize="2xs" color="gray.600">{yses.length} assignment{yses.length === 1 ? '' : 's'}</Text>}
            >
                <PersonYseList yses={yses} personEmployeeId={person.employee_id} onChange={onChange} />
            </Card>

            {/* Communities of practice — read-only here; membership is managed on
                the Communities tab (or via the MCP set_communities action). */}
            {personCommunities(person).length > 0 && (
                <Section title="Communities of Practice">
                    <VStack align="stretch" spacing={1}>
                        {personCommunities(person).map((c) => (
                            <HStack key={c.unique_id} spacing={2} px={2} py={1.5}
                                    borderWidth="1px" borderColor="gray.200" borderRadius="md" align="start">
                                <Badge colorScheme="teal" variant="subtle" fontSize="2xs" flexShrink={0}>
                                    {c.name}
                                </Badge>
                                {c.note && <Text fontSize="xs" color="gray.600" minW={0}>{c.note}</Text>}
                            </HStack>
                        ))}
                    </VStack>
                </Section>
            )}

            {/* Employed By — org units (Department / College) that employ the person */}
            {employers.length > 0 && (
                <Section title="Employed By">
                    <Wrap spacing={2}>
                        {employers.map((e, i) => (
                            <WrapItem key={`${e.name}-${i}`}>
                                <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                                    {e.name}{e.type ? ` · ${e.type}` : ''}
                                </Badge>
                            </WrapItem>
                        ))}
                    </Wrap>
                </Section>
            )}

            <Card
                title="Assign to additional YSEs"
                action={
                    <Button size="xs" variant="ghost" colorScheme="teal" onClick={() => setAssignOpen((o) => !o)}>
                        {assignOpen ? 'Hide' : 'Show'}
                    </Button>
                }
            >
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
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">No academic year selected.</Text>
                    )}
                </Collapse>
            </Card>
        </VStack>
    );
}

export default PersonDetailPanel;
