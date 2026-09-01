import React, { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Flex,
    HStack,
    IconButton,
    Select,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { fetchDepartments, fetchColleges, fetchVendors } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import { orgUnitsKeyForType } from '../../../context/resourceKeys';
import { assignEmployeeToOrgUnit, unassignEmployeeFromOrgUnit } from '../../../services/api/put';

const UNIT_TYPES = [
    { value: 'department', label: 'Department', fetch: fetchDepartments, badge: 'blue' },
    { value: 'college', label: 'College', fetch: fetchColleges, badge: 'purple' },
    { value: 'vendor', label: 'Vendor', fetch: fetchVendors, badge: 'orange' },
];

const typeMeta = (type) =>
    UNIT_TYPES.find((t) => t.label.toLowerCase() === String(type || '').toLowerCase()) || null;

/**
 * The org units (Department / College / Vendor) that employ this person —
 * the `employs` edges, editable from the person side. Add/remove apply
 * immediately (single-edge semantics, like YSE assignment), then onChange()
 * asks the container to refetch.
 *
 * Props:
 *   personUniqueId  Person.unique_id (the employs write key).
 *   employers       [{name, type}] from get_person_implementation_details.
 *   onChange()      Async; called after any assign/unassign.
 */
function EmployersEditor({ personUniqueId, employers = [], onChange }) {
    const toast = useToast();
    const [unitType, setUnitType] = useState('department');
    const [picker, setPicker] = useState('');
    const [busy, setBusy] = useState(false);

    // The catalogue for the selected unit type. All three lists are shared with
    // the assets area (StewardshipCard, AssetForm, ToolForm), so switching the
    // dropdown back and forth costs nothing after the first look at each.
    const typeConfig = UNIT_TYPES.find((t) => t.value === unitType) || null;
    const { data: catalogResp, error: catalogError } = useResource(
        orgUnitsKeyForType(unitType),
        () => typeConfig.fetch(),
    );
    const catalog = useMemo(() => catalogResp?.data || [], [catalogResp]);

    // A failed load is surfaced, not swallowed — an empty picker must mean "no
    // units", never a hidden 500 (that ambiguity masked the OrgUnit back-label
    // bug). Reset the picker when the type changes so a stale selection from the
    // previous catalogue cannot be submitted.
    useEffect(() => { setPicker(''); }, [unitType]);
    useEffect(() => {
        if (!catalogError || !typeConfig) return;
        toast({
            title: `Failed to load ${typeConfig.label.toLowerCase()}s`,
            description: catalogError,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'top-right',
        });
    }, [catalogError, typeConfig, toast]);

    const current = useMemo(
        () => new Set(employers.map((e) => `${String(e.type || '').toLowerCase()}:${e.name}`)),
        [employers],
    );
    const available = useMemo(
        () => catalog.filter((u) => !current.has(`${unitType}:${u.name}`)),
        [catalog, current, unitType],
    );

    const fail = (title, e) =>
        toast({ title, description: e?.response?.data?.error || e?.message, status: 'error', duration: 3000, isClosable: true, position: 'top-right' });

    const handleAdd = async () => {
        if (!picker) return;
        setBusy(true);
        try {
            await assignEmployeeToOrgUnit(unitType, picker, personUniqueId);
            setPicker('');
            if (onChange) await onChange();
        } catch (e) {
            fail('Failed to assign employer', e);
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (employer) => {
        const meta = typeMeta(employer.type);
        if (!meta) return;
        setBusy(true);
        try {
            await unassignEmployeeFromOrgUnit(meta.value, employer.name, personUniqueId);
            if (onChange) await onChange();
        } catch (e) {
            fail('Failed to remove employer', e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <VStack align="stretch" spacing={3}>
            {employers.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">No employing unit recorded yet.</Text>
            ) : (
                <VStack align="stretch" spacing={1}>
                    {employers.map((e, i) => {
                        const meta = typeMeta(e.type);
                        return (
                            <HStack
                                key={`${e.type}-${e.name}-${i}`}
                                spacing={2}
                                px={2}
                                py={1.5}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                            >
                                <Badge colorScheme={meta?.badge || 'gray'} variant="subtle" fontSize="2xs" flexShrink={0}>
                                    {e.type}
                                </Badge>
                                <Text fontSize="sm" color="gray.800" noOfLines={1} flex="1" minW={0}>{e.name}</Text>
                                {meta && (
                                    <IconButton
                                        aria-label={`Remove employer ${e.name}`}
                                        icon={<CloseIcon boxSize={2} />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        isDisabled={busy}
                                        onClick={() => handleRemove(e)}
                                    />
                                )}
                            </HStack>
                        );
                    })}
                </VStack>
            )}

            <Flex gap={2}>
                <Select size="sm" w="36" flexShrink={0} value={unitType} onChange={(e) => setUnitType(e.target.value)} aria-label="Unit type">
                    {UNIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Select
                    size="sm"
                    placeholder={available.length ? `Add a ${unitType}…` : `No ${unitType}s available`}
                    value={picker}
                    onChange={(e) => setPicker(e.target.value)}
                    isDisabled={available.length === 0}
                    aria-label="Employing unit"
                >
                    {available.map((u) => <option key={u.unique_id || u.name} value={u.name}>{u.name}</option>)}
                </Select>
                <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />}
                        onClick={handleAdd} isDisabled={!picker} isLoading={busy}>
                    Add
                </Button>
            </Flex>
        </VStack>
    );
}

export default EmployersEditor;
