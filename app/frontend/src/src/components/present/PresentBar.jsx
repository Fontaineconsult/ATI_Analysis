import React from 'react';
import {
    Box, Button, HStack, IconButton, Popover, PopoverArrow, PopoverBody, PopoverContent,
    PopoverTrigger, Select, Table, Tbody, Td, Text, Tr,
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import { PRESENT_KEYS } from './usePresentKeys';
import { SCALE_STEPS } from './presentScale';

/**
 * The one strip of chrome meeting mode keeps: where we are (campus, year,
 * working-group filter), who is notating, the type scale, fullscreen, the
 * shortcut list, and Exit. 40 px tall, brand blue, white text.
 */
function PresentBar({
    campusName, year, workingGroups = [], wgFilter, onWgFilter,
    notatingAs, scale, onScaleStep, onFullscreen, onExit,
}) {
    return (
        <HStack as="header" h="40px" px={3} bg="teal.800" color="white" spacing={3} flexShrink={0}>
            <Text fontSize="sm" fontWeight="bold" whiteSpace="nowrap" noOfLines={1}>{campusName}</Text>
            <Text fontSize="sm" color="teal.50" whiteSpace="nowrap">{year}</Text>
            <Select
                size="xs" w="auto" minW="150px" bg="white" color="gray.800" borderColor="teal.600"
                aria-label="Working group filter"
                value={wgFilter}
                onChange={(e) => onWgFilter(e.target.value)}
            >
                <option value="all">All working groups</option>
                {workingGroups.map((w) => <option key={w.slug} value={w.slug}>{w.name}</option>)}
            </Select>

            <Box flex="1" />

            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide"
                  bg="whiteAlpha.300" px={2} py={0.5} borderRadius="sm" whiteSpace="nowrap">
                Meeting mode
            </Text>
            <Text fontSize="xs" color="teal.50" whiteSpace="nowrap" noOfLines={1}>
                Notating as <Text as="span" color="white" fontWeight="semibold">{notatingAs || 'nobody'}</Text>
            </Text>

            <HStack spacing={0} aria-label="Type scale" role="group">
                <Button size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.300' }}
                        onClick={() => onScaleStep(-1)} isDisabled={scale === SCALE_STEPS[0]} aria-label="Smaller text">
                    A−
                </Button>
                <Button size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.300' }}
                        onClick={() => onScaleStep(1)} isDisabled={scale === SCALE_STEPS[SCALE_STEPS.length - 1]} aria-label="Larger text">
                    A+
                </Button>
            </HStack>

            <Button size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.300' }}
                    onClick={onFullscreen} title="Fullscreen (f)">
                Fullscreen
            </Button>

            <Popover placement="bottom-end">
                <PopoverTrigger>
                    <IconButton size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.300' }}
                                icon={<QuestionOutlineIcon />} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" />
                </PopoverTrigger>
                <PopoverContent color="gray.800" w="auto">
                    <PopoverArrow />
                    <PopoverBody>
                        <Table size="sm" variant="unstyled">
                            <Tbody>
                                {PRESENT_KEYS.map((k) => (
                                    <Tr key={k.keys}>
                                        <Td py={1} px={2} fontFamily="mono" fontSize="xs" fontWeight="semibold">{k.keys}</Td>
                                        <Td py={1} px={2} fontSize="xs">{k.what}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </PopoverBody>
                </PopoverContent>
            </Popover>

            <Button size="xs" bg="white" color="teal.800" fontWeight="bold" _hover={{ bg: 'teal.50' }}
                    onClick={onExit} title="Exit meeting mode (Esc)">
                Exit
            </Button>
        </HStack>
    );
}

export default PresentBar;
