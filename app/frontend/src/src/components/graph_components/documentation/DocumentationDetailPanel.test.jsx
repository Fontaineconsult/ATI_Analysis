/**
 * RTL tests for the Documentation detail panel.
 *
 * The assertions that matter most are the ones that stop the panel LYING about a
 * record: a legacy string 'False' must not read as deprecated, an unassessed
 * null must not read as "not deprecated", and a shared record must announce how
 * many others change with it.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

import DocumentationDetailPanel from './DocumentationDetailPanel';

const item = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'doc-1',
    title: 'Accessibility checklist',
    description: 'A checklist',
    include_in_report: true,
    include_in_report_set: true,
    depreciated: false,
    has_location: true,
    uri_path: 'https://sfsu.edu/checklist',
    reference_count: 1,
    parent_count: 1,
    integrity: [],
    stored: {},
    referenced_by: [
        { rel_type: 'is_documented_by', parent_label: 'Process', parent_id: 'p1', parent_title: 'Canvas Remediation' },
    ],
    ...over,
});

const renderPanel = (props = {}) => render(
    <ChakraProvider>
        <MemoryRouter>
            <DocumentationDetailPanel item={item()} campus="sfsu" {...props} />
        </MemoryRouter>
    </ChakraProvider>,
);

describe('DocumentationDetailPanel — states', () => {
    it('prompts when nothing is selected', () => {
        renderPanel({ item: null });
        expect(screen.getByText(/Select a record/)).toBeInTheDocument();
    });

    it('shows a spinner while loading', () => {
        renderPanel({ item: null, loading: true });
        expect(screen.getByText(/Loading record/)).toBeInTheDocument();
    });

    it('shows an error', () => {
        renderPanel({ item: null, error: 'Boom' });
        expect(screen.getByText('Boom')).toBeInTheDocument();
    });
});

/**
 * These assert on the BADGES, and they are scoped to the badge row rather than
 * to the document. Since the panel became the editing surface, the same words
 * legitimately appear elsewhere on it — "Deprecated" as a field label, "Not
 * assessed" as one of that field's options — so an unscoped query would match
 * the control instead of the badge and stop testing what it means to.
 */
describe('DocumentationDetailPanel — never lies about a flag', () => {
    const badgeText = (text) => screen.queryAllByText(text)
        .filter((el) => el.className.includes('badge'));

    it('a stored string "False" does not render as deprecated', () => {
        // The regression this whole coercion layer exists to prevent: neomodel
        // serves 'False' as true, so an uncoerced panel would show Deprecated.
        renderPanel({ item: item({ depreciated: 'False' }) });
        expect(badgeText('Deprecated')).toHaveLength(0);
    });

    it('an unassessed null renders as "Not assessed", not as deprecated or clean', () => {
        renderPanel({ item: item({ depreciated: null }) });
        expect(badgeText('Not assessed')).toHaveLength(1);
        expect(badgeText('Deprecated')).toHaveLength(0);
    });

    it('a genuine true renders as deprecated', () => {
        renderPanel({ item: item({ depreciated: true }) });
        expect(badgeText('Deprecated')).toHaveLength(1);
    });

    it('says when the report flag was never explicitly set', () => {
        // The read-only "Report status" section is gone — the flag is a switch
        // now — but the distinction it drew still has to be stated, because
        // "included because nobody decided" is not "included on purpose".
        renderPanel({ item: item({ include_in_report: true, include_in_report_set: false }) });
        expect(screen.getByText(/never been explicitly set/i)).toBeInTheDocument();
    });
});

describe('DocumentationDetailPanel — integrity is surfaced, not hidden', () => {
    it('names the defect and echoes what is actually stored', () => {
        renderPanel({
            item: item({
                integrity: ['string_boolean:depreciated'],
                stored: { depreciated: 'False' },
            }),
        });
        expect(screen.getByText(/Stored as text, not a boolean — depreciated/)).toBeInTheDocument();
        expect(screen.getByText(/stored as "False"/)).toBeInTheDocument();
    });

    it('shows no integrity card for a clean record', () => {
        renderPanel();
        expect(screen.queryByText('Data integrity')).not.toBeInTheDocument();
    });
});

describe('DocumentationDetailPanel — blast radius', () => {
    it('warns, with a count of records, when a node is shared', () => {
        renderPanel({ item: item({ parent_count: 39, reference_count: 39 }) });
        expect(screen.getByText('Attached to 39 records.')).toBeInTheDocument();
        // Explaining WHY per-parent editing isn't offered stops it being filed
        // as a missing feature.
        expect(screen.getByText(/no way to change it for just one/)).toBeInTheDocument();
    });

    it('does not warn for a single-parent record', () => {
        renderPanel();
        expect(screen.queryByText(/Attached to/)).not.toBeInTheDocument();
    });
});

describe('DocumentationDetailPanel — references', () => {
    it('groups references by relationship and links parents that have a route', () => {
        renderPanel();
        expect(screen.getByText('Referenced by (1)')).toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: 'Canvas Remediation' });
        expect(link).toHaveAttribute('href', '/sfsu/ati-explorer/implementations/p1');
    });

    it('renders a routeless parent as text, not a link that would 404', () => {
        renderPanel({
            item: item({
                referenced_by: [{
                    rel_type: 'has_note', parent_label: 'YearSuccessEvidence',
                    parent_id: 'y1', parent_title: '2025-2026-7.5-ins-sfsu',
                    yse: { indicator: '7.5-ins', campus: 'sfsu', year: '2025-2026' },
                }],
            }),
        });
        expect(screen.queryByRole('link', { name: '2025-2026-7.5-ins-sfsu' })).not.toBeInTheDocument();
        expect(screen.getByText('2025-2026-7.5-ins-sfsu')).toBeInTheDocument();
    });

    it('shows resolved YSE coordinates rather than making the reader parse an identifier', () => {
        renderPanel({
            item: item({
                referenced_by: [{
                    rel_type: 'has_note', parent_label: 'YearSuccessEvidence',
                    parent_id: 'y1', parent_title: '2025-2026-7.5-ins-sfsu',
                    yse: { indicator: '7.5-ins', campus: 'sfsu', year: '2025-2026' },
                }],
            }),
        });
        expect(screen.getByText('7.5-ins')).toBeInTheDocument();
        expect(screen.getByText('sfsu')).toBeInTheDocument();
        expect(screen.getByText('2025-2026')).toBeInTheDocument();
    });

    it('states plainly when nothing references a record', () => {
        renderPanel({ item: item({ referenced_by: [], reference_count: 0, parent_count: 0 }) });
        expect(screen.getByText(/Nothing in the graph points at this record/)).toBeInTheDocument();
    });
});

describe('DocumentationDetailPanel — location', () => {
    it('flags an artifact with no location as unreachable', () => {
        renderPanel({ item: item({ has_location: false, uri_path: null }) });
        expect(screen.getByText(/Nothing can reach this record/)).toBeInTheDocument();
    });

    it('warns when an uploaded file backs more than one record', () => {
        renderPanel({
            item: item({
                file: { original_filename: 'a.pdf', download_url: '/x', size: 2048, shared_by: 3 },
            }),
        });
        expect(screen.getByText(/attached to 3 records/i)).toBeInTheDocument();
    });
});

describe('DocumentationDetailPanel — incomplete concepts', () => {
    it('says so for Metric rather than presenting thin data as a defect', () => {
        renderPanel({ item: item({ doc_type: 'metrics', depreciated: undefined }) });
        expect(screen.getByText(/not a finished concept in the ontology/)).toBeInTheDocument();
    });

    it('says nothing of the sort for a Document', () => {
        renderPanel();
        expect(screen.queryByText(/not a finished concept/)).not.toBeInTheDocument();
    });
});
