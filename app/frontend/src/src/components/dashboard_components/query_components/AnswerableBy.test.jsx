import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AnswerableBy from './AnswerableBy';

const renderIt = (props) =>
    render(<ChakraProvider><AnswerableBy {...props} /></ChakraProvider>);

describe('AnswerableBy', () => {
    it('renders a pill per person when given the read-layer object shape', () => {
        renderIt({
            people: [
                { unique_id: 'a', name: 'John Lynch', title: 'Director', email: 'j@x.edu' },
                { unique_id: 'b', name: 'Sandra Ayala', title: 'Professor', email: 's@x.edu' },
            ],
        });
        expect(screen.getByText('John Lynch')).toBeInTheDocument();
        expect(screen.getByText('Sandra Ayala')).toBeInTheDocument();
    });

    // The pill carries only the name, so what it means lives in the title, the same way
    // ElevationBadge does it. Without this the badge is just a name next to another name.
    it('explains what the pill means in its title', () => {
        renderIt({ people: ['John Lynch'] });
        expect(screen.getByTitle('John Lynch owes the answer on this question.')).toBeInTheDocument();
    });

    // The working-group compound query projects ap.name, so the same component is fed
    // bare strings. Handing an object to a JSX child throws, which is why both shapes
    // are normalised in one place rather than at each call site.
    it('renders the same pill when given the compound-query string shape', () => {
        renderIt({ people: ['Brent Boyer'] });
        expect(screen.getByText('Brent Boyer')).toBeInTheDocument();
    });

    it('renders both people when a question sits with two of them', () => {
        renderIt({ people: ['Amanda McGowan', 'Brent Boyer'] });
        expect(screen.getByText('Amanda McGowan')).toBeInTheDocument();
        expect(screen.getByText('Brent Boyer')).toBeInTheDocument();
    });

    // Asserted on the title rather than an empty container, because ChakraProvider puts
    // a hidden env span in the container, and rather than on the name, because a name is
    // not distinctive enough to prove the pill is what is absent.
    it('renders nothing when nobody owes the answer', () => {
        renderIt({ people: [] });
        expect(screen.queryByTitle(/owes the answer/)).not.toBeInTheDocument();
    });

    it('renders nothing when the field is absent', () => {
        renderIt({});
        expect(screen.queryByTitle(/owes the answer/)).not.toBeInTheDocument();
    });

    it('drops entries with no resolvable name rather than rendering an empty pill', () => {
        renderIt({ people: [{ unique_id: 'a' }, null] });
        expect(screen.queryByTitle(/owes the answer/)).not.toBeInTheDocument();
    });
});
