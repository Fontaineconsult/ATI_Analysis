// Turns axe-core results into a readable failure message and a JSON attachment.

/** Human-readable summary of axe violations for test failure output. */
function formatViolations(violations) {
    if (!violations.length) return 'No axe violations.';
    const lines = violations.map((v) => {
        const nodes = v.nodes
            .slice(0, 5)
            .map((n) => `      ${n.target.join(' ')}`)
            .join('\n');
        const more = v.nodes.length > 5 ? `\n      … and ${v.nodes.length - 5} more node(s)` : '';
        return [
            `  [${v.impact}] ${v.id}: ${v.help}`,
            `    ${v.helpUrl}`,
            `    ${v.nodes.length} node(s):`,
            nodes + more,
        ].join('\n');
    });
    return `${violations.length} axe violation(s):\n${lines.join('\n\n')}`;
}

/** Attach full axe results to the test report for later inspection. */
async function attachAxeResults(testInfo, results) {
    await testInfo.attach('axe-results.json', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
    });
}

module.exports = { formatViolations, attachAxeResults };
