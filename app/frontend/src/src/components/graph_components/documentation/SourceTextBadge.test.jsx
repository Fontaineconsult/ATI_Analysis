/**
 * The source-text badge.
 *
 * Unlike every other badge in this row it shows in BOTH states, because it is a
 * coverage signal rather than a fault: 29 of 418 artifacts have their source
 * text captured today, so "missing" is the norm and the badge is how the backlog
 * is visible while scanning a list.
 *
 * The case worth guarding is the third one: Notes, Messages and Metrics have no
 * `raw_text` property at all, so the badge must be SILENT there rather than
 * reporting 567 records as missing something the schema makes impossible.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

import { SourceTextBadge, DocumentationBadgeRow } from './DocumentationBadges';
import { sourceTextState, supportsRawText } from './documentationConfig';

const show = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('sourceTextState', () => {
    it('is present when the record carries text', () => {
        expect(sourceTextState({ doc_type: 'documents', has_raw_text: true })).toBe('present');
    });

    it('is missing when an artifact type has none', () => {
        expect(sourceTextState({ doc_type: 'webpages', has_raw_text: false })).toBe('missing');
    });

    /** A category error, not a gap. */
    it('is null for the types that cannot hold source text', () => {
        ['notes', 'messages', 'metrics'].forEach((docType) => {
            expect(supportsRawText(docType)).toBe(false);
            expect(sourceTextState({ doc_type: docType, has_raw_text: false })).toBeNull();
        });
    });
});

describe('SourceTextBadge', () => {
    it('marks a captured record', () => {
        show(<SourceTextBadge item={{ doc_type: 'documents', has_raw_text: true }} />);
        expect(screen.getByText('Source text')).toBeInTheDocument();
    });

    it('marks an artifact with none', () => {
        show(<SourceTextBadge item={{ doc_type: 'documents', has_raw_text: false }} />);
        expect(screen.getByText('No source text')).toBeInTheDocument();
    });

    it('says nothing at all for a Note', () => {
        show(<SourceTextBadge item={{ doc_type: 'notes', has_raw_text: false }} />);
        // Neither state — the concept does not apply, so silence is the answer.
        expect(screen.queryByText(/source text/i)).not.toBeInTheDocument();
    });
});

describe('the badge row a list item renders', () => {
    const artifact = (over = {}) => ({
        doc_type: 'documents',
        include_in_report: true,
        include_in_report_set: true,
        depreciated: false,
        has_location: true,
        reference_count: 1,
        parent_count: 1,
        integrity: [],
        ...over,
    });

    it('carries the source-text state on every artifact row', () => {
        show(<DocumentationBadgeRow item={artifact({ has_raw_text: false })} />);
        expect(screen.getByText('No source text')).toBeInTheDocument();

        show(<DocumentationBadgeRow item={artifact({ has_raw_text: true })} />);
        expect(screen.getByText('Source text')).toBeInTheDocument();
    });

    it('carries none of it on an annotation row', () => {
        show(<DocumentationBadgeRow item={artifact({ doc_type: 'notes', has_raw_text: false })} />);
        expect(screen.queryByText('No source text')).not.toBeInTheDocument();
        expect(screen.queryByText('Source text')).not.toBeInTheDocument();
    });
});
