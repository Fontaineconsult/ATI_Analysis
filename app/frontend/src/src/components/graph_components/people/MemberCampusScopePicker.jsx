import React, { useState } from 'react';
import {
    Badge, Button, ButtonGroup, Checkbox, HStack, Popover, PopoverArrow, PopoverBody,
    PopoverContent, PopoverFooter, PopoverHeader, PopoverTrigger, Portal, Text, VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';

/**
 * Per-member campus scope for one community membership.
 *
 * Renders the member's current scope as badges — a subtle "home · <campus>" when
 * the membership follows their home campus (raw list empty), teal campus badges
 * when explicitly scoped — and opens a checkbox popover to edit. The picker
 * pre-ticks the home campus for an unscoped membership, so dropping home is a
 * deliberate act (the "active only away from home" case). "Follow home campus"
 * clears back to the fallback. The saved list is authoritative; the no-freeze
 * normalization (empty→[home] saved unchanged writes []) lives in
 * peopleConfig.buildMembershipWrite, not here.
 *
 * Props: member {campuses, host_campus, name}, onSave(campuses) async, isDisabled.
 */
export default function MemberCampusScopePicker({ member, onSave, isDisabled = false }) {
    const { campuses: allCampuses, campusesLoading } = useSettings();
    const disc = useDisclosure();
    const raw = member.campuses || [];
    const scoped = raw.length > 0;
    const [selection, setSelection] = useState([]);
    const [saving, setSaving] = useState(false);

    const openWithPretick = () => {
        setSelection(scoped ? raw : (member.host_campus ? [member.host_campus] : []));
        disc.onOpen();
    };

    const toggle = (abbrev) => setSelection((prev) => (
        prev.includes(abbrev) ? prev.filter((a) => a !== abbrev) : [...prev, abbrev]
    ));

    const save = async (value) => {
        setSaving(true);
        try {
            await onSave(value);
            disc.onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Popover isOpen={disc.isOpen} onClose={disc.onClose} placement="bottom-start" isLazy>
            <PopoverTrigger>
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={openWithPretick}
                    isDisabled={isDisabled}
                    aria-label={`Edit campuses for ${member.name}`}
                    px={1}
                >
                    <HStack spacing={1}>
                        {scoped ? (
                            raw.map((a) => (
                                <Badge key={a} colorScheme="teal" variant="subtle" fontSize="2xs">{a}</Badge>
                            ))
                        ) : (
                            <Badge colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">
                                home{member.host_campus ? ` · ${member.host_campus.toUpperCase()}` : ' · —'}
                            </Badge>
                        )}
                    </HStack>
                </Button>
            </PopoverTrigger>
            <Portal>
                <PopoverContent w="240px">
                    <PopoverArrow />
                    <PopoverHeader fontSize="xs" fontWeight="bold" color="teal.700">
                        Active at which campuses?
                    </PopoverHeader>
                    <PopoverBody>
                        <VStack align="stretch" spacing={1}>
                            {campusesLoading ? (
                                <Text fontSize="xs" color="gray.600">Loading campuses…</Text>
                            ) : (
                                (allCampuses || []).map((c) => (
                                    <Checkbox
                                        key={c.abbreviation}
                                        size="sm"
                                        colorScheme="teal"
                                        isChecked={selection.includes(c.abbreviation)}
                                        onChange={() => toggle(c.abbreviation)}
                                    >
                                        <Text as="span" fontSize="xs">
                                            {c.name}
                                            {c.abbreviation === member.host_campus ? ' (home)' : ''}
                                        </Text>
                                    </Checkbox>
                                ))
                            )}
                        </VStack>
                    </PopoverBody>
                    <PopoverFooter>
                        <ButtonGroup size="xs" w="full" justifyContent="space-between">
                            <Button variant="ghost" onClick={() => save([])} isDisabled={saving}>
                                Follow home campus
                            </Button>
                            <Button colorScheme="teal" onClick={() => save(selection)} isLoading={saving}>
                                Save
                            </Button>
                        </ButtonGroup>
                    </PopoverFooter>
                </PopoverContent>
            </Portal>
        </Popover>
    );
}
