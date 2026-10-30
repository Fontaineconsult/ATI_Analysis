/**
 * The evidence deck: one working group's report, flattened into the order the
 * report reads (goal, then indicator) so j / k can step through it.
 *
 * Input is a DataContext working-group tree ({ goals: [{ goal, indicators }] }),
 * already narrowed by the report filters when any are set. Each slide keeps the
 * raw indicator wrapper, because the editor panel takes exactly that.
 */

// "6.12-ins" -> { goal: 6, indicator: 12 }; anything else -> null.
export function parseCompositeKey(key) {
    const m = /^(\d+)\.(\d+)-/.exec(key || '');
    return m ? { goal: Number(m[1]), indicator: Number(m[2]) } : null;
}

export function buildEvidenceDeck(tree, summarize) {
    const goals = [...(tree?.goals || [])]
        .map((g) => ({
            number: Number(g.goal?.properties?.goal_number),
            name: g.goal?.properties?.name || '',
            indicators: g.indicators || [],
        }))
        .sort((a, b) => a.number - b.number);

    const slides = [];
    const sections = goals.map((g) => {
        const items = g.indicators
            .map((wrapper) => {
                const key = wrapper?.indicator?.properties?.composite_key;
                const parsed = parseCompositeKey(key);
                return parsed ? { key, goalNumber: parsed.goal, indicatorNumber: parsed.indicator, wrapper, summary: summarize(wrapper) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.indicatorNumber - b.indicatorNumber);
        slides.push(...items);
        return { goalNumber: g.number, goalName: g.name, items };
    }).filter((s) => s.items.length > 0);

    return { sections, slides };
}

/** Status counts for a goal's KPI strip, in rubric order, zero counts dropped. */
export function statusCounts(items, statusOrder) {
    const counts = {};
    items.forEach(({ summary }) => {
        const level = summary?.statusLevel || 'No status';
        counts[level] = (counts[level] || 0) + 1;
    });
    const order = [...statusOrder, 'No status'];
    return order.filter((l) => counts[l]).map((level) => ({ level, count: counts[level] }));
}

/** The slide after or before `key`, clamped to the ends; the first slide when `key` is absent. */
export function stepSlide(slides, key, dir) {
    if (!slides.length) return null;
    const i = slides.findIndex((s) => s.key === key);
    if (i === -1) return slides[0];
    return slides[Math.max(0, Math.min(slides.length - 1, i + dir))];
}
