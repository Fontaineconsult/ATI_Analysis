import React from 'react';
import { Flex, Select, Tag, TagCloseButton, TagLabel, VStack } from '@chakra-ui/react';

/**
 * Add-and-remove multi-select: a dropdown that appends to a tag list. Options
 * already selected drop out of the dropdown; each tag carries its own remove
 * button. Extracted from MeetingMinutesForm once InterviewGuideForm needed the
 * same control (third copy rule).
 *
 * Props:
 *   options      [{value, label}]
 *   selectedIds  the selected values, in order
 *   onChange     (nextIds) => void
 *   addLabel     dropdown placeholder
 *   colorScheme  Chakra scheme for the tags (default teal)
 */
export default function TagMultiSelect({ options, selectedIds, onChange, addLabel, colorScheme = 'teal' }) {
    const byId = new Map(options.map((o) => [o.value, o.label]));
    const available = options.filter((o) => !selectedIds.includes(o.value));
    return (
        <VStack align="stretch" spacing={2}>
            {selectedIds.length > 0 && (
                <Flex gap={1.5} wrap="wrap">
                    {selectedIds.map((id) => (
                        <Tag key={id} size="sm" colorScheme={colorScheme} variant="subtle">
                            <TagLabel>{byId.get(id) || id}</TagLabel>
                            <TagCloseButton
                                aria-label={`Remove ${byId.get(id) || id}`}
                                onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                            />
                        </Tag>
                    ))}
                </Flex>
            )}
            <Select
                size="sm"
                maxW="360px"
                value=""
                placeholder={addLabel}
                onChange={(e) => { if (e.target.value) onChange([...selectedIds, e.target.value]); }}
                isDisabled={available.length === 0}
            >
                {available.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </Select>
        </VStack>
    );
}
