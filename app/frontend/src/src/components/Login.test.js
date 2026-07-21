/**
 * Login screen — brand lockup + form basics. The screen only renders in the
 * app when AUTH_ENFORCED is on, so this RTL render is its regression net.
 */
jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({ login: jest.fn() }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import Login from './Login';

describe('Login', () => {
    it('renders the Evidence Graph lockup as the brand image', () => {
        render(<ChakraProvider><Login /></ChakraProvider>);
        const logo = screen.getByRole('img', { name: 'SFBRN Evidence Graph' });
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', expect.stringContaining('sfbrn-logo-light-eg'));
    });

    it('renders the credential form', () => {
        render(<ChakraProvider><Login /></ChakraProvider>);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
});
