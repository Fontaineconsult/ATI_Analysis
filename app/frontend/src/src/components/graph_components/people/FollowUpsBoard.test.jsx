import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// CRA's resetMocks wipes factory implementations, so they are set in beforeEach.
jest.mock('../../../services/api/get', () => ({
    __esModule: true,
    fetchFollowUpBoard: jest.fn(),
}));
jest.mock('../../../services/api/put', () => ({
    __esModule: true,
    markFollowUpSent: jest.fn(),
    setFollowUpStatus: jest.fn(),
    setFollowUpNextContact: jest.fn(),
    settleQuery: jest.fn(),
    updateRecommendation: jest.fn(),
    updateConcern: jest.fn(),
}));

import { fetchFollowUpBoard } from '../../../services/api/get';
import {
    markFollowUpSent, setFollowUpStatus, setFollowUpNextContact,
    settleQuery, updateRecommendation, updateConcern,
} from '../../../services/api/put';
import FollowUpsBoard from './FollowUpsBoard';
import { contactDueState, todayIso } from './NextContactEditor';

const ROWS = [
    {
        unique_id: 'f-overdue', subject: 'Chase: Faculty Development',
        status: 'sent', community: 'Faculty Development', campus: 'csueb',
        meeting_id: 'm1', meeting_title: 'Meeting Notes: Faculty Development',
        meeting_date: '2026-08-31', date_sent: '2026-09-01', generated_at: '2026-09-01T10:00:00',
        next_contact_date: '2020-01-01', next_contact_note: 'Nudge for the attendee list.',
        next_contact_with: [{ unique_id: 'p1', name: 'Dawna Komorosky' }],
        addressed_to: [{ unique_id: 'p1', name: 'Dawna Komorosky' }],
        included_queries: [{
            unique_id: 'q1', question: 'Did the training run again?',
            status: 'open', answerable_by: ['Dawna Komorosky'],
        }],
        included_recommendations: [{
            unique_id: 'r1', recommendation: 'Add a focus area.', status: 'open',
        }],
        included_concerns: [],
        total_asks: 2, resolved_asks: 0, open_asks: 2, all_resolved: false, reply_count: 0,
    },
    {
        unique_id: 'f-scheduled', subject: 'Chase: Library',
        status: 'sent', community: 'Library', campus: 'sfsu',
        meeting_id: 'm2', meeting_title: 'Meeting Notes: Library', meeting_date: '2026-09-02',
        date_sent: '2026-09-03', generated_at: '2026-09-03T10:00:00',
        next_contact_date: '2099-01-01', next_contact_note: null,
        next_contact_with: [], addressed_to: [{ unique_id: 'p2', name: 'Robin Lee' }],
        included_queries: [{
            unique_id: 'q2', question: 'Who owns the alt-media queue?',
            status: 'settled', answerable_by: [],
        }],
        included_recommendations: [],
        included_concerns: [{ unique_id: 'c1', concern: 'Turnover risk.', status: 'open' }],
        total_asks: 2, resolved_asks: 1, open_asks: 1, all_resolved: false, reply_count: 1,
    },
    {
        unique_id: 'f-draft', subject: 'Chase: Sonoma IT',
        status: 'draft', community: null, campus: null,
        meeting_id: 'm3', meeting_title: 'Meeting Notes: Sonoma IT', meeting_date: null,
        date_sent: null, generated_at: '2026-09-05T10:00:00',
        next_contact_date: null, next_contact_note: null,
        next_contact_with: [], addressed_to: [{ unique_id: 'p9', name: 'Pat Quinn' }],
        included_queries: [], included_recommendations: [], included_concerns: [],
        total_asks: 0, resolved_asks: 0, open_asks: 0, all_resolved: false, reply_count: 0,
    },
];

const renderBoard = () => render(
    <MemoryRouter initialEntries={['/csueb/ati-explorer/people/follow-ups']}>
        <ChakraProvider>
            <Routes>
                <Route path="/:campus/ati-explorer/people/follow-ups" element={<FollowUpsBoard />} />
            </Routes>
        </ChakraProvider>
    </MemoryRouter>,
);

beforeEach(() => {
    fetchFollowUpBoard.mockResolvedValue({ data: { follow_ups: ROWS } });
    markFollowUpSent.mockResolvedValue({ data: { status: 'sent' } });
    setFollowUpStatus.mockResolvedValue({ data: { status: 'draft' } });
    setFollowUpNextContact.mockResolvedValue({ data: {} });
    settleQuery.mockResolvedValue({ data: {} });
    updateRecommendation.mockResolvedValue({ data: {} });
    updateConcern.mockResolvedValue({ data: {} });
});

describe('contactDueState', () => {
    it('separates overdue, due today, and scheduled', () => {
        expect(contactDueState('2020-01-01')).toBe('overdue');
        expect(contactDueState(todayIso())).toBe('due');
        expect(contactDueState('2099-01-01')).toBe('scheduled');
        expect(contactDueState(null)).toBeNull();
    });
});

describe('FollowUpsBoard', () => {
    it('fetches for the URL campus and leads with due contacts and open tasks', async () => {
        renderBoard();
        await waitFor(() => expect(fetchFollowUpBoard).toHaveBeenCalledWith('csueb'));

        expect(await screen.findByText('Chase: Faculty Development')).toBeInTheDocument();
        expect(screen.getByText('Chases')).toBeInTheDocument();
        expect(screen.getByText('Contacts due')).toBeInTheDocument();
        // Open tasks across SENT chases: 2 + 1 = 3, same as the chase count —
        // both stats read '3'.
        expect(screen.getByText('Open tasks')).toBeInTheDocument();
        expect(screen.getAllByText('3')).toHaveLength(2);
    });

    it('splits the board into To send above and the Sent box below', async () => {
        renderBoard();
        // The heading counts verify the partition: 1 draft, 2 sent.
        const toSend = await screen.findByRole('heading', { name: /to send \(1\)/i });
        const sentBox = screen.getByRole('heading', { name: /^sent \(2\)/i });
        // Document order: drafts first, the sent box below them.
        expect(toSend.compareDocumentPosition(sentBox) & Node.DOCUMENT_POSITION_FOLLOWING)
            .toBeTruthy();
    });

    it('names the empty section rather than collapsing it', async () => {
        fetchFollowUpBoard.mockResolvedValue({
            data: { follow_ups: ROWS.filter((r) => r.status === 'sent') },
        });
        renderBoard();
        expect(await screen.findByText('Nothing waiting to go out.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /^sent \(2\)/i })).toBeInTheDocument();
    });

    it('measures each chase by task resolution, not by replies', async () => {
        renderBoard();
        expect(await screen.findByText('0/2 tasks resolved')).toBeInTheDocument();
        expect(screen.getByText('1/2 tasks resolved')).toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
        // Reply count stays informational only — no awaiting-reply verdict.
        expect(screen.getByText('1 reply')).toBeInTheDocument();
        expect(screen.queryByText(/awaiting reply/i)).not.toBeInTheDocument();
    });

    it('shows the tasks a chase carried, with type, status, and owner', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        expect(showButtons[0]).toHaveTextContent('Show tasks (2 open of 2)');
        await userEvent.click(showButtons[0]);

        expect(screen.getByText('Did the training run again?')).toBeInTheDocument();
        expect(screen.getByText('Add a focus area.')).toBeInTheDocument();
        expect(screen.getByText('Query')).toBeInTheDocument();
        expect(screen.getByText('Recommendation')).toBeInTheDocument();
        expect(screen.getByText(/answer owed by Dawna Komorosky/)).toBeInTheDocument();
    });

    it('settles a query with the answer that came back', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        await userEvent.click(showButtons[0]);
        await userEvent.click(screen.getByRole('button', { name: /settle…/i }));

        const answerInput = screen.getByLabelText('Answer for: Did the training run again?');
        await userEvent.type(answerInput, 'It ran again in May.');
        await userEvent.click(screen.getByRole('button', { name: /save answer/i }));

        await waitFor(() => expect(settleQuery).toHaveBeenCalledWith('q1', 'It ran again in May.'));
        await waitFor(() => expect(fetchFollowUpBoard).toHaveBeenCalledTimes(2));
    });

    it('refuses to settle a query without an answer', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        await userEvent.click(showButtons[0]);
        await userEvent.click(screen.getByRole('button', { name: /settle…/i }));
        expect(screen.getByRole('button', { name: /save answer/i })).toBeDisabled();
    });

    it('marks a recommendation addressed from the board', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        await userEvent.click(showButtons[0]);
        await userEvent.click(screen.getByRole('button', { name: /addressed/i }));

        await waitFor(() =>
            expect(updateRecommendation).toHaveBeenCalledWith('r1', { status: 'addressed' }));
    });

    it('converts a concern from the board', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        await userEvent.click(showButtons[1]);
        await userEvent.click(screen.getByRole('button', { name: /converted/i }));

        await waitFor(() =>
            expect(updateConcern).toHaveBeenCalledWith('c1', { status: 'converted' }));
    });

    it('offers no resolve controls on an already-settled task', async () => {
        renderBoard();
        const showButtons = await screen.findAllByRole('button', { name: /show tasks/i });
        await userEvent.click(showButtons[1]);

        expect(screen.getByText('Who owns the alt-media queue?')).toBeInTheDocument();
        expect(screen.getByText('settled')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /settle…/i })).not.toBeInTheDocument();
    });

    it('marks a draft sent and reloads', async () => {
        renderBoard();
        await userEvent.click(await screen.findByRole('button', { name: /mark sent/i }));
        await waitFor(() => expect(markFollowUpSent).toHaveBeenCalledWith('f-draft'));
        await waitFor(() => expect(fetchFollowUpBoard).toHaveBeenCalledTimes(2));
    });

    it('pulls a sent chase back to draft', async () => {
        renderBoard();
        const backButtons = await screen.findAllByRole('button', { name: /back to draft/i });
        await userEvent.click(backButtons[0]);
        await waitFor(() =>
            expect(setFollowUpStatus).toHaveBeenCalledWith('f-overdue', 'draft'));
    });

    it('schedules a next contact with a date and a person', async () => {
        renderBoard();
        // Only the draft row has no reminder, so its button is the single
        // "Schedule contact" on the board.
        await userEvent.click(await screen.findByRole('button', { name: /schedule contact/i }));

        await userEvent.type(screen.getByLabelText('Next contact date'), '2026-10-01');
        await userEvent.click(screen.getByRole('checkbox', { name: /pat quinn/i }));
        await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

        await waitFor(() => expect(setFollowUpNextContact).toHaveBeenCalledWith('f-draft', {
            contactDate: '2026-10-01',
            note: null,
            personIds: ['p9'],
        }));
        await waitFor(() => expect(fetchFollowUpBoard).toHaveBeenCalledTimes(2));
    });

    it('clears a standing reminder', async () => {
        renderBoard();
        const editButtons = await screen.findAllByRole('button', { name: /^edit$/i });
        await userEvent.click(editButtons[0]);
        await userEvent.click(screen.getByRole('button', { name: /clear reminder/i }));

        await waitFor(() =>
            expect(setFollowUpNextContact).toHaveBeenCalledWith('f-overdue', {}));
    });

    it('says where follow-ups come from when the board is empty', async () => {
        fetchFollowUpBoard.mockResolvedValue({ data: { follow_ups: [] } });
        renderBoard();
        expect(await screen.findByText(/composed with the \/follow-up skill/i)).toBeInTheDocument();
    });
});
