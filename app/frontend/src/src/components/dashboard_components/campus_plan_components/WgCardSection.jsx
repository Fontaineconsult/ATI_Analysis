import React, { useId } from 'react';
import { Badge, Box, Button, Heading, HStack, Text } from '@chakra-ui/react';

/**
 * One zone of a working-group card (people, indicators, communities, follow-up).
 * The header is a gray.100 strip with gray.300 rules and a 4px left edge in the
 * working group's accent, carrying the design-sense signature section look
 * (uppercase teal.700 h4), an optional count pill, a one-line summary, and an
 * action. gray.100 + gray.300 is the design-sense pairing that groups on a white
 * card; a solid teal.700 band was too heavy and a bare rule too faint.
 *
 * Props:
 *   title        heading text
 *   count        optional number, shown as a pill inside the heading
 *   summary      optional short text after the heading ("3 leads · 9 members")
 *   action       optional node at the right of the header (use SectionButton)
 *   accentColor  the working group's accent (campusPlanConfig)
 *   labelPrefixId  optional id of the card title; prefixed to the section's accessible
 *                name so repeated zones across cards are distinct landmarks
 *                (axe landmark-unique): "Web Leads & Members", not "Leads & Members" x4
 *   children     the zone's body
 */
function WgCardSection({ title, count, summary, action, accentColor = 'teal.500', labelPrefixId, children, ...rest }) {
    const headingId = useId();
    const labelledBy = labelPrefixId ? `${labelPrefixId} ${headingId}` : headingId;
    return (
        <Box as="section" aria-labelledby={labelledBy} {...rest}>
            <HStack
                px={5}
                py={2}
                spacing={2}
                flexWrap="wrap"
                rowGap={1}
                bg="gray.100"
                borderTopWidth="1px"
                borderBottomWidth="1px"
                borderColor="gray.300"
                borderLeftWidth="4px"
                borderLeftColor={accentColor}
            >
                <Heading
                    as="h4"
                    id={headingId}
                    size="xs"
                    color="teal.700"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    display="flex"
                    alignItems="center"
                    gap={2}
                >
                    {title}
                    {count != null && (
                        <Badge colorScheme="teal" variant="outline" bg="white" borderRadius="full" px={2} fontSize="2xs">
                            {count}
                        </Badge>
                    )}
                </Heading>
                {summary && (
                    <Text fontSize="xs" color="gray.600" whiteSpace="nowrap">{summary}</Text>
                )}
                <Box flex="1" minW="12px" />
                {action}
            </HStack>
            {children}
        </Box>
    );
}

// The header action: an outline button with an explicit white fill
// (design-sense "Component boundaries").
export function SectionButton({ children, ...rest }) {
    return (
        <Button size="xs" variant="outline" colorScheme="teal" bg="white" {...rest}>
            {children}
        </Button>
    );
}

export default WgCardSection;
