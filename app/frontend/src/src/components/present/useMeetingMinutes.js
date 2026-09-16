import { useCallback, useContext, useRef, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { openMeetingMinutesForDay } from '../../services/api/post';
import { appendMinutesEntry } from '../../services/api/put';

/**
 * The notes pad's storage: today's MeetingMinutes record per working group.
 *
 * Nothing is created until the first note is saved, so opening meeting mode
 * and leaving without typing writes nothing. On first save the hook asks the
 * server for today's record for the plan's working group (created if absent,
 * recorded_by the "Notating as" person) and appends the entry under the
 * plan's heading. Records are cached by working-group name for the session.
 *
 * Every write drops the `minutes:` cache prefix so the Campus Plan minutes
 * panel shows the new lines on its next render.
 */
export default function useMeetingMinutes({ campus, year, recordedByUniqueId }) {
    const { invalidateResourcePrefix } = useContext(DataContext) || {};
    const [byWg, setByWg] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    // In-flight opens, so two quick saves on a fresh day make one record.
    const opening = useRef({});

    const ensure = useCallback(async (workingGroup) => {
        if (!workingGroup) throw new Error('The plan has no working group, so there is no minutes record to write to.');
        if (byWg[workingGroup]) return byWg[workingGroup];
        if (!opening.current[workingGroup]) {
            opening.current[workingGroup] = openMeetingMinutesForDay({
                campus_abbrev: campus,
                year_name: year,
                working_group: workingGroup,
                ...(recordedByUniqueId ? { recorded_by_unique_id: recordedByUniqueId } : {}),
            }).then((resp) => {
                const record = resp?.data;
                setByWg((prev) => ({ ...prev, [workingGroup]: record }));
                if (invalidateResourcePrefix) invalidateResourcePrefix('minutes:');
                return record;
            }).finally(() => { delete opening.current[workingGroup]; });
        }
        return opening.current[workingGroup];
    }, [byWg, campus, year, recordedByUniqueId, invalidateResourcePrefix]);

    const append = useCallback(async (workingGroup, { text, planUniqueId, kind = 'note' }) => {
        setBusy(true);
        setError(null);
        try {
            const record = await ensure(workingGroup);
            const resp = await appendMinutesEntry(record.unique_id, {
                text, planUniqueId, kind, authorUniqueId: recordedByUniqueId,
            });
            const updated = resp?.data;
            setByWg((prev) => ({ ...prev, [workingGroup]: updated }));
            if (invalidateResourcePrefix) invalidateResourcePrefix('minutes:');
            return updated;
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Could not save the note.');
            throw e;
        } finally {
            setBusy(false);
        }
    }, [ensure, recordedByUniqueId, invalidateResourcePrefix]);

    const minutesFor = useCallback((workingGroup) => byWg[workingGroup] || null, [byWg]);

    return { minutesFor, ensure, append, busy, error };
}
