/**
 * Smoke tests for Settings → Organizations: loads the campus overview, renders
 * the roster with typed badges and employee counts, creates via the add form.
 */
jest.mock('../../../services/api/get', () => ({
    fetchLocalOrgUnits: jest.fn(),
}));
jest.mock('../../../services/api/post', () => ({
    createOrgUnit: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({
    deleteOrgUnit: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Organizations from './Organizations';
import { fetchLocalOrgUnits } from '../../../services/api/get';
import { createOrgUnit } from '../../../services/api/post';

const UNITS = [
    { name: 'History', unique_id: 'd1', location: 'HUM 301', type: 'Department', employee_count: 2 },
    { name: 'College of Science', unique_id: 'c1', location: null, type: 'College', employee_count: 0 },
];

const renderAtCampus = () =>
    render(
        <MemoryRouter initialEntries={['/sfsu/dashboard/settings/organizations']}>
            <Routes>
                <Route path="/:campus/dashboard/settings/:section" element={<Organizations />} />
            </Routes>
        </MemoryRouter>
    );

describe('Organizations settings section', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetchLocalOrgUnits.mockResolvedValue({ status: 'success', data: UNITS });
    });

    it('loads the overview for the URL campus and renders the roster', async () => {
        renderAtCampus();

        await waitFor(() => expect(fetchLocalOrgUnits).toHaveBeenCalledWith('sfsu'));
        expect(await screen.findByText('History')).toBeInTheDocument();
        expect(screen.getByText('College of Science')).toBeInTheDocument();
        // 'Department'/'College' appear both as select options and row badges.
        expect(screen.getAllByText('Department').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('College').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('creates a unit from the add form, linked to the campus', async () => {
        createOrgUnit.mockResolvedValue({ status: 'success' });
        renderAtCampus();
        await screen.findByText('History');

        await userEvent.type(screen.getByLabelText('Organization name'), 'Anthropology');
        await userEvent.click(screen.getByRole('button', { name: /add/i }));

        await waitFor(() =>
            expect(createOrgUnit).toHaveBeenCalledWith('department', 'Anthropology', {
                location: null,
                campus: 'sfsu',
            })
        );
        // Reloaded after the create.
        expect(fetchLocalOrgUnits).toHaveBeenCalledTimes(2);
    });

    it('shows the empty state when the campus has no units', async () => {
        fetchLocalOrgUnits.mockResolvedValue({ status: 'success', data: [] });
        renderAtCampus();

        expect(
            await screen.findByText(/No departments or colleges recorded/i)
        ).toBeInTheDocument();
    });
});
