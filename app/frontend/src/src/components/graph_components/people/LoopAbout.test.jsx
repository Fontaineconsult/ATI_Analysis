import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import LoopAbout from './LoopAbout';

const renderPage = () => render(
    <ChakraProvider>
        <LoopAbout />
    </ChakraProvider>,
);

describe('LoopAbout', () => {
    it('walks the loop in order: prepare, record, chase, track, close', () => {
        renderPage();
        const stages = ['Prepare', 'Record', 'Chase', 'Track and resolve', 'Close the cycle'];
        const found = stages.map((name) => screen.getByRole('heading', { name }));
        // Document order matches loop order.
        for (let i = 1; i < found.length; i += 1) {
            expect(found[i - 1].compareDocumentPosition(found[i])
                & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        }
    });

    it('names each skill at the stage it runs', () => {
        renderPage();
        expect(screen.getByText('/stakeholder-interview')).toBeInTheDocument();
        expect(screen.getByText('/ontology-ingest')).toBeInTheDocument();
        expect(screen.getByText('/follow-up')).toBeInTheDocument();
        expect(screen.getByText('/maturity-status-reviewer')).toBeInTheDocument();
    });

    it('separates what the skills own from what the app owns', () => {
        renderPage();
        // Four skill stages, one app stage.
        expect(screen.getAllByText('Claude Code skill')).toHaveLength(4);
        expect(screen.getAllByText('this app')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: /what the app owns/i })).toBeInTheDocument();
    });

    it('defines the artifacts, with the three task types marked', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: /the artifacts/i })).toBeInTheDocument();
        ['InterviewGuide', 'MeetingMinutes', 'FollowUp'].forEach((term) => {
            expect(screen.getByText(term)).toBeInTheDocument();
        });
        expect(screen.getAllByText('task')).toHaveLength(3);
    });
});
