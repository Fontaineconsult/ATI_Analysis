import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

// CRA's resetMocks wipes factory implementations, so they are set in beforeEach.
jest.mock('../../../services/api/get', () => ({
    __esModule: true,
    fetchFollowUpTable: jest.fn(),
    fetchFollowUpsForMeeting: jest.fn(),
}));
jest.mock('../../../services/api/post', () => ({
    __esModule: true,
    createFollowUp: jest.fn(),
}));

import { fetchFollowUpTable, fetchFollowUpsForMeeting } from '../../../services/api/get';
import { createFollowUp } from '../../../services/api/post';
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
    fetchFollowUpsForMeeting.mockResolvedValue({ data: { follow_ups: [] } });
    createFollowUp.mockResolvedValue({ data: { unique_id: 'f1' } });
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
        expect(await screen.findByText('8.11-ins')).toBeInTheDocument();
        expect(screen.getByText('8.12-ins')).toBeInTheDocument();
    });

    it('summarises the open asks across the table', async () => {
        renderModal();
        await screen.findByText('8.11-ins');
        expect(screen.getByText(/2 indicators/)).toBeInTheDocument();
        expect(screen.getByText(/2 open asks/)).toBeInTheDocument();
    });

    it('refuses to save before a draft exists', async () => {
        renderModal();
        await screen.findByText('8.11-ins');
        expect(screen.getByRole('button', { name: /save follow-up/i })).toBeDisabled();
    });

    it('generates a draft into an editable field', async () => {
        renderModal();
        await screen.findByText('8.11-ins');
        await userEvent.click(screen.getByRole('button', { name: /^generate$/i }));
        const box = await screen.findByLabelText(/follow-up message/i);
        expect(box.value).toContain('8.11-ins');
        expect(box.value).toContain('Hi Dawna,');
    });

    it('saves the EDITED text, not a regenerated one', async () => {
        renderModal();
        await screen.findByText('8.11-ins');
        await userEvent.click(screen.getByRole('button', { name: /^generate$/i }));
        const box = await screen.findByLabelText(/follow-up message/i);
        // fireEvent.change sets a controlled textarea in one commit; typing
        // character-by-character after clear() leaves it mid-render.
        fireEvent.change(box, { target: { value: 'Reworded by hand.' } });
        const save = screen.getByRole('button', { name: /save follow-up/i });
        await waitFor(() => expect(save).toBeEnabled());
        await userEvent.click(save);
        await waitFor(() => expect(createFollowUp).toHaveBeenCalled());
        expect(createFollowUp.mock.calls[0][0].body_markdown).toBe('Reworded by hand.');
    });

    it('carries the guide, community and recipients onto the saved record', async () => {
        renderModal();
        await screen.findByText('8.11-ins');
        await userEvent.click(screen.getByRole('button', { name: /^generate$/i }));
        await userEvent.click(await screen.findByRole('button', { name: /save follow-up/i }));
        await waitFor(() => expect(createFollowUp).toHaveBeenCalled());
        const payload = createFollowUp.mock.calls[0][0];
        expect(payload.meeting_minutes_id).toBe('m1');
        expect(payload.interview_guide_id).toBe('g1');
        expect(payload.community_name).toBe('Faculty Development');
        expect(payload.addressed_to_ids).toEqual(['p1']);
        expect(payload.covers_evidence_identifiers).toHaveLength(2);
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
