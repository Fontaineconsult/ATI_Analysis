import React from 'react';
import {
    Box,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    SimpleGrid,
    Text,
    VStack,
} from '@chakra-ui/react';
import GovernanceTypeBadge from './GovernanceTypeBadge';
import { GOVERNANCE_TYPE_ORDER, getGovernanceTypeConfig } from './governanceTypes';

/**
 * Two-step add flow's first step: pick a governance type. Renders the 6
 * types as cards with a short description so first-time users understand
 * what to choose. On select, calls onPick(typeKey) and closes.
 */
function GovernanceTypePicker({ isOpen, onClose, onPick }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Heading as="h3" size="md" color="gray.800">
                        What kind of governance item?
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mt={1} fontWeight="normal">
                        Pick the category that best fits. You can edit details next.
                    </Text>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {GOVERNANCE_TYPE_ORDER.map((typeKey) => {
                            const config = getGovernanceTypeConfig(typeKey);
                            if (!config) return null;
                            return (
                                <Box
                                    key={typeKey}
                                    as="button"
                                    onClick={() => onPick(typeKey)}
                                    p={4}
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    borderRadius="lg"
                                    bg="white"
                                    textAlign="left"
                                    _hover={{ borderColor: 'teal.400', bg: 'teal.50', transform: 'translateY(-1px)' }}
                                    _active={{ transform: 'translateY(0)' }}
                                    transition="all 0.15s"
                                >
                                    <VStack align="stretch" spacing={2}>
                                        <GovernanceTypeBadge type={typeKey} />
                                        <Heading as="h4" size="sm" color="gray.800">
                                            {config.label}
                                        </Heading>
                                        <Text fontSize="xs" color="gray.600">
                                            {config.description}
                                        </Text>
                                    </VStack>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default GovernanceTypePicker;
