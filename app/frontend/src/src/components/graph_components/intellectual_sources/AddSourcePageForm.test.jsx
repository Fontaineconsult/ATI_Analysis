import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

jest.mock('axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));
jest.mock('../../../services/api/put', () => ({
    attachSourcePage: jest.fn(),
}));

import { attachSourcePage } from '../../../services/api/put';
import AddSourcePageForm from './AddSourcePageForm';

const renderForm = (props = {}) =>
    render(
        <ChakraProvider>
            <AddSourcePageForm isOpen sourceUniqueId="s1" onClose={jest.fn()} onSaved={jest.fn()} {...props} />
        </ChakraProvider>,
    );

const response = (created) => ({
    data: { item: { attached_page: { unique_id: 'w1', created } } },
});

beforeEach(() => jest.clearAllMocks());

describe('AddSourcePageForm', () => {
    it('will not submit without a URL', async () => {
        renderForm();
        fireEvent.click(screen.getByRole('button', { name: /add page/i }));
        await waitFor(() => expect(attachSourcePage).not.toHaveBeenCalled());
    });

    it('sends the URL and trims it', async () => {
        attachSourcePage.mockResolvedValue(response(true));
        const onSaved = jest.fn();
        renderForm({ onSaved });

        fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.edu/i),
            { target: { value: '  https://example.edu/page  ' } });
        fireEvent.click(screen.getByRole('button', { name: /add page/i }));

        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(attachSourcePage).toHaveBeenCalledWith('s1', 'https://example.edu/page', '');
    });

    it('passes an optional name through', async () => {
        attachSourcePage.mockResolvedValue(response(true));
        renderForm();

        fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.edu/i),
            { target: { value: 'https://example.edu/page' } });
        fireEvent.change(screen.getByPlaceholderText(/ICT Procurement Procedures/i),
            { target: { value: 'A Named Page' } });
        fireEvent.click(screen.getByRole('button', { name: /add page/i }));

        await waitFor(() => expect(attachSourcePage)
            .toHaveBeenCalledWith('s1', 'https://example.edu/page', 'A Named Page'));
    });

    /**
     * Created and cross-linked are different facts. A URL already in the graph is linked
     * rather than duplicated, and the caller should be told which they got, because a
     * duplicate would split the page's Source Text.
     */
    it('says when an existing page was cross-linked rather than created', async () => {
        attachSourcePage.mockResolvedValue(response(false));
        renderForm();

        fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.edu/i),
            { target: { value: 'https://example.edu/already-here' } });
        fireEvent.click(screen.getByRole('button', { name: /add page/i }));

        expect(await screen.findByText(/existing page linked/i)).toBeInTheDocument();
        expect(await screen.findByText(/cross-linked rather than duplicated/i)).toBeInTheDocument();
    });

    it('stays open when the attach fails', async () => {
        attachSourcePage.mockRejectedValue(new Error('bad url'));
        const onClose = jest.fn();
        renderForm({ onClose });

        fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.edu/i),
            { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: /add page/i }));

        await waitFor(() => expect(attachSourcePage).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
    });
});
