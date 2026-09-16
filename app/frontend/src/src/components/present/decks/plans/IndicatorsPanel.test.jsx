/**
 * Indicators furthered: one section per campus, current campus highlighted,
 * each chip navigates through the shared goal-view route helper.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import IndicatorsPanel from './IndicatorsPanel';

const CAMPUSES = [
    { name: 'San Francisco State University', abbreviation: 'sfsu' },
    { name: 'Sonoma State University', abbreviation: 'ssu' },
    { name: 'Cal State East Bay', abbreviation: 'csueb' },
];
const EVIDENCES = [
    { unique_id: 'y1', indicator_key: '7.5-web', status_level: 'Established', campus_abbrev: 'sfsu', year_name: '2025-2026' },
    { unique_id: 'y2', indicator_key: '7.6-web', status_level: 'Not Started', campus_abbrev: 'csueb', year_name: '2025-2026' },
    { unique_id: 'y3', indicator_key: '9.3-ins', status_level: 'Defined', campus_abbrev: 'sfsu', year_name: '2024-2025' },
];

function LocationEcho() {
    const loc = useLocation();
    return <div data-testid="loc">{loc.pathname}</div>;
}

const renderPanel = (props = {}) => render(
    <ChakraProvider>
        <MemoryRouter initialEntries={['/sfsu/present/plans/p1']}>
            <Routes>
                <Route path="*" element={(
                    <>
                        <IndicatorsPanel plan={{ unique_id: 'p1', name: 'Plan' }} evidences={EVIDENCES}
                                         campuses={CAMPUSES} campus="sfsu" year="2025-2026" {...props} />
                        <LocationEcho />
                    </>
                )} />
            </Routes>
        </MemoryRouter>
    </ChakraProvider>,
);

describe('IndicatorsPanel', () => {
    it('shows one section per campus and leaves earlier years out', () => {
        renderPanel();
        const sfsu = screen.getByRole('region', { name: 'San Francisco State University indicators' });
        expect(within(sfsu).getByText('7.5-web')).toBeInTheDocument();
        expect(within(sfsu).queryByText('9.3-ins')).not.toBeInTheDocument();
        const csueb = screen.getByRole('region', { name: 'Cal State East Bay indicators' });
        expect(within(csueb).getByText('7.6-web')).toBeInTheDocument();
        const ssu = screen.getByRole('region', { name: 'Sonoma State University indicators' });
        expect(within(ssu).getByText('none')).toBeInTheDocument();
    });

    it('navigates to the indicator at its own campus', async () => {
        renderPanel();
        await userEvent.click(screen.getByRole('button', { name: 'Open indicator 7.6-web at Cal State East Bay' }));
        expect(screen.getByTestId('loc')).toHaveTextContent('/csueb/');
        expect(screen.getByTestId('loc')).toHaveTextContent('/7/');
    });

    it('says so when the plan furthers nothing this year', () => {
        renderPanel({ evidences: [] });
        expect(screen.getByText(/furthers no indicator for 2025-2026/)).toBeInTheDocument();
    });
});
