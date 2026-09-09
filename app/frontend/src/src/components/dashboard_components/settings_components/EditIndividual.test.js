/**
 * Smoke tests for Settings → Edit Individual, focused on the Position
 * Description section: records load for the person being edited, a new record
 * saves immediately (independent of the main form submit), and the section is
 * absent in create mode because there is no person to anchor to yet.
 */
jest.mock('../../../services/api/get', () => ({
    getPositionDescriptions: jest.fn(),
}));
jest.mock('../../../services/api/post', () => ({
    createIndividual: jest.fn(),
    addPositionDescription: jest.fn(),
    uploadFile: jest.fn(),
}));
jest.mock('../../../services/api/put', () => ({
    updateIndividual: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({
    deletePositionDescription: jest.fn(),
}));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({ campuses: [], campusesLoading: false }),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditIndividual from './EditIndividual';
import { getPositionDescriptions } from '../../../services/api/get';
import { addPositionDescription } from '../../../services/api/post';
import { deletePositionDescription } from '../../../services/api/delete';

const PERSON = {
    name: 'Jane Doe',
    employee_id: 'emp-1',
    email: 'jane@sfsu.edu',
    title: 'Coordinator',
    workingGroups: [],
};

const RECORDS = [
    {
        unique_id: 'pd1',
        name: 'Coordinator PD',
        effective_date: '2026-07-01',
        depreciated: false,
        file: { storage_key: 'abc', download_url: '/ati/data-api/v1/files/abc?name=pd.pdf' },
    },
    { unique_id: 'pd2', name: 'Old Coordinator PD', depreciated: true, file: null },
];

const renderModal = (individualData) =>
    render(
        <EditIndividual
            isOpen
            onClose={jest.fn()}
            individualData={individualData}
            onSave={jest.fn()}
        />
    );

describe('Edit Individual — position descriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getPositionDescriptions.mockResolvedValue(RECORDS);
    });

    it('loads and lists the person’s records, marking superseded ones', async () => {
        renderModal(PERSON);

        await waitFor(() => expect(getPositionDescriptions).toHaveBeenCalledWith('emp-1'));
        expect(await screen.findByText('Coordinator PD')).toBeInTheDocument();
        expect(screen.getByText('Old Coordinator PD')).toBeInTheDocument();
        expect(screen.getByText('Superseded')).toBeInTheDocument();
        expect(screen.getByText('Coordinator PD').closest('a'))
            .toHaveAttribute('href', expect.stringContaining('/files/abc'));
    });

    it('saves a new record immediately and refreshes the list', async () => {
        addPositionDescription.mockResolvedValue({ status: 'success' });
        renderModal(PERSON);
        await screen.findByText('Coordinator PD');

        await userEvent.type(
            screen.getByPlaceholderText(/Alt Media Coordinator PD/i),
            'New Coordinator PD'
        );
        await userEvent.click(screen.getByRole('button', { name: /add position description/i }));

        await waitFor(() =>
            expect(addPositionDescription).toHaveBeenCalledWith('emp-1', { name: 'New Coordinator PD' })
        );
        await waitFor(() => expect(getPositionDescriptions).toHaveBeenCalledTimes(2));
    });

    it('removes a record from the list', async () => {
        deletePositionDescription.mockResolvedValue({ status: 'success' });
        renderModal(PERSON);
        await screen.findByText('Old Coordinator PD');

        const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
        await userEvent.click(removeButtons[1]);

        await waitFor(() => expect(deletePositionDescription).toHaveBeenCalledWith('pd2'));
        await waitFor(() =>
            expect(screen.queryByText('Old Coordinator PD')).not.toBeInTheDocument()
        );
    });

    it('hides the section in create mode — no person to anchor to yet', () => {
        renderModal(null);

        expect(screen.queryByText('Position Description')).not.toBeInTheDocument();
        expect(getPositionDescriptions).not.toHaveBeenCalled();
    });
});
