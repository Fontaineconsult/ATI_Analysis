import React, { useState } from 'react';
import {
    Box,
    Button,
    HStack,
    Tag,
    TagCloseButton,
    TagLabel,
    Text,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

import { attachmentLabelText } from './documentationConfig';

/**
 * "Attached to" — narrow the list by what a record documents, rather than by
 * what kind of record it is.
 *
 * This is the facet that makes the area usable for its actual job. Type answers
 * "is this a Note or a Document"; almost nobody needs that. What people come
 * here asking is "show me everything we hold on our policies", or "what
 * documents our Services", and the answer crosses every type.
 *
 * A DISCLOSURE, not a chip row. There are 28 possible parent labels against a
 * 420px column, so the always-open chip row used for types would push the list
 * itself below the fold. Collapsed, this is one button; open, it is the whole
 * taxonomy grouped by family. Active selections render as removable chips
 * OUTSIDE the disclosure, because a filtered list that looks unfiltered when the
 * panel is shut is how people end up mistrusting a count.
 *
 * The panel is conditionally rendered rather than animated open with <Collapse>.
 * Chakra's Collapse leaves the children mounted and hidden, which puts a second
 * set of the same chip names in the accessibility tree for every consumer that
 * walks it — and made the open state untestable, since the framer-motion
 * transition never resolves under jsdom.
 *
 * Families come from the data (summarizeAttachments), so an empty family is
 * absent rather than a row of zeroes, and a parent label the config has not been
 * taught about still appears under "Other" instead of vanishing.
 */
function DocumentationAttachmentFilter({
    facets = { families: [] },
    selected = [],
    onToggle,
    onToggleGroup,
    onClear,
}) {
    const [open, setOpen] = useState(false);
    const { families } = facets;

    // Selections can outlive the facet that produced them — switch to the
    // Annotations tab while "attached to Law" is on and no family lists Law any
    // more. The chips must still render, or the filter becomes unremovable.
    const hasSelection = selected.length > 0;
    if (!families.length && !hasSelection) return null;

    return (
        <Box mb={2}>
            <HStack spacing={1} mb={hasSelection ? 1 : 0}>
                <Button
                    size="xs"
                    variant="outline"
                    colorScheme={hasSelection ? 'teal' : 'gray'}
                    rightIcon={open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                >
                    Attached to{hasSelection ? ` (${selected.length})` : ''}
                </Button>
                {hasSelection && (
                    <Button size="xs" variant="ghost" colorScheme="gray" onClick={onClear}>
                        Clear
                    </Button>
                )}
            </HStack>

            {hasSelection && (
                <Wrap spacing={1} mb={1}>
                    {selected.map((label) => (
                        <WrapItem key={label}>
                            <Tag size="sm" colorScheme="teal" borderRadius="full">
                                <TagLabel>{attachmentLabelText(label)}</TagLabel>
                                <TagCloseButton
                                    aria-label={`Remove ${attachmentLabelText(label)} filter`}
                                    onClick={() => onToggle?.(label)}
                                />
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            )}

            {open && (
                <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    bg="gray.50"
                    p={2}
                    mb={2}
                >
                    {families.map((family) => {
                        const memberLabels = family.members.map((m) => m.label);
                        const allOn = memberLabels.every((l) => selected.includes(l));
                        return (
                            <Box key={family.key} mb={2} _last={{ mb: 0 }}>
                                <HStack spacing={2} mb={1} align="baseline">
                                    <Text
                                        fontSize="2xs"
                                        textTransform="uppercase"
                                        letterSpacing="wide"
                                        color="gray.600"
                                    >
                                        {family.label}
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="link"
                                        colorScheme="teal"
                                        fontSize="2xs"
                                        onClick={() => onToggleGroup?.(memberLabels)}
                                        aria-pressed={allOn}
                                    >
                                        {allOn ? 'none' : `all (${family.total})`}
                                    </Button>
                                </HStack>
                                <Wrap spacing={1}>
                                    {family.members.map((member) => {
                                        const active = selected.includes(member.label);
                                        return (
                                            <WrapItem key={member.label}>
                                                <Button
                                                    size="xs"
                                                    variant={active ? 'solid' : 'outline'}
                                                    colorScheme={active ? family.colorScheme : 'gray'}
                                                    onClick={() => onToggle?.(member.label)}
                                                    aria-pressed={active}
                                                    fontWeight="normal"
                                                >
                                                    {member.text} ({member.count})
                                                </Button>
                                            </WrapItem>
                                        );
                                    })}
                                </Wrap>
                            </Box>
                        );
                    })}
                    {!families.length && (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic">
                            Nothing in this tab is attached to anything.
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default DocumentationAttachmentFilter;
