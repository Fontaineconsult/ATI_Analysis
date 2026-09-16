import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// axios v1 ships as ESM and CRA's Jest does not transform node_modules, so a bare
// jest.mock('axios') SyntaxErrors. Inline factory, per the project convention.
jest.mock('axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('../../../services/api/post', () => ({
    createIntellectualSource: jest.fn(),
}));
jest.mock('../../../services/api/put', () => ({
    updateIntellectualSource: jest.fn(),
}));

import { createIntellectualSource } from '../../../services/api/post';
import { updateIntellectualSource } from '../../../services/api/put';
import IntellectualSourceForm from './IntellectualSourceForm';

const renderForm = (props = {}) =>
    render(
        <ChakraProvider>
            <IntellectualSourceForm isOpen onClose={jest.fn()} onSaved={jest.fn()} {...props} />
        </ChakraProvider>,
    );

beforeEach(() => jest.clearAllMocks());

describe('IntellectualSourceForm', () => {
    it('refuses to submit without a name', async () => {
        renderForm();
        fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
        await waitFor(() => expect(createIntellectualSource).not.toHaveBeenCalled());
    });

    it('creates with only the fields that were filled in', async () => {
        createIntellectualSource.mockResolvedValue({ data: { item: { unique_id: 'x1' } } });
        const onSaved = jest.fn();
        renderForm({ onSaved });

        fireEvent.change(screen.getByPlaceholderText(/how to interpret a vpat/i),
            { target: { value: 'A New Source' } });
        fireEvent.change(screen.getByLabelText(/^publisher$/i), { target: { value: 'Some Press' } });
        fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

        // Wait on onSaved, not on the API call: the call fires first and the payload
        // assertions below would race the async continuation that reports the result.
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ unique_id: 'x1' }));
        const payload = createIntellectualSource.mock.calls[0][0];
        expect(payload.name).toBe('A New Source');
        expect(payload.publisher).toBe('Some Press');
        // Untouched boxes are left off a create payload entirely rather than sent empty.
        expect(payload).not.toHaveProperty('author');
        expect(payload).not.toHaveProperty('raw_text');
    });

    it('sends empty strings on edit, so a field can be cleared', async () => {
        updateIntellectualSource.mockResolvedValue({ data: { item: { unique_id: 'x1' } } });
        renderForm({
            existingItem: { unique_id: 'x1', name: 'Existing', author: 'A. Author', publisher: 'P' },
        });

        fireEvent.change(screen.getByLabelText(/^author$/i), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(updateIntellectualSource).toHaveBeenCalled());
        const [uid, payload] = updateIntellectualSource.mock.calls[0];
        expect(uid).toBe('x1');
        // Present-but-empty is what clears it; absent would leave it alone.
        expect(payload.author).toBe('');
        expect(payload.publisher).toBe('P');
    });

    it('reports the capture date on the source text field once there is text', () => {
        renderForm({
            existingItem: {
                unique_id: 'x1', name: 'Existing', raw_text: 'hello', raw_text_captured: '2026-09-16',
            },
        });
        expect(screen.getByText(/last captured 2026-09-16/i)).toBeInTheDocument();
        expect(screen.getByText(/re-pasting the same text does not move the capture date/i)).toBeInTheDocument();
    });

    it('keeps the modal open when the create fails', async () => {
        createIntellectualSource.mockRejectedValue(new Error('name already exists'));
        const onClose = jest.fn();
        renderForm({ onClose });

        fireEvent.change(screen.getByPlaceholderText(/how to interpret a vpat/i),
            { target: { value: 'Dupe' } });
        fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

        await waitFor(() => expect(createIntellectualSource).toHaveBeenCalled());
        expect(onClose).not.toHaveBeenCalled();
    });
});
