/**
 * Settings > Services: labels, badges and help text.
 *
 * The page reads GET /services, which reports every service in app/services
 * and whether its external programs are configured on this server. Every helper
 * here tolerates missing fields: an incomplete configuration, or an older
 * server, must render as "not configured", never as a broken page.
 */

export const AVAILABILITY = {
    available: { label: 'Available', colorScheme: 'green' },
    unavailable: { label: 'Not configured', colorScheme: 'red' },
};

export const availabilityOf = (service) =>
    (service?.available ? AVAILABILITY.available : AVAILABILITY.unavailable);

export const PYTHON_SOURCE_LABELS = {
    configured: 'set by ATI_SERVICE_*_PYTHON',
    'default .venv': "the program's own .venv",
};

/** Services, available and not configured, from whatever list arrived. */
export function summarizeServices(services) {
    const list = Array.isArray(services) ? services : [];
    const available = list.filter((s) => s?.available).length;
    return { total: list.length, available, unavailable: list.length - available };
}

/** The settings an admin sets to configure one service, deduplicated. */
export function settingNamesFor(service) {
    const names = [];
    const programs = Array.isArray(service?.programs) ? service.programs : [];
    programs.forEach((p) => {
        if (p?.dir_setting && !names.includes(p.dir_setting)) names.push(p.dir_setting);
    });
    return names;
}

/** The PowerShell line that sets those settings on the IIS server. */
export function setupCommandFor(service) {
    const pairs = settingNamesFor(service).map((name) => `${name} = '<folder>'`);
    if (!pairs.length) return null;
    return `.\\Setup-AtiIis.ps1 -ServiceSettings @{ ${pairs.join('; ')} }`;
}

/** '2026-10-12T19:28:01Z' -> '2026-10-12 19:28 UTC'; anything else as given. */
export function formatRunTime(value) {
    const m = typeof value === 'string' && value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    return m ? `${m[1]} ${m[2]} UTC` : (value || null);
}

/** One line about the newest run folder, honest that a folder is not a success. */
export function describeLastRun(lastRun) {
    if (!lastRun) return 'Run history unavailable.';
    if (lastRun.problem) return lastRun.problem;
    if (!lastRun.runs) return 'No runs yet.';
    const files = lastRun.latest_files === 1 ? '1 file' : `${lastRun.latest_files || 0} files`;
    const runs = lastRun.runs === 1 ? '1 run' : `${lastRun.runs} runs`;
    return `Last run folder ${formatRunTime(lastRun.latest)}, ${files}. ${runs} in total.`;
}

export const HELP = {
    page: 'Services call programs outside this app and record what they return. '
        + 'This checks whether each one can run on this server. It runs nothing and changes nothing.',
    recheck: 'Settings come from web.config on the server and app/.env.development locally. '
        + 'A change to web.config shows here after the app pool restarts.',
    lastRun: 'A run folder means a run happened, not that it succeeded.',
    local: 'Locally, add the setting to app/.env.development.',
    server: 'On the IIS server, run:',
};
