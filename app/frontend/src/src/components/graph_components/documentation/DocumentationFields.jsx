import React from 'react';
import {
    Badge,
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Select,
    SimpleGrid,
    Switch,
    Text,
    Textarea,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

import Section from '../common/Section';
import { groupEditFields } from './documentationConfig';

/**
 * The editable fields for one documentation record, rendered INLINE.
 *
 * Not a dialog, deliberately. This area exists to curate documentation, and the
 * job is "work down a filtered list fixing records" — a dialog puts an open and
 * a close between you and every edit, and hides the list you are working
 * through. The controls are the panel.
 *
 * Everything is controlled from the panel above, which owns the draft and the
 * save. This component only renders and reports changes, so the same fields can
 * be shown read-only later without touching it.
 *
 * A changed field is marked rather than merely being different from a value you
 * can no longer see: when you are moving quickly, "what am I about to write"
 * has to be answerable at a glance.
 */
function DocumentationFields({ fields, values, changed = [], onChange, isDisabled = false }) {
    const groups = groupEditFields(fields);
    const isChanged = (name) => changed.includes(name);

    const handle = (name) => (e) => {
        onChange(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    };

    const label = (field) => (
        <HStack spacing={2} align="baseline" mb={1}>
            <FormLabel fontSize="xs" color="gray.600" textTransform="uppercase" m={0}>
                {field.label}
            </FormLabel>
            {isChanged(field.name) && (
                <Badge colorScheme="orange" fontSize="2xs" borderRadius="full">changed</Badge>
            )}
        </HStack>
    );

    const control = (field) => {
        const value = values[field.name] ?? '';

        if (field.type === 'boolean') {
            return (
                <Switch
                    isChecked={Boolean(values[field.name])}
                    onChange={handle(field.name)}
                    colorScheme="teal"
                    size="sm"
                    isDisabled={isDisabled}
                    aria-label={field.label}
                />
            );
        }

        // Three options, not a checkbox: null means NEVER ASSESSED, which is a
        // different answer from "assessed, and not deprecated".
        if (field.type === 'tristate') {
            return (
                <Select
                    size="sm"
                    value={value}
                    onChange={handle(field.name)}
                    isDisabled={isDisabled}
                    aria-label={field.label}
                    borderColor={isChanged(field.name) ? 'orange.300' : 'gray.300'}
                >
                    <option value="">Not assessed</option>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </Select>
            );
        }

        if (field.type === 'textarea') {
            return (
                <Textarea
                    size="sm"
                    rows={field.rows || 3}
                    value={value}
                    onChange={handle(field.name)}
                    isDisabled={isDisabled}
                    aria-label={field.label}
                    borderColor={isChanged(field.name) ? 'orange.300' : 'gray.300'}
                />
            );
        }

        const input = (
            <Input
                type={field.type === 'date' ? 'date' : 'text'}
                size="sm"
                value={value}
                onChange={handle(field.name)}
                isDisabled={isDisabled}
                aria-label={field.label}
                borderColor={isChanged(field.name) ? 'orange.300' : 'gray.300'}
            />
        );

        // A locator you can follow without leaving the field you are editing —
        // checking whether a URL is really dead is most of the work here.
        if (field.openable && /^https?:\/\//i.test(value)) {
            return (
                <InputGroup size="sm">
                    {input}
                    <InputRightElement width="2rem">
                        <IconButton
                            as="a"
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            icon={<ExternalLinkIcon />}
                            aria-label={`Open ${field.label} in a new tab`}
                        />
                    </InputRightElement>
                </InputGroup>
            );
        }

        return input;
    };

    return (
        <>
            {groups.map((group) => (
                <Section key={group.key} title={group.label}>
                    {/* Switches read better side by side; everything else gets
                        the full width because the values are long. */}
                    <SimpleGrid
                        columns={group.key === 'status' ? { base: 1, md: 2 } : 1}
                        spacing={3}
                    >
                        {group.fields.map((field) => (
                            <FormControl key={field.name}>
                                {label(field)}
                                {control(field)}
                                {field.help && (
                                    <FormHelperText fontSize="2xs" color="gray.600" mt={1}>
                                        {field.help}
                                    </FormHelperText>
                                )}
                            </FormControl>
                        ))}
                    </SimpleGrid>
                </Section>
            ))}

            {!groups.length && (
                <Box p={3}>
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                        This type has no editable fields.
                    </Text>
                </Box>
            )}
        </>
    );
}

export default DocumentationFields;
