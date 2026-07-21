import React, { useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Image,
    Input,
    Text,
    VStack,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import sfbrnLogoLightEg from '../assets/img/sfbrn-logo-light-eg.svg';

// Sign-in screen rendered by AuthGate whenever enforcement is on and no
// session exists. Local credentials today; when campus SSO lands this gains a
// "Sign in with SSO" button alongside (see app/auth/providers/).
function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            // AuthGate re-renders into the app on authUser change.
        } catch (err) {
            const code = err?.response?.data?.error;
            setError(
                code === 'invalid_credentials'
                    ? 'Invalid email or password.'
                    : 'Unable to sign in. Please try again or contact the ATI coordinator.'
            );
            setSubmitting(false);
        }
    };

    return (
        <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={4}>
            <Box
                as="main"
                w="100%"
                maxW="400px"
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="md"
                overflow="hidden"
            >
                {/* Brand band — mirrors the app header */}
                <Box bg="teal.800" px={6} py={5}>
                    <Image src={sfbrnLogoLightEg} alt="SFBRN Evidence Graph" height="24px" draggable={false} />
                    <Box
                        mt="5px"
                        height="2px"
                        borderRadius="full"
                        bgGradient="linear(to-r, teal.400, purple.400, coral.400)"
                        aria-hidden="true"
                    />
                    <Text
                        mt="3px"
                        fontSize="2xs"
                        color="whiteAlpha.800"
                        textTransform="uppercase"
                        letterSpacing="0.18em"
                    >
                        Accessible Technology Initiative
                    </Text>
                </Box>

                <Box px={6} py={6}>
                    <Heading as="h1" size="sm" color="gray.800" mb={4}>
                        Sign in
                    </Heading>

                    {error && (
                        <Alert status="error" borderRadius="md" fontSize="sm" mb={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                    Email
                                </FormLabel>
                                <Input
                                    size="sm"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                    Password
                                </FormLabel>
                                <Input
                                    size="sm"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </FormControl>
                            <Button
                                type="submit"
                                colorScheme="teal"
                                size="sm"
                                isLoading={submitting}
                                loadingText="Signing in…"
                            >
                                Sign in
                            </Button>
                        </VStack>
                    </form>

                    <Text fontSize="xs" color="gray.600" mt={4}>
                        email fontaine@sfsu.edu for access.
                    </Text>
                </Box>
            </Box>
        </Flex>
    );
}

export default Login;
