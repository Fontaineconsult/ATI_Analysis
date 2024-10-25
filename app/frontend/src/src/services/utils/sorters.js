/**
 * Comparator function to sort indicators based on their composite_key.
 * It ensures that keys like "1.2" are correctly sorted before "1.10".
 *
 * @param {Object} a - First indicator object to compare.
 * @param {Object} b - Second indicator object to compare.
 * @returns {number} - Negative number if a < b, positive if a > b, zero if equal.
 */
export function sortCompositeKeys(a, b) {
    const keyA = a.indicator.properties.composite_key;
    const keyB = b.indicator.properties.composite_key;

    return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
}


/**
 * Comparator function to sort success indicators based on their composite_key.
 * It ensures that keys like "9.2-ins" are correctly sorted before "9.10-ins".
 *
 * @param {Object} a - First success indicator object to compare.
 * @param {Object} b - Second success indicator object to compare.
 * @returns {number} - Negative number if a < b, positive if a > b, zero if equal.
 */
export function sortSuccessIndicators(a, b) {
    const keyA = a.composite_key || '';
    const keyB = b.composite_key || '';

    return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
}
