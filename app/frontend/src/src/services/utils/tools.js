function getUrlFromCompositeKey(compositeKey) {
    // Parse composite key like "1.2-ins" or "5.14-web"
    const [numbers, suffix] = compositeKey.split('-');
    const [goalNumber, indicatorNumber] = numbers.split('.');

    // Map suffix to working group URL segment
    const workingGroupMap = {
        'web': 'web',
        'pro': 'procurement',
        'ins': 'instructional-materials'
    };

    const workingGroupSegment = workingGroupMap[suffix] || suffix;

    // Return the URL segment
    return `${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
}


// Helper function to get status color
const getStatusColor = (statusLevel) => {
    const level = statusLevel?.toLowerCase();
    switch(level) {
        case 'not started':
            return '#E53E3E'; // red.500
        case 'initiated':
            return '#ED8936'; // orange.500
        case 'defined':
            return '#ECC94B'; // yellow.500
        case 'established':
            return '#41b441'; // blue.500
        case 'managed':
            return '#246f24'; // blue.500
        case 'optimized':
            return '#157744'; // green.500
        default:
            return '#718096'; // gray.500
    }
};


export { getUrlFromCompositeKey, getStatusColor };