import React, { useEffect, useState } from 'react';
import {
    Button,
    Flex,
    HStack,
    Input,
    Select,
    Tag,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { fetchAllRoles } from '../../services/api/get';
import { setImplementationParticipants } from '../../services/api/put';

/**
 * The implementation's WORKING TEAM — people who did the day-to-day work, each in a role
 * (and an optional note). Deliberately separate from the Owner (owned_by), who is the
 * custodian of the evidence record, not necessarily a doer. Edits are local until Save
 * (replace-semantics). A person may appear in more than one role.
 *
 * Props: implementationType, implementationUniqueId, participants (current), individuals
 * (person options), onSaved() (refresh the implementation).
 */
function ParticipantsEditor({ implementationType, implementationUniqueId, participants = [], individuals = [], onSaved }) {
    const toast = useToast();
    const [roles, setRoles] = useState([]);
    const [rows, setRows] = useState([]);
    const [pPerson, setPPerson] = useState('');
    const [pRole, setPRole] = useState('');
    const [pNote, setPNote] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchAllRoles();
                if (!cancelled) setRoles(resp?.data?.items || []);
            } catch (_) { /* non-fatal */ }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        setRows((participants || []).map((p) => ({
            person_unique_id: p.person?.unique_id,
            person_name: p.person?.name || p.person?.unique_id,
            role_handle: p.role_handle || '',
            note: p.note || '',
        })));
    }, [participants]);

    const roleName = (handle) => roles.find((r) => r.handle === handle)?.name || handle || '—';

    const addRow = () => {
        if (!pPerson) return;
        const person = (individuals || []).find((i) => i.unique_id === pPerson);
        setRows((prev) => [...prev, {
            person_unique_id: pPerson,
            person_name: person?.name || pPerson,
            role_handle: pRole,
            note: pNote.trim(),
        }]);
        setPPerson(''); setPRole(''); setPNote('');
    };

    const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

    const handleSave = async () => {
        setSaving(true);
        try {
            await setImplementationParticipants(implementationType, implementationUniqueId, rows.map((r) => ({
                person_unique_id: r.person_unique_id,
                role_handle: r.role_handle || null,
                note: r.note || null,
            })));
            toast({ title: 'Participants saved', status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            if (onSaved) await onSaved();
        } catch (e) {
            toast({ title: 'Failed to save participants', description: e?.message, status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <VStack align="stretch" spacing={3}>
            <Text fontSize="2xs" color="gray.400">
                Who did the day-to-day work, in their roles — distinct from the Owner, who maintains the evidence record.
            </Text>

            <Flex gap={2} flexWrap="wrap">
                <Select size="sm" placeholder="Person…" value={pPerson} onChange={(e) => setPPerson(e.target.value)} flex="1" minW="140px">
                    {(individuals || []).filter((i) => i.active || i.non_committee_member_active).map((i) => <option key={i.unique_id} value={i.unique_id}>{i.name}</option>)}
                </Select>
                <Select size="sm" placeholder="Role…" value={pRole} onChange={(e) => setPRole(e.target.value)} flex="1" minW="140px">
                    {roles.map((r) => <option key={r.handle} value={r.handle}>{r.name}</option>)}
                </Select>
                <Input size="sm" placeholder="Note (optional)" value={pNote} onChange={(e) => setPNote(e.target.value)} flex="1" minW="120px" />
                <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={addRow} isDisabled={!pPerson}>
                    Add
                </Button>
            </Flex>

            {rows.length === 0 ? (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No participants assigned.</Text>
            ) : (
                <VStack align="stretch" spacing={1}>
                    {rows.map((r, idx) => (
                        <HStack
                            key={`${r.person_unique_id}-${r.role_handle}-${idx}`}
                            justify="space-between"
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            px={3}
                            py={1.5}
                            bg="white"
                        >
                            <HStack spacing={2} flexWrap="wrap" minW="0">
                                <Text fontSize="sm" color="gray.800" fontWeight="medium">{r.person_name}</Text>
                                <Tag size="sm" colorScheme="purple" variant="subtle">{roleName(r.role_handle)}</Tag>
                                {r.note && <Text fontSize="xs" color="gray.500" noOfLines={1}>{r.note}</Text>}
                            </HStack>
                            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeRow(idx)}>Remove</Button>
                        </HStack>
                    ))}
                </VStack>
            )}

            <Flex justify="flex-end">
                <Button size="sm" colorScheme="teal" onClick={handleSave} isLoading={saving} loadingText="Saving…">
                    Save participants
                </Button>
            </Flex>
        </VStack>
    );
}

export default ParticipantsEditor;
