import React from 'react';
import { SimpleGrid, Box } from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { getImplementationDefinitions } from '../../../context/definitions';
import { AboutPage, Card, Section, Para, TermDef, VocabTable } from './aboutPrimitives';

// Grouping of the shared node-type definitions (context/definitions.js) into
// glossary sections. Types not listed there are defined inline below.
const DEFINITION_GROUPS = [
    {
        title: 'Governance',
        keys: ['Law', 'Case', 'Directive', 'ExternalPolicy', 'Memo', 'Guideline'],
    },
    {
        title: 'Goals, Indicators & Evidence',
        keys: ['Goal', 'SuccessIndicator', 'YearSuccessEvidence', 'StatusLevel', 'AcademicYear', 'Accomplishment'],
    },
    {
        title: 'Implementations',
        keys: ['Process', 'Project', 'Procedure', 'Service', 'Guidance', 'Tracking', 'InternalPolicy', 'Plan'],
    },
    {
        title: 'Documentation',
        keys: ['Document', 'Webpage', 'Note', 'Message', 'Metric'],
    },
    {
        title: 'People & Organizations',
        keys: ['Person', 'ATIWorkingGroup', 'Department', 'College', 'Vendor'],
    },
];

// Terms with no entry in definitions.js — the newer inventory/planning layer.
const EXTRA_TERMS = [
    {
        group: 'Assets & Interfaces',
        terms: [
            ['Asset', 'A unit of ICT whose accessibility the institution must maintain — identified by title plus deployment scope, with up to four §508 stewardship capacities (procured / developed / maintained / used by a person or org unit).'],
            ['Interface', 'A salient point of interaction identified by a four-coordinate signature (backing asset, locus, function, title). The unit that remediation work targets.'],
            ['Component', 'A WCAG-grain element of an interface (video player, form, data table) carrying a kind and links to the guidelines it must satisfy.'],
            ['TAAP', 'Temporary Alternate Access Plan — the time-bound, asset-scoped plan for equivalent access when full conformance is not yet achievable. Reviewed annually; itself usable as evidence.'],
            ['Tool', 'An instrument of remediation work (scanner, captioning service, OCR engine) used by implementations to keep assets accessible.'],
            ['Elevation signal', 'The diagnostic state of an asset that is stewarded but has no remediating implementation — the case where responsibility rises to the institution (Title II §35.205).'],
        ],
    },
    {
        group: 'Planning',
        terms: [
            ['CampusPlan', 'The one-per-campus, one-per-year planning document: executive summary, executive sponsor, and three working-group plans.'],
            ['WorkingGroupPlan', 'A campus plan’s per-committee child: prioritized indicators with rationale, a group lead, and the constituent plan work-items.'],
            ['ProgressUpdate', 'A dated, append-only progress entry about a piece of evidence, carrying a note, an author, and a trajectory.'],
            ['Trajectory', 'The direction of travel of work (improving / on track / stagnant / at risk / failing) — deliberately separate from the absolute status level.'],
        ],
    },
    {
        group: 'Classification & Ontology',
        terms: [
            ['Dimension', 'One of the seven W3C Accessibility Maturity Model dimensions (Communications, Governance & Oversight, ICT Development Lifecycle, Knowledge & Skills, Personnel, Procurement, Support) used to classify implementations.'],
            ['Role', 'A capacity a person provides (QA specialist, captioner, developer, …), recorded with whether it appears in their position description.'],
            ['Principle', 'A conceptual commitment of the framework (e.g. responsibility sits closest to remediation capacity), grounded in law or scholarship and linked to the schema elements it shapes.'],
            ['UniversalDescriptor', 'A self-describing record for an element of the data model itself — a node type, field, field value, or relationship — powering tooltips and this documentation.'],
        ],
    },
];

function GlossaryTab() {
    const { vocab } = useSettings();
    const definitions = getImplementationDefinitions();

    return (
        <AboutPage
            title="Glossary"
            lede="Every node type and controlled vocabulary in the application, in one place. Vocabulary tables are live from the server, so they always match what the forms offer."
        >
            <Card title="Node types">
                <Para>
                    The kinds of records in the graph, grouped by layer. See the other About tabs
                    for how they connect.
                </Para>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={2}>
                    {DEFINITION_GROUPS.map((group) => (
                        <Section key={group.title} title={group.title}>
                            {group.keys.map((key) => {
                                const def = definitions[key];
                                if (!def) return null;
                                return (
                                    <TermDef key={key} term={def.name}>
                                        {def.description}
                                    </TermDef>
                                );
                            })}
                        </Section>
                    ))}
                    {EXTRA_TERMS.map((group) => (
                        <Section key={group.group} title={group.group}>
                            {group.terms.map(([term, description]) => (
                                <TermDef key={term} term={term}>
                                    {description}
                                </TermDef>
                            ))}
                        </Section>
                    ))}
                </SimpleGrid>
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
                <Box mt={3}>
                    <Para fontSize="xs" color="gray.500">
                        Vocabularies are defined once on the server (app/data_config.py) and served
                        read-only to the interface — adding a value there updates forms, badges,
                        and this page together.
                    </Para>
                </Box>
            </Card>
        </AboutPage>
    );
}

export default GlossaryTab;
