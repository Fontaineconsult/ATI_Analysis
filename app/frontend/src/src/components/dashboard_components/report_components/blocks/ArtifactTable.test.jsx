/**
 * The artifact taxonomy, tested once at the source.
 *
 * Every rule here was gotten wrong by at least one page before extraction: the approval
 * page's standalone template collapsed FILE/URL into DOC, de-linked deprecated-but-live
 * webpages, and dropped message attachment links. The page tests still assert these
 * through their own render paths; this file is where the contract itself lives.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ArtifactTable from './ArtifactTable';

const renderTable = (props) => render(
    <ChakraProvider><ArtifactTable {...props} /></ChakraProvider>
);

describe('ArtifactTable', () => {
    it('splits FILE (uploaded) from URL (external location) and resolves the right href', () => {
        renderTable({
            documents: [
                { unique_id: 'd1', name: 'Uploaded report', file: { download_url: '/files/abc?name=r.pdf', size: 2048, uploaded_date: '2026-01-02' } },
                { unique_id: 'd2', name: 'Box link', uri_path: 'https://box.example/x', file: null },
            ],
        });

        expect(screen.getByText('FILE')).toBeInTheDocument();
        expect(screen.getByText('URL')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Uploaded report' }))
            .toHaveAttribute('href', '/files/abc?name=r.pdf');
        expect(screen.getByRole('link', { name: 'Box link' }))
            .toHaveAttribute('href', 'https://box.example/x');
    });

    it('shows fileMeta and the doc-classification badges', () => {
        renderTable({
            documents: [{
                unique_id: 'd1', name: 'Audit', file: { download_url: '/f', size: 2048, uploaded_date: '2026-01-02' },
                is_administrative_review_documentation: true,
                is_milestone_and_measures_documentation: 'True',   // legacy string form
            }],
        });

        expect(screen.getByText('2026-01-02 · 2 KB')).toBeInTheDocument();
        expect(screen.getByText('Admin Review')).toBeInTheDocument();
        expect(screen.getByText('Milestones')).toBeInTheDocument();
    });

    it('de-links a webpage only for link rot, never for deprecation', () => {
        renderTable({
            webpages: [
                { unique_id: 'w1', name: 'Gone page', url: 'https://x.invalid/old', no_longer_exists: true },
                { unique_id: 'w2', name: 'Old but live', url: 'https://x.example/live', depreciated: true },
            ],
        });

        // Link rot: struck-through text, GONE tag, no anchor.
        expect(screen.getByText('GONE')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /gone page/i })).toBeNull();
        // Deprecated is an editorial status, not a fact about the URL: still a link, badged.
        expect(screen.getByRole('link', { name: 'Old but live' }))
            .toHaveAttribute('href', 'https://x.example/live');
        expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });

    it('renders a message attachment link when the message carries a file', () => {
        renderTable({
            messages: [{ unique_id: 'm1', content: 'Kickoff email', date_created: '2026-01-05', file: { download_url: '/files/msg1' } }],
        });

        expect(screen.getByRole('link', { name: 'attachment' }))
            .toHaveAttribute('href', '/files/msg1');
    });

    it('renders notes and metrics with their detail columns', () => {
        renderTable({
            notes: [{ unique_id: 'n1', content: 'A note', dateCreated: '2026-02-01' }],
            metrics: [{ unique_id: 'mt1', name: 'Courses', single_value: 116, comment: 'per term', academic_year: '2025-2026' }],
        });

        expect(screen.getByText('A note')).toBeInTheDocument();
        expect(screen.getByText('Courses:')).toBeInTheDocument();
        expect(screen.getByText('per term · 2025-2026')).toBeInTheDocument();
    });

    it('badges a deprecated note or message instead of hiding it', () => {
        // Deprecation is history, not noise — the row renders, flagged, the same
        // convention documents and webpages already follow.
        renderTable({
            notes: [{ unique_id: 'n1', content: 'Old process note', depreciated: true, dateCreated: '2025-01-01' }],
            messages: [{ unique_id: 'm1', content: 'Old email', depreciated: 'True' }],
        });

        expect(screen.getByText('Old process note')).toBeInTheDocument();
        expect(screen.getByText('Old email')).toBeInTheDocument();
        expect(screen.getAllByText('Deprecated')).toHaveLength(2);
    });

    it('renders the empty text when nothing is attached', () => {
        renderTable({ emptyText: 'No documentation attached.' });
        expect(screen.getByText('No documentation attached.')).toBeInTheDocument();
    });
});
