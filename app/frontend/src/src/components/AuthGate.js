import React from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

// Renders the app only once identity is settled. Sits above all data-fetching
// providers (index.js) so nothing requests data unauthenticated.
//
// Transparent when the server's AUTH_ENFORCED kill-switch is off (dev mode):
// no login screen, straight through.
function AuthGate({ children }) {
    const { authUser, enforced, authLoading } = useAuth();

    if (authLoading) {
        return (
            <Flex minH="100vh" align="center" justify="center" bg="gray.50">
                <VStack spacing={3}>
                    <Spinner size="xl" color="teal.500" />
                    <Text fontSize="sm" color="gray.600">Loading…</Text>
                </VStack>
            </Flex>
        );
    }

    if (!enforced || authUser) {
        return children;
    }

    return <Login />;
}

export default AuthGate;
