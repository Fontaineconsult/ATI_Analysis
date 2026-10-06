import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import WgCardSection, { SectionButton } from './WgCardSection';

describe('WgCardSection', () => {
    it('renders a section labelled by its h4 heading, with count pill, summary and action', () => {
        render(
            <ChakraProvider>
                <WgCardSection
                    title="Prioritized Indicators"
                    count={3}
                    summary="1 at risk"
                    action={<SectionButton>+ Add Indicator</SectionButton>}
                >
                    <p>body</p>
                </WgCardSection>
            </ChakraProvider>,
        );
        const heading = screen.getByRole('heading', { level: 4, name: /prioritized indicators/i });
        expect(heading).toHaveTextContent('3');
        expect(screen.getByRole('region', { name: /prioritized indicators/i })).toContainElement(screen.getByText('body'));
        expect(screen.getByText('1 at risk')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '+ Add Indicator' })).toBeInTheDocument();
    });

    it('prefixes the region name with the card title so repeated zones stay distinct', () => {
        render(
            <ChakraProvider>
                <h3 id="card-web">Web</h3>
                <WgCardSection title="Leads & Members" labelPrefixId="card-web" />
                <h3 id="card-ins">Instructional Materials</h3>
                <WgCardSection title="Leads & Members" labelPrefixId="card-ins" />
            </ChakraProvider>,
        );
        expect(screen.getByRole('region', { name: 'Web Leads & Members' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Instructional Materials Leads & Members' })).toBeInTheDocument();
    });

    it('omits the count and summary when none is given', () => {
        render(<ChakraProvider><WgCardSection title="Leads & Members" /></ChakraProvider>);
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(/^Leads & Members$/);
    });
});
