import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// CRA's resetMocks wipes factory implementations, so they are set in beforeEach.
jest.mock('../../../services/api/get', () => ({
    __esModule: true,
    fetchFollowUpTable: jest.fn(),
    fetchFollowUpsForMeeting: jest.fn(),
}));

import { fetchFollowUpTable, fetchFollowUpsForMeeting } from '../../../services/api/get';
import FollowUpModal, { askCount } from './FollowUpModal';

const ROWS = [
    {
        composite_key: '8.11-ins',
        year_identifier: '2025-2026-8.11-ins-csueb',
        success_indicator: 'Campus has integrated accessibility into faculty orientations.',
        status_level: 'Defined',
        evidence: [{ title: 'Back to the Bay', type: 'Guidance', strength: 3 }],
        queries: [], recommendations: [], concerns: [],
    },
    {
        composite_key: '8.12-ins',
        year_identifier: '2025-2026-8.12-ins-csueb',
        success_indicator: 'Developed a process that integrates accessibility into faculty development.',
        status_level: 'Established',
        evidence: [],
        queries: [{ question: 'Did it run again?', category: 'information_gap', answerable_by: null }],
        recommendations: [{ recommendation: 'Add a focus area.' }],
        concerns: [],
    },
];

const SAVED = [{
    unique_id: 'f1',
    subject: 'Follow-up: Faculty Development CoP',
    status: 'draft',
    community: 'Faculty Development',
    body_markdown: '## 8.11-ins\n\n- **Please send:** the attendee list you offered.',
    generated_at: '2026-09-02T09:15:00',
    date_created: '2026-09-02',
}];

const GUIDE = {
    unique_id: 'g1',
    title: 'Interview: Faculty Development',
    campus: 'csueb',
    meeting_date: '2026-08-31',
    prepared_for: [{ unique_id: 'p1', name: 'Dawna Komorosky' }],
    pertains_to_communities: [{ unique_id: 'c1', name: 'Faculty Development' }],
    resulted_in: { unique_id: 'm1', title: 'Meeting Notes: Faculty Development', meeting_date: '2026-08-31' },
};

const renderModal = (guide = GUIDE) => render(
    <ChakraProvider>
        <FollowUpModal guide={guide} onClose={() => {}} />
    </ChakraProvider>,
);

beforeEach(() => {
    fetchFollowUpTable.mockResolvedValue({ data: { rows: ROWS } });
    fetchFollowUpsForMeeting.mockResolvedValue({ data: { follow_ups: SAVED } });
});

describe('askCount', () => {
    it('sums queries, recommendations and concerns', () => {
        expect(askCount(ROWS[1])).toBe(2);
        expect(askCount(ROWS[0])).toBe(0);
    });

    it('treats missing collections as zero rather than throwing', () => {
        expect(askCount({})).toBe(0);
    });
});

describe('FollowUpModal', () => {
    it('lists every indicator the meeting touched', async () => {
        renderModal();
        // The saved message cites 8.11-ins too, so both the badge and the
        // rendered body match — the table row is the one that must exist.
        expect(await screen.findAllByText('8.11-ins')).not.toHaveLength(0);
        expect(screen.getByText('8.12-ins')).toBeInTheDocument();
    });

    it('summarises the open asks across the table', async () => {
        renderModal();
        expect(await screen.findByText(/2 indicators/)).toBeInTheDocument();
        expect(screen.getByText(/2 open asks/)).toBeInTheDocument();
    });

    it('displays a saved follow-up body rather than composing one', async () => {
        renderModal();
        expect(await screen.findByText(/the attendee list you offered/)).toBeInTheDocument();
    });

    it('offers no way to generate a message from the app', async () => {
        renderModal();
        await screen.findByText(/2 indicators/);
        expect(screen.queryByRole('button', { name: /generate/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save follow-up/i })).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/follow-up message/i)).not.toBeInTheDocument();
    });

    it('shows when the message was generated, so staleness is visible', async () => {
        renderModal();
        expect(await screen.findByText(/generated 2026-09-02T09:15:00/)).toBeInTheDocument();
    });

    it('falls back to the created date when no timestamp was stamped', async () => {
        fetchFollowUpsForMeeting.mockResolvedValue({
            data: { follow_ups: [{ ...SAVED[0], generated_at: null }] },
        });
        renderModal();
        expect(await screen.findByText(/generated 2026-09-02$/)).toBeInTheDocument();
    });

    it('offers a copy button per saved follow-up', async () => {
        renderModal();
        expect(await screen.findByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('says where follow-ups come from when none exist yet', async () => {
        fetchFollowUpsForMeeting.mockResolvedValue({ data: { follow_ups: [] } });
        renderModal();
        expect(await screen.findByText(/composed with/i)).toBeInTheDocument();
    });

    it('explains itself when the guide has no minutes linked', async () => {
        const { resulted_in: _omitted, ...noMinutes } = GUIDE;
        renderModal(noMinutes);
        expect(await screen.findByText(/no minutes linked yet/i)).toBeInTheDocument();
        expect(fetchFollowUpTable).not.toHaveBeenCalled();
    });

    it('says why the table is empty rather than showing a bare blank', async () => {
        fetchFollowUpTable.mockResolvedValue({ data: { rows: [] } });
        renderModal();
        expect(await screen.findByText(/have not been ingested yet/i)).toBeInTheDocument();
    });
});
