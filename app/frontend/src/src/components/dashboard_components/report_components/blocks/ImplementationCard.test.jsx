/**
 * The implementation card's prop axes — the differences between the report and approval
 * renderings, expressed as independent props rather than a variant string.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import ImplementationCard from './ImplementationCard';

const IMPL = {
    type: 'Process', unique_id: 'i1', title: 'Homepage audit process',
    description: 'Quarterly audit.', strength: 2, control: 'external',
    satisfies: ['evidence:1.2-web:established:3'],
    rationale: 'Covers the recurring audit half of the indicator.',
    documents: [], webpages: [], notes: [], messages: [], metrics: [],
    participants: [], dimensions: [], remediates_interfaces: [],
};
const REQS = { 'evidence:1.2-web:established:3': { requirement: 'A documented procedure exists.' } };

const renderCard = (props = {}) => render(
    <ChakraProvider>
        <ImplementationCard impl={IMPL} requirementsByHandle={REQS} {...props} />
    </ChakraProvider>
);

describe('ImplementationCard', () => {
    it('shows the rationale callout only under the review lens', () => {
        const { unmount } = renderCard();
        expect(screen.queryByText(/covers the recurring audit half/i)).toBeNull();
        unmount();

        renderCard({ showRationale: true });
        expect(screen.getByText(/covers the recurring audit half/i)).toBeInTheDocument();
    });

    it('lists claimed requirements only under the review lens, resolving handles to text', () => {
        const { unmount } = renderCard();
        expect(screen.queryByText(/A documented procedure exists/)).toBeNull();
        unmount();

        renderCard({ showClaimedRequirements: true });
        expect(screen.getByText(/A documented procedure exists/)).toBeInTheDocument();
    });

    it('badges an unrated link only when asked, and only when strength is null', () => {
        const { unmount } = renderCard({ showUnratedBadge: true });
        expect(screen.queryByText('unrated')).toBeNull();   // strength is 2
        unmount();

        renderCard({ showUnratedBadge: true, impl: { ...IMPL, strength: null } });
        expect(screen.getByText('unrated')).toBeInTheDocument();
    });

    it('makes the title interactive only when a navigation callback is given', async () => {
        const onOpen = jest.fn();
        const { unmount } = renderCard({ onOpenImplementation: onOpen });
        await userEvent.click(screen.getByRole('heading', { name: /homepage audit process/i }));
        expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'i1' }));
        unmount();

        renderCard();
        const heading = screen.getByRole('heading', { name: /homepage audit process/i });
        expect(heading).not.toHaveStyle('cursor: pointer');
    });

    it('marks a retired card with the .retired class, never opacity', () => {
        renderCard({ impl: { ...IMPL, retired: true } });
        const card = screen.getByRole('heading', { name: /homepage audit process/i })
            .closest('.retired');
        expect(card).not.toBeNull();
        expect(card).not.toHaveStyle('opacity: 0.7');
    });
});
