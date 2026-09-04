import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import QueryViewer, { sortQueries } from './QueryViewer';

const QUERIES = [
    {
        unique_id: 'q-settled',
        question: 'What faculty-facing accessibility workshops exist at CSU East Bay?',
        category: 'information_gap',
        status: 'settled',
        answer: 'Online Campus runs a semester calendar of accessibility sessions.',
        raised_by: 'Daniel Fontaine',
        answerable_by: [],
        date_raised: '2026-07-24',
    },
    {
        unique_id: 'q-open',
        question: 'Did the Title II workshop series run again in AY 2025-26?',
        detail: 'Found on the Programs page after the interview.',
        category: 'artifact_request',
        status: 'open',
        raised_by: 'Daniel Fontaine',
        answerable_by: ['Dawna Komorosky'],
        date_raised: '2026-09-01',
    },
];

const renderViewer = (queries = QUERIES) => render(
    <ChakraProvider><QueryViewer queries={queries} /></ChakraProvider>,
);

describe('sortQueries', () => {
    it('puts open work above settled history', () => {
        expect(sortQueries(QUERIES).map((q) => q.unique_id)).toEqual(['q-open', 'q-settled']);
    });

    it('does not mutate the input', () => {
        const input = [...QUERIES];
        sortQueries(input);
        expect(input.map((q) => q.unique_id)).toEqual(['q-settled', 'q-open']);
    });

    it('survives an unknown status rather than dropping the row', () => {
        const odd = [{ unique_id: 'x', question: 'q', status: 'weird' }];
        expect(sortQueries(odd)).toHaveLength(1);
    });
});

describe('QueryViewer', () => {
    it('shows each question with its status and category', async () => {
        renderViewer();
        expect(screen.getByText(/Did the Title II workshop series/)).toBeInTheDocument();
        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('Settled')).toBeInTheDocument();
    });

    it('labels the artifact_request category rather than showing the raw key', () => {
        renderViewer();
        expect(screen.getByText('Artifact Request')).toBeInTheDocument();
        expect(screen.queryByText('artifact_request')).not.toBeInTheDocument();
    });

    it('shows the answer on a settled query', () => {
        renderViewer();
        expect(screen.getByText(/Online Campus runs a semester calendar/)).toBeInTheDocument();
    });

    it('names who owes the answer when that is recorded', () => {
        renderViewer();
        expect(screen.getByTitle(/Dawna Komorosky owes the answer/)).toBeInTheDocument();
    });

    it('attributes who raised it', () => {
        renderViewer();
        expect(screen.getAllByText(/raised by Daniel Fontaine/)).toHaveLength(2);
    });

    it('says so plainly when nothing is pointed at this evidence', () => {
        renderViewer([]);
        expect(screen.getByText(/no pending questions are pointed at this evidence/i)).toBeInTheDocument();
    });
});
