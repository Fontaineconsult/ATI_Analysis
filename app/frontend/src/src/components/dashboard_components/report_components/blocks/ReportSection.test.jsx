/**
 * The section wrapper's semantic contract. The approval page's first standalone template
 * dropped as="section" and aria-labelledby; this file is why that cannot ship again from
 * either look.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ReportSection from './ReportSection';

const renderSection = (props) => render(
    <ChakraProvider>
        <ReportSection id="sec-test" title="People" {...props}>
            <div>body</div>
        </ReportSection>
    </ChakraProvider>
);

describe('ReportSection', () => {
    it.each([[false], [true]])('is a labelled landmark in both looks (banded=%s)', (banded) => {
        renderSection({ banded });
        const region = document.querySelector('section[aria-labelledby="sec-test"]');
        expect(region).not.toBeNull();
        expect(screen.getByRole('heading', { level: 2, name: 'People' }))
            .toHaveAttribute('id', 'sec-test');
    });

    it('renders the count inside the title — one convention, both looks', () => {
        renderSection({ count: 4, banded: true });
        expect(screen.getByRole('heading', { name: 'People (4)' })).toBeInTheDocument();
    });

    it('renders the subtitle when given', () => {
        renderSection({ subtitle: 'Who answers for this.', banded: true });
        expect(screen.getByText('Who answers for this.')).toBeInTheDocument();
    });
});
