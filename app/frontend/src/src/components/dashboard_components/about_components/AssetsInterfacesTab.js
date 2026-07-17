import React from 'react';
import { Alert, AlertIcon, List, ListItem } from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { AboutPage, Card, Section, Para, CodePattern, VocabTable, Figure } from './aboutPrimitives';
import assetsInterfacesDiagram from '../../../assets/img/assets-interfaces.svg';

const ASSET_CLASS_NOTES = {
    institutional_system: 'Enterprise systems the institution runs — LMS, SIS, portals.',
    employee_content: 'Content authored by employees — departmental sites, documents, media.',
    third_party_service: 'Externally hosted services the campus relies on but does not run.',
    infrastructure: 'Underlying platforms and plumbing other ICT depends on.',
};

const ASSET_SCOPE_NOTES = {
    systemwide: 'One instance serving the whole CSU.',
    regional: 'Shared across a subset of campuses.',
    campus: 'Deployed and governed at one campus.',
    vendor: 'Controlled by the vendor; the campus consumes it.',
};

const TAAP_OUTCOME_NOTES = {
    equally_effective: 'The alternative gives the affected user equivalent access — timeliness, accuracy, and dignity intact.',
    non_equal_alternative: 'An alternative exists but is not fully equivalent; the gap is documented.',
    referral: 'The user is routed to another office or channel for access.',
};

const FUNCTION_NOTES = {
    'teaching-and-learning': 'Course delivery, instruction, academic work.',
    'information-and-communication': 'Publishing and communicating — public sites, news, social.',
    'service-and-self-administration': 'Users acting on their own affairs — registration, billing, HR self-service.',
    'internal-operations': 'Employee-facing operational work.',
};

const COMPONENT_KIND_NOTES = {
    'web-surface': 'A page or web/mobile application rendered in a browser or web runtime.',
    'structured-document': 'PDF, word-processor, presentation, or spreadsheet files.',
    'time-based-media': 'Video and audio.',
    'interactive-component': 'Forms, widgets, embedded tools such as LTIs.',
    'static-non-text': 'A standalone image or graphic.',
};

const AUDIENCE_NOTES = {
    students: 'Enrolled students — §504 + Title II.',
    employees: 'Faculty and staff — Title I + §504.',
    'applicants-for-employment': 'Job applicants — Title I reaches hiring.',
    'prospective-students': 'Recruitment and admissions audiences — Title II + §504.',
    'general-public': 'Community, visitors, non-affiliated users — Title II + §504.',
};

const PROVENANCE_NOTES = {
    declared: 'The ATI named this interface up front as something it tracks.',
    enacted: 'It emerged from where remediation work actually clustered.',
    both: 'Surfaced both ways.',
};

// The asset inventory model: assets and stewardship, TAAPs, interfaces and
// their identity signature, components, tools, and vendors.
function AssetsInterfacesTab() {
    const { vocab } = useSettings();

    return (
        <AboutPage
            title="Assets & Interfaces"
            lede="The inventory side of the graph: the ICT the institution answers for, the surfaces where the duty actually lands, and the machinery for tracking responsibility and interim access."
        >
            <Card title="Why this layer exists">
                <Para>
                    Indicators measure the <i>program</i>; this layer tracks the <i>things</i>.
                    Section 508 and Title II attach obligations to concrete technology — the LMS,
                    the department site, the payroll portal — so the graph models that technology
                    directly, at three grains:
                </Para>
                <CodePattern>
{`Asset        the stewarded ICT unit            "Canvas (SFSU instance)"
 └─ Interface   where people meet it            "Canvas course shells"
     └─ Component  where WCAG criteria attach   "the video player"`}
                </CodePattern>
                <Para>
                    The organizing principle, drawn from the campus&apos;s responsibility
                    framework: <b>responsibility sits with the party closest to remediation
                    capacity — and where that party cannot remediate, responsibility rises to the
                    institution</b> (Title II §35.205). The model is built to make that rise
                    visible rather than letting it hide.
                </Para>
                <Figure
                    src={assetsInterfacesDiagram}
                    alt="The inventory model: ICT at three grains — Asset, Interface, Component. Stewardship (procured, developed, maintained, used by a Person or OrgUnit) sits on the Asset; remediation accountability (remediates interface, uses tool, owned by, accountable working group) sits on the work. An asset stewarded with no remediating implementation is the elevation signal where responsibility rises to the institution."
                    caption="Three grains of ICT, with stewardship on the Asset and remediation on the work — and the elevation signal where the two diverge."
                    maxW="900px"
                />
            </Card>

            <Card title="Assets — stewardship, not ownership">
                <Para>
                    An <b>Asset</b> is a unit of ICT whose accessibility the institution must
                    maintain. Its identity is its title <i>plus its scope</i> — the same nominal
                    system resolves into distinct assets per deployment (<code>canvas-sfsu</code>{' '}
                    vs <code>canvas-systemwide</code>), because who can act on each differs.
                </Para>
                <Section title="Asset classes">
                    <VocabTable label="Asset classes" vocab={vocab?.asset_classes} notes={ASSET_CLASS_NOTES} />
                </Section>
                <Section title="Asset scopes">
                    <VocabTable label="Asset scopes" vocab={vocab?.asset_scopes} notes={ASSET_SCOPE_NOTES} />
                </Section>
                <Para mt={2}>
                    Deliberately, an asset has <b>no single &quot;owner&quot;</b>. Instead it
                    records four separate §508 <b>stewardship capacities</b>, each held by a
                    person or an organizational unit:
                </Para>
                <CodePattern>
{`Asset ──procured_by──▶  Person | OrgUnit     who acquired it
      ──developed_by──▶ Person | OrgUnit     who built/configures it
      ──maintained_by─▶ Person | OrgUnit     who operates it day to day
      ──used_by───────▶ Person | OrgUnit     who relies on it`}
                </CodePattern>
                <Para>
                    All four are optional, because incomplete stewardship is a real and meaningful
                    state — not a data-entry error to be papered over.
                </Para>
                <Alert status="warning" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    The elevation signal: an asset that is stewarded but has no remediating
                    implementation — nobody positioned to fix it — is exactly the case where
                    responsibility rises to the institution. The Assets area surfaces this as a
                    first-class warning rather than blocking it at entry.
                </Alert>
            </Card>

            <Card title="Remediation — who fixes it, and with what">
                <Para>
                    Fixing is modeled on the <b>work</b>, not on the asset. Implementations
                    (processes, projects, procedures, services) declare what they remediate and
                    what tools they use:
                </Para>
                <CodePattern>
{`Process/Project/Procedure/Service ──remediates_interface──▶ Interface
                                   ──uses_tool────────────▶ Tool
                                   ──owned_by─────────────▶ Person
                                   ──accountable_working_group──▶ ATIWorkingGroup`}
                </CodePattern>
                <Para>
                    This separation — stewardship on the asset, remediation accountability on the
                    work — is what lets the graph distinguish &quot;someone runs this&quot; from
                    &quot;someone is fixing this,&quot; and report each honestly.
                </Para>
                <Section title="Tools">
                    <Para>
                        A <b>Tool</b> is an instrument of remediation work — a scanner, a
                        captioning service, an OCR engine. Distinct from an asset: the institution
                        uses a tool to keep assets accessible. A tool can be supplied by a vendor,
                        and when the tool itself is institutionally stewarded it can point at its
                        own asset record.
                    </Para>
                </Section>
                <Section title="Vendors">
                    <Para>
                        A <b>Vendor</b> supplies assets and tools, with sales and technical
                        contacts on record. The relationship is commercial provenance only —
                        supplying a system is not stewarding it.
                    </Para>
                </Section>
            </Card>

            <Card title="TAAPs — when full conformance isn't achievable">
                <Para>
                    A <b>TAAP</b> (Temporary Alternate Access Plan) is the institution&apos;s
                    formal response when an asset cannot reach full conformance now: a time-bound,
                    asset-scoped plan for equivalent access while the gap persists. Every TAAP
                    covers exactly one asset, has an owner and a signer, an effective date and a
                    review-due date, and — because operating an honest interim-access regime is
                    itself a compliance activity — a TAAP can serve as evidence for an indicator.
                </Para>
                <Section title="TAAP outcomes">
                    <VocabTable label="TAAP outcomes" vocab={vocab?.taap_outcomes} notes={TAAP_OUTCOME_NOTES} />
                </Section>
            </Card>

            <Card title="Interfaces — where the duty lands">
                <Para>
                    An <b>Interface</b> is a salient point of interaction, identified by what it
                    is <i>for</i> rather than what technology renders it. It is the unit
                    remediation targets. Identity is a four-coordinate <b>signature</b>, and all
                    four coordinates are immutable once created:
                </Para>
                <CodePattern>
{`interface_identifier = backing -- locus -- function -- title

backing   the presenting asset's identifier, or "standalone"
locus     the structural zone within the backing ("course-shells")
function  the institutional purpose (vocabulary below)
title     the human label

e.g.  canvas-sfsu--course-shells--teaching-and-learning--course-home`}
                </CodePattern>
                <Para>
                    The rule for what makes the signature: a coordinate belongs in identity only
                    if disagreement about it means two teams are talking about different things.
                    Purpose qualifies; audience, coverage domain, and committee assignment do not —
                    those are descriptive and editable.
                </Para>
                <Section title="Functions (identity-bearing)">
                    <VocabTable label="Interface functions" vocab={vocab?.functions} notes={FUNCTION_NOTES} />
                </Section>
                <Section title="Audiences (descriptive)">
                    <Para>
                        Who encounters the interface. The labels carry the governing legal basis,
                        because the duty and its accommodation population differ by audience. An
                        interface can serve several.
                    </Para>
                    <VocabTable label="Audiences" vocab={vocab?.audiences} notes={AUDIENCE_NOTES} />
                </Section>
                <Section title="Coverage domains (descriptive)">
                    <Para>
                        The institution&apos;s declared &quot;what we track&quot; categories —
                        course content, library assets, public webpages, and so on. Multi-valued
                        and adjustable as attention shifts.
                    </Para>
                    <VocabTable label="Coverage domains" vocab={vocab?.coverage_domains} />
                </Section>
                <Section title="Provenance (descriptive, diagnostic)">
                    <Para>
                        How the interface became known. The declared-vs-enacted gap is a feature,
                        not a defect: comparing what the ATI said it tracks against where work
                        actually clusters shows whether attention matches reality.
                    </Para>
                    <VocabTable label="Interface provenances" vocab={vocab?.interface_provenances} notes={PROVENANCE_NOTES} />
                </Section>
                <Section title="Working-group accountability (an edge, never identity)">
                    <Para>
                        Interfaces can name accountable working groups. Keeping <i>function</i> in
                        the identity but <i>accountability</i> as an assignment makes a headline
                        diagnostic queryable: interfaces whose purpose is teaching-and-learning but
                        whose remediation is accountable to the Web group — purpose and
                        accountability diverging.
                    </Para>
                </Section>
            </Card>

            <Card title="Components — where WCAG attaches">
                <Para>
                    A <b>Component</b> is a WCAG-grain element of an interface — the video player,
                    the data table, the registration form. Components are kind-homogeneous (one
                    component, one kind), which is why <i>kind</i> lives here and not on the
                    interface. Components link to the specific WCAG guidelines they must satisfy,
                    and to VPAT/ACR line items that describe them.
                </Para>
                <Section title="Component kinds">
                    <VocabTable label="Component kinds" vocab={vocab?.component_kinds} notes={COMPONENT_KIND_NOTES} />
                </Section>
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700" mt={2}>
                    <ListItem>
                        Components are <b>composition, not identity</b> — an interface&apos;s
                        component set can evolve without re-identifying the interface.
                    </ListItem>
                    <ListItem>
                        Components are <b>not remediation targets</b> — remediation always aims at
                        the interface; components record where within it the criteria bite.
                    </ListItem>
                </List>
            </Card>
        </AboutPage>
    );
}

export default AssetsInterfacesTab;
