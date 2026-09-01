/**
 * The shared loading treatments. What is worth pinning is the accessibility
 * contract, because that is what a hand-rolled Spinner in 48 places kept
 * getting differently: the wait must be announced, the spinner graphic must not
 * be, and it must be possible to render one inside an existing live region
 * without nesting two.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

import { Loading, LoadingArea } from './Loading';

const renderIn = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('Loading (inline)', () => {
    it('announces the wait as a polite status', () => {
        renderIn(<Loading label="Loading documentation…" />);
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(status).toHaveTextContent('Loading documentation…');
    });

    it('hides the spinner graphic from assistive tech', () => {
        const { container } = renderIn(<Loading label="Loading records…" />);
        // The label carries the meaning; the animation is decoration.
        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('can opt out of its own live region', () => {
        // For use inside a region the caller already owns — otherwise the
        // announcement nests, and a nested live region is unreliable.
        renderIn(<Loading label="Loading…" live={false} />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('defaults to a generic label', () => {
        renderIn(<Loading />);
        expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    });
});

describe('LoadingArea', () => {
    it('announces the wait as a polite status', () => {
        renderIn(<LoadingArea label="Loading the campus plan…" />);
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(status).toHaveTextContent('Loading the campus plan…');
    });

    it('can opt out of its own live region', () => {
        renderIn(<LoadingArea label="Loading…" live={false} />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});
