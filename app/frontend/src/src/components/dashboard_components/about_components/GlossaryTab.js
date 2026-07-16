import React from 'react';
import { SimpleGrid, Text, Spinner, HStack } from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { useDescriptors } from '../../../hooks/useDescriptors';
import { AboutPage, Card, Section, Para, TermDef, VocabTable } from './aboutPrimitives';

// Node types grouped editorially. The DESCRIPTIONS are sourced live from the ontology
// (UniversalDescriptor node_type descriptors) via useDescriptors — this page no longer holds
// its own copy. Author/curate the text in Settings → Ontology Browser; seed legacy text with
// app/database/tools/seed_glossary_descriptors.py.
const NODE_TYPE_GROUPS = [
    { title: 'Governance', labels: ['Law', 'Case', 'Directive', 'ExternalPolicy', 'Memo', 'Guideline'] },
    { title: 'Goals, Indicators & Evidence', labels: ['Goal', 'SuccessIndicator', 'YearSuccessEvidence', 'StatusLevel', 'AcademicYear', 'Accomplishment'] },
    { title: 'Implementations', labels: ['Process', 'Project', 'Procedure', 'Service', 'Guidance', 'Tracking', 'InternalPolicy', 'Plan'] },
    { title: 'Documentation', labels: ['Document', 'Webpage', 'Note', 'Message', 'Metric'] },
    { title: 'People & Organizations', labels: ['Person', 'ATIWorkingGroup', 'Department', 'College', 'Vendor'] },
    { title: 'Assets & Interfaces', labels: ['Asset', 'Interface', 'Component', 'TAAP', 'Tool'] },
    { title: 'Planning', labels: ['CampusPlan', 'WorkingGroupPlan', 'ProgressUpdate'] },
    { title: 'Classification & Ontology', labels: ['Dimension', 'Role', 'Principle', 'UniversalDescriptor'] },
];

// Concepts that are NOT node types (a derived asset state / a vocabulary), so they have no
// node-type descriptor in the ontology. Kept here, clearly separate, with inline text.
const DERIVED_CONCEPTS = [
    ['Elevation signal', 'The diagnostic state of an asset that is stewarded but has no remediating implementation — the case where responsibility rises to the institution (Title II §35.205).'],
    ['Trajectory', 'The direction of travel of work (improving / on track / stagnant / at risk / failing) — deliberately separate from the absolute status level. (A vocabulary on ProgressUpdate, not a node type.)'],
];

const humanize = (label) => label.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

// One glossary term whose name + description come from the node type's ontology descriptor.
// When no descriptor (or no description text) exists, the gap is shown explicitly.
function NodeTypeTerm({ label, describeNodeType }) {
    const d = describeNodeType(label);
    const term = d?.title || humanize(label);
    const text = d?.description_short || d?.description_full || d?.description;
    return (
        <TermDef term={term}>
            {text || (
                <Text as="span" fontSize="sm" color="gray.600" fontStyle="italic">
                    No description in the ontology yet — add one in Settings → Ontology Browser.
                </Text>
            )}
        </TermDef>
    );
}

function GlossaryTab() {
    const { vocab } = useSettings();
    const { describeNodeType, loading } = useDescriptors();

    return (
        <AboutPage
            title="Glossary"
            lede="Every node type and controlled vocabulary in the application, in one place. Node-type descriptions are sourced live from the ontology (the UniversalDescriptor layer) — curate them in Settings → Ontology Browser — and vocabulary tables come live from the server, so both always match the system of record."
        >
            <Card title="Node types">
                <Para>
                    The kinds of records in the graph, grouped by layer. Each description is the
                    node type’s ontology entry; “no description” marks a gap to fill.
                </Para>
                {loading ? (
                    <HStack py={6} color="gray.600" fontSize="sm">
                        <Spinner size="sm" color="teal.500" />
                        <Text>Loading descriptions from the ontology…</Text>
                    </HStack>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={2}>
                        {NODE_TYPE_GROUPS.map((group) => (
                            <Section key={group.title} title={group.title}>
                                {group.labels.map((label) => (
                                    <NodeTypeTerm key={label} label={label} describeNodeType={describeNodeType} />
                                ))}
                            </Section>
                        ))}
                        <Section title="Derived concepts (not node types)">
                            {DERIVED_CONCEPTS.map(([term, description]) => (
                                <TermDef key={term} term={term}>{description}</TermDef>
                            ))}
                        </Section>
                    </SimpleGrid>
                )}
            </Card>

            <Card title="Controlled vocabularies">
                <Para>
                    The fixed choice lists used across forms and badges. Stored values are what
                    the database records; labels are what the interface shows.
                </Para>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3} mt={2}>
                    <Section title="Status levels (maturity ladder)">
                        <VocabTable vocab={vocab?.status_levels} keyHeader="Level (in order)" />
                    </Section>
                    <Section title="Working groups">
                        <VocabTable vocab={vocab?.working_groups} keyHeader="Group" />
                    </Section>
                    <Section title="Trajectory">
                        <VocabTable vocab={vocab?.trajectory_choices} />
                    </Section>
                    <Section title="Plan statuses">
                        <VocabTable vocab={vocab?.plan_statuses} keyHeader="Status" />
                    </Section>
                    <Section title="Asset classes">
                        <VocabTable vocab={vocab?.asset_classes} />
                    </Section>
                    <Section title="Asset scopes">
                        <VocabTable vocab={vocab?.asset_scopes} />
                    </Section>
                    <Section title="TAAP outcomes">
                        <VocabTable vocab={vocab?.taap_outcomes} />
                    </Section>
                    <Section title="Interface functions">
                        <VocabTable vocab={vocab?.functions} />
                    </Section>
                    <Section title="Audiences">
                        <VocabTable vocab={vocab?.audiences} />
                    </Section>
                    <Section title="Coverage domains">
                        <VocabTable vocab={vocab?.coverage_domains} />
                    </Section>
                    <Section title="Interface provenance">
                        <VocabTable vocab={vocab?.interface_provenances} />
                    </Section>
                    <Section title="Component kinds">
                        <VocabTable vocab={vocab?.component_kinds} />
                    </Section>
                    <Section title="Message types">
                        <VocabTable vocab={vocab?.message_types} keyHeader="Type" />
                    </Section>
                    <Section title="Metric types">
                        <VocabTable vocab={vocab?.metric_types} keyHeader="Type" />
                    </Section>
                    <Section title="Academic years">
                        <VocabTable vocab={vocab?.academic_years} keyHeader="Year" />
                    </Section>
                </SimpleGrid>
            </Card>
        </AboutPage>
    );
}

export default GlossaryTab;
