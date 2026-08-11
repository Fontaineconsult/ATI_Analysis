/**
 * The derived "Stewarded" tab: loads the ICT footprint behind the indicator's
 * internally-controlled evidence when a yearIdentifier is supplied, and stays
 * absent otherwise.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/get', () => ({
    fetchStewardedIct: jest.fn(),
}));
jest.mock('../../functional_components/DescriptorHelp', () => ({
    HelpBox: () => null,
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import IndicatorAssetsPanel from './IndicatorAssetsPanel';
import { fetchStewardedIct } from '../../../services/api/get';

const STEWARDED = {
    status: 'success',
    data: {
        people: ['Alex Cherian'],
        units: [{ name: 'J. Paul Leonard Library', type: 'Department' }],
        assets: [
            {
                asset_identifier: 'quartex-sfsu', title: 'Quartex', scope: 'campus',
                stewards: [{ name: 'J. Paul Leonard Library', holder_type: 'Department', capacities: ['procured', 'used'] }],
            },
        ],
    },
};

const renderPanel = (props) =>
    render(
        <ChakraProvider>
            <MemoryRouter initialEntries={['/sfsu/x']}>
                <Routes>
                    <Route path="/:campus/x" element={<IndicatorAssetsPanel {...props} />} />
                </Routes>
            </MemoryRouter>
        </ChakraProvider>
    );

describe('IndicatorAssetsPanel stewarded tab', () => {
    beforeEach(() => {
        fetchStewardedIct.mockReset();
    });

    it('loads and renders the derived tab with unit attribution', async () => {
        fetchStewardedIct.mockResolvedValue(STEWARDED);
        renderPanel({ yearIdentifier: '2025-2026-7.11-ins-sfsu' });

        await waitFor(() => expect(fetchStewardedIct).toHaveBeenCalledWith('2025-2026-7.11-ins-sfsu'));
        expect(await screen.findByRole('tab', { name: /unit portfolio \(1\)/i })).toBeInTheDocument();
    });

    it('renders no stewarded tab without a yearIdentifier', () => {
        renderPanel({});
        expect(fetchStewardedIct).not.toHaveBeenCalled();
        expect(screen.queryByRole('tab', { name: /unit portfolio/i })).toBeNull();
    });

    it('renders no stewarded tab when the derivation is empty', async () => {
        fetchStewardedIct.mockResolvedValue({ status: 'success', data: { people: [], units: [], assets: [] } });
        renderPanel({ yearIdentifier: '2025-2026-1.1-web-sfsu' });

        await waitFor(() => expect(fetchStewardedIct).toHaveBeenCalled());
        expect(screen.queryByRole('tab', { name: /unit portfolio/i })).toBeNull();
    });
});
