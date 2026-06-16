import React from 'react';
import {
    Badge,
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Link,
    Select,
    Switch,
    Text,
    Textarea,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';

/**
 * Shared canon primitives for the Supporting Documentation viewers
 * (Documents / Webpages / Notes / Messages / Metrics). One source for the form
 * field + switch + action styling (design-sense §4.3) and the compact display
 * row, so the five viewers stay tight and aligned instead of each re-inlining
 * big p={4} cards and ad-hoc labels.
 */

// Canon field label — matches CreateImplementation / the detail-panel forms.
export function FieldLabel({ children, ...rest }) {
    return (
        <FormLabel fontSize="xs" color="gray.600" fontWeight="semibold" mb={1} {...rest}>
            {children}
        </FormLabel>
    );
}

// Labeled input / textarea / select with the canon look. `as` picks the control.
export function Field({
    label, name, value, onChange, type = 'text', as = 'input',
    options, rows, placeholder, isRequired, ...rest
}) {
    const common = {
        size: 'sm', name, value, onChange, placeholder,
        borderColor: 'gray.300',
        _focus: { borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' },
    };
    let control;
    if (as === 'textarea') control = <Textarea rows={rows || 2} {...common} {...rest} />;
    else if (as === 'select') control = <Select {...common} {...rest}>{options}</Select>;
    else control = <Input type={type} {...common} {...rest} />;
    return (
        <FormControl isRequired={isRequired}>
            <FieldLabel>{label}</FieldLabel>
            {control}
        </FormControl>
    );
}

// Compact boolean toggle row used for the report/deprecation flags.
export function SwitchRow({ name, label, isChecked, onChange, colorScheme = 'teal', emphasize }) {
    return (
        <HStack spacing={2}>
            <Switch size="sm" name={name} isChecked={isChecked} onChange={onChange} colorScheme={colorScheme} />
            <Text fontSize="xs" color={emphasize ? 'gray.700' : 'gray.600'} fontWeight={emphasize ? 'semibold' : 'normal'}>
                {label}
            </Text>
        </HStack>
    );
}

// Inline edit-form container with the teal edit accent. Children are stacked.
export function FormShell({ onSubmit, children }) {
    return (
        <Box as="form" onSubmit={onSubmit} p={3} bg="white" borderRadius="md" borderWidth="1px" borderColor="teal.200" boxShadow="sm">
            <VStack align="stretch" spacing={3}>{children}</VStack>
        </Box>
    );
}

// Save / Cancel footer — teal solid save + ghost cancel (design-sense §4.3).
export function FormActions({ isSubmitting, onCancel, submitLabel, loadingText }) {
    return (
        <HStack justify="flex-end" spacing={2}>
            <Button size="sm" variant="ghost" onClick={onCancel} isDisabled={isSubmitting}>Cancel</Button>
            <Button size="sm" type="submit" colorScheme="teal" isLoading={isSubmitting} loadingText={loadingText}>
                {submitLabel}
            </Button>
        </HStack>
    );
}

// Right-aligned Add button row. The viewer's count is shown on its tab, so the
// section header is intentionally omitted here.
export function AddRow({ onAdd, label, canAdd, isAdding }) {
    if (!canAdd) return null;
    return (
        <HStack justify="flex-end" mb={2}>
            <Button size="xs" colorScheme="teal" leftIcon={<AddIcon />} onClick={onAdd} isDisabled={isAdding}>
                {label}
            </Button>
        </HStack>
    );
}

// Compact display row: title (+ optional badge) with an Edit affordance, then
// dense meta/children below.
export function ItemShell({ titleNode, badge, onEdit, canEdit, children }) {
    return (
        <Box px={3} py={2} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" _hover={{ boxShadow: 'sm' }}>
            <HStack justify="space-between" align="start" spacing={2}>
                <HStack spacing={2} minW={0}>
                    {titleNode}
                    {badge}
                </HStack>
                {canEdit && onEdit && (
                    <IconButton aria-label="Edit" icon={<EditIcon />} size="xs" variant="ghost" colorScheme="teal" onClick={onEdit} flexShrink={0} />
                )}
            </HStack>
            {children != null && <Box mt={1}>{children}</Box>}
        </Box>
    );
}

export function MetaLine({ children }) {
    return <Text fontSize="2xs" color="gray.500" mt={1}>{children}</Text>;
}

// Compact monospace file path + external URI link.
export function PathLinks({ filePath, uriPath }) {
    if (!filePath && !uriPath) return null;
    return (
        <HStack spacing={3} mt={1} flexWrap="wrap">
            {filePath && (
                <Text fontSize="2xs" fontFamily="mono" color="gray.500" noOfLines={1}>{filePath}</Text>
            )}
            {uriPath && (
                <Link href={uriPath} isExternal fontSize="2xs" fontFamily="mono" color="teal.600" noOfLines={1}>
                    <HStack spacing={1}>
                        <Text as="span" noOfLines={1}>{uriPath}</Text>
                        <ExternalLinkIcon boxSize={2.5} />
                    </HStack>
                </Link>
            )}
        </HStack>
    );
}

// Standard report-status badge row. `extra` slots type-specific badges first.
export function ReportBadges({ inYear, year, global, depreciated, extra }) {
    return (
        <Wrap spacing={1.5} mt={1.5}>
            {extra}
            {depreciated && <WrapItem><Badge colorScheme="orange" fontSize="2xs">Depreciated</Badge></WrapItem>}
            {inYear && <WrapItem><Badge colorScheme="green" fontSize="2xs">In {year}</Badge></WrapItem>}
            {global && <WrapItem><Badge colorScheme="gray" variant="subtle" fontSize="2xs">Global</Badge></WrapItem>}
        </Wrap>
    );
}

export function EmptyText({ children }) {
    return <Text fontSize="xs" color="gray.500" fontStyle="italic">{children}</Text>;
}
