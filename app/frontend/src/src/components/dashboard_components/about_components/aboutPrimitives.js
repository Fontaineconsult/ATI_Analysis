import React from 'react';
import {
    Box,
    Heading,
    Text,
    Badge,
    Image,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    VStack,
} from '@chakra-ui/react';

// Shared content primitives for the About area, following the canonical
// Card/Section language in claude_files/design-sense.md.

export const AboutPage = ({ title, lede, children }) => (
    <Box textAlign="left">
        <Heading as="h2" size="lg" color="gray.800" mb={2}>
            {title}
        </Heading>
        {/* Brand rule — the SFBRN accent trio */}
        <Box
            height="3px"
            width="72px"
            borderRadius="full"
            bgGradient="linear(to-r, teal.500, purple.500, coral.500)"
            mb={3}
            aria-hidden="true"
        />
        {lede && (
            <Text fontSize="sm" color="gray.600" mb={5} maxW="80ch">
                {lede}
            </Text>
        )}
        <VStack align="stretch" spacing={4}>
            {children}
        </VStack>
    </Box>
);

export const Card = ({ title, children, ...rest }) => (
    <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        boxShadow="sm"
        p={5}
        {...rest}
    >
        {title && (
            <Heading as="h3" size="sm" color="teal.700" mb={3}>
                {title}
            </Heading>
        )}
        {children}
    </Box>
);

export const Section = ({ title, children }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
        <Heading
            as="h4"
            size="xs"
            color="teal.700"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={2}
        >
            {title}
        </Heading>
        {children}
    </Box>
);

export const Para = ({ children, ...rest }) => (
    <Text fontSize="sm" color="gray.700" mb={2} {...rest}>
        {children}
    </Text>
);

// Monospace relationship/identifier pattern block, e.g.
//   SuccessIndicator <-[tracks]- YearSuccessEvidence -[evidence_in_year]-> AcademicYear
export const CodePattern = ({ children }) => (
    <Box
        bg="gray.100"
        px={3}
        py={2}
        my={2}
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        fontFamily="mono"
        fontSize="xs"
        color="gray.800"
        overflowX="auto"
        whiteSpace="pre"
    >
        {children}
    </Box>
);

// A diagram with an accessible caption, framed to match the Card language.
// `src` is an imported SVG/PNG URL; `alt` is the screen-reader summary (the SVG's
// own <title>/<desc> aren't exposed when it's loaded as an <img>, so alt carries
// the meaning). The surrounding prose holds the detail — the figure is supplementary.
export const Figure = ({ src, alt, caption, maxW = '720px' }) => (
    <Box as="figure" m={0} my={2}>
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={3}
            overflowX="auto"
        >
            <Image
                src={src}
                alt={alt}
                width="100%"
                maxW={maxW}
                mx="auto"
                height="auto"
                display="block"
            />
        </Box>
        {caption && (
            <Text as="figcaption" fontSize="xs" color="gray.500" mt={1.5} textAlign="center">
                {caption}
            </Text>
        )}
    </Box>
);

// A defined term with its explanation — the workhorse of the glossary and
// concept sections.
export const TermDef = ({ term, badge, children }) => (
    <Box mb={3}>
        <Text fontSize="sm" fontWeight="bold" color="teal.700" as="span">
            {term}
        </Text>
        {badge && (
            <Badge ml={2} fontSize="2xs" colorScheme="gray" textTransform="uppercase">
                {badge}
            </Badge>
        )}
        <Text fontSize="sm" color="gray.700" mt={0.5}>
            {children}
        </Text>
    </Box>
);

// Renders a vocabulary dict ({key: label}) or array as a two/three-column
// table. `notes` is an optional {key: explanation} map for a third column.
export const VocabTable = ({ vocab, keyHeader = 'Stored value', labelHeader = 'Label', notes, notesHeader = 'Meaning' }) => {
    if (!vocab) {
        return (
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
                Vocabulary not loaded yet.
            </Text>
        );
    }
    const rows = Array.isArray(vocab)
        ? vocab.map((v) => [v, null])
        : Object.entries(vocab);
    const hasNotes = Boolean(notes);
    return (
        <TableContainer>
            <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                    <Tr>
                        <Th fontSize="2xs">{keyHeader}</Th>
                        {!Array.isArray(vocab) && <Th fontSize="2xs">{labelHeader}</Th>}
                        {hasNotes && <Th fontSize="2xs">{notesHeader}</Th>}
                    </Tr>
                </Thead>
                <Tbody>
                    {rows.map(([key, label]) => (
                        <Tr key={key}>
                            <Td fontFamily="mono" fontSize="xs" color="gray.600">
                                {key}
                            </Td>
                            {!Array.isArray(vocab) && (
                                <Td fontSize="sm" color="gray.800">
                                    {label}
                                </Td>
                            )}
                            {hasNotes && (
                                <Td fontSize="xs" color="gray.600" whiteSpace="normal" maxW="48ch">
                                    {notes[key] || ''}
                                </Td>
                            )}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
