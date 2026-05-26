/**
 * StatusLevel color helpers, matched to the levels defined in
 * data_config.status_levels (Not Started, Initiated, Defined, Established,
 * Managed, Optimizing). Originally lived inline in StatusLevelDefs.js;
 * extracted here so any component that needs to render a status pill can
 * import a single source of truth.
 */

export function getStatusColor(statusLevel) {
    const level = statusLevel ? statusLevel.toLowerCase() : null;
    switch (level) {
        case 'not started':
            return '#E53E3E'; // red.500
        case 'initiated':
            return '#ED8936'; // orange.500
        case 'defined':
            return '#ECC94B'; // yellow.500
        case 'established':
            return '#41b441'; // green.400
        case 'managed':
            return '#246f24'; // green.600
        case 'optimizing':
            return '#157744'; // green.700
        default:
            return '#718096'; // gray.500
    }
}

export function getStatusBackgroundColor(statusLevel) {
    const level = statusLevel ? statusLevel.toLowerCase() : null;
    switch (level) {
        case 'not started':
            return 'red.50';
        case 'initiated':
            return 'orange.50';
        case 'defined':
            return 'yellow.50';
        case 'established':
            return 'green.50';
        case 'managed':
            return 'green.100';
        case 'optimizing':
            return 'teal.50';
        default:
            return 'gray.50';
    }
}
