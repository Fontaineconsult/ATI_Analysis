import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AnswerableBy from './AnswerableBy';

const renderIt = (props) =>
    render(<ChakraProvider><AnswerableBy {...props} /></ChakraProvider>);

describe('AnswerableBy', () => {
    it('renders a badge per person when given the read-layer object shape', () => {
        renderIt({
            people: [
                { unique_id: 'a', name: 'John Lynch', title: 'Director', email: 'j@x.edu' },
                { unique_id: 'b', name: 'Sandra Ayala', title: 'Professor', email: 's@x.edu' },
            ],
        });
        expect(screen.getByText('John Lynch owes the answer')).toBeInTheDocument();
        expect(screen.getByText('Sandra Ayala owes the answer')).toBeInTheDocument();
    });

    // The working-group compound query projects ap.name, so the same component is fed
    // bare strings. Handing an object to a JSX child throws, which is why both shapes
    // are normalised in one place rather than at each call site.
    it('renders the same badge when given the compound-query string shape', () => {
        renderIt({ people: ['Brent Boyer'] });
        expect(screen.getByText('Brent Boyer owes the answer')).toBeInTheDocument();
    });

    it('renders both people when a question sits with two of them', () => {
        renderIt({ people: ['Amanda McGowan', 'Brent Boyer'] });
        expect(screen.getByText('Amanda McGowan owes the answer')).toBeInTheDocument();
        expect(screen.getByText('Brent Boyer owes the answer')).toBeInTheDocument();
    });

    // ChakraProvider puts a hidden env span in the container, so the absence of a
    // badge is the assertion, not an empty container.
    it('renders nothing when nobody owes the answer', () => {
        renderIt({ people: [] });
        expect(screen.queryByText(/owes the answer/)).not.toBeInTheDocument();
    });

    it('renders nothing when the field is absent', () => {
        renderIt({});
        expect(screen.queryByText(/owes the answer/)).not.toBeInTheDocument();
    });

    it('drops entries with no resolvable name rather than rendering an empty badge', () => {
        renderIt({ people: [{ unique_id: 'a' }, null] });
        expect(screen.queryByText(/owes the answer/)).not.toBeInTheDocument();
    });
});
