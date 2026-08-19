import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Text,
} from '@chakra-ui/react';
import { ChevronDown, Search, X } from 'lucide-react';
import { STATUS_LEVELS_ORDER } from '../../../services/utils/statusColors';
import { FILTER_LIST, NO_EVIDENCE, TREND_OPTIONS } from './reportFilters';

/**
 * The report's filter controls — attention, search, maturity status, year-over-year
 * trend, and community of practice.
 *
 * Attention appears BOTH here and as the tiles at the top of the page. That is
 * deliberate duplication, not an accident: the tiles are the diagnostic display and
 * are scrolled past by the time anyone reads the narrowed tables, so the same filter
 * needs a control that travels with the report. Both read and write the one piece of
 * URL state, so pressing a tile checks the menu item and vice versa.
 *
 * Every menu is a Chakra Menu with checkbox options — it implements the APG pattern's
 * keyboard contract, which hand-rolling would mean owning ourselves.
 *
 * Combination rules differ by facet and are stated in ReportFilterBar: Status and
 * Trend are OR within themselves (an indicator sits on one rung, has one direction),
 * while Attention and Community are AND (independent defects / independent claimants).
 */

// The search box is uncontrolled-by-URL while you type. Writing every keystroke
// straight through would re-render the whole report per character and, even with
// history replacement, make typing feel like it is fighting back. The URL catches up
// after a pause; it is still the source of truth on load and on share.
const SEARCH_DEBOUNCE_MS = 250;

function useDebouncedSearch(urlValue, onCommit) {
    const [draft, setDraft] = useState(urlValue);
    const committed = useRef(urlValue);

    // Adopt external changes (a shared link, Back, Clear all) without clobbering
    // whatever the user is mid-way through typing.
    useEffect(() => {
        if (urlValue !== committed.current) {
            committed.current = urlValue;
            setDraft(urlValue);
        }
    }, [urlValue]);

    useEffect(() => {
        if (draft === committed.current) return undefined;
        const t = setTimeout(() => {
            committed.current = draft;
            onCommit(draft);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [draft, onCommit]);

    return [draft, setDraft];
}

function MultiSelectMenu({ label, options, selected, onToggle }) {  // options: {key,label,count?}
    const count = selected.length;
    return (
        <Menu closeOnSelect={false}>
            <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                colorScheme={count ? 'teal' : 'gray'}
                rightIcon={<Icon as={ChevronDown} boxSize={3.5} aria-hidden="true" />}
                fontWeight="medium"
            >
                {label}{count ? ` (${count})` : ''}
            </MenuButton>
            <MenuList maxH="20rem" overflowY="auto" zIndex="dropdown">
                <MenuOptionGroup type="checkbox" value={selected}>
                    {options.map((opt) => (
                        <MenuItemOption
                            key={opt.key}
                            value={opt.key}
                            fontSize="sm"
                            onClick={() => onToggle(opt.key)}
                        >
                            {opt.label}
                            {/* The count is what makes the menu usable without the
                                tiles in view — it says which filters have anything
                                behind them before you spend a click. */}
                            {opt.count != null ? (
                                <Text as="span" color="gray.600" ml={1}>({opt.count})</Text>
                            ) : null}
                        </MenuItemOption>
                    ))}
                </MenuOptionGroup>
            </MenuList>
        </Menu>
    );
}

const STATUS_OPTIONS = [...STATUS_LEVELS_ORDER, NO_EVIDENCE].map((s) => ({ key: s, label: s }));

function ReportFilterPanel({
    state, communityOptions = [], attentionCounts = null,
    onToggleAttention, onToggleStatus, onToggleTrend, onToggleCommunity,
    onSearch, onClear, hasAnyFilter,
}) {
    const [draft, setDraft] = useDebouncedSearch(state.q, onSearch);

    // Same registry the tiles render from, so the two controls can never drift.
    const attentionOptions = FILTER_LIST.map((f) => ({
        key: f.key,
        label: f.label,
        count: attentionCounts ? attentionCounts[f.metric] : undefined,
    }));

    return (
        <Flex gap={3} mb={4} align="center" wrap="wrap">
            <InputGroup size="sm" maxW="320px" flex="1 1 220px">
                <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={3.5} color="gray.600" aria-hidden="true" />
                </InputLeftElement>
                <Input
                    aria-label="Search indicators by description or ID"
                    placeholder="Search description or ID…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    borderColor={state.q ? 'teal.400' : 'gray.200'}
                />
                {draft ? (
                    <InputRightElement>
                        <IconButton
                            size="xs"
                            variant="ghost"
                            aria-label="Clear search"
                            icon={<Icon as={X} boxSize={3} />}
                            onClick={() => setDraft('')}
                        />
                    </InputRightElement>
                ) : null}
            </InputGroup>

            {onToggleAttention ? (
                <MultiSelectMenu
                    label="Attention"
                    options={attentionOptions}
                    selected={state.attention}
                    onToggle={onToggleAttention}
                />
            ) : null}
            <MultiSelectMenu
                label="Status"
                options={STATUS_OPTIONS}
                selected={state.status}
                onToggle={onToggleStatus}
            />
            <MultiSelectMenu
                label="Trend"
                options={TREND_OPTIONS}
                selected={state.trend}
                onToggle={onToggleTrend}
            />
            {/* Options come from the loaded data, not a fixed vocabulary — only
                communities that actually hold a stake somewhere are offerable. */}
            {communityOptions.length > 0 ? (
                <MultiSelectMenu
                    label="Community"
                    options={communityOptions.map((name) => ({ key: name, label: name }))}
                    selected={state.community}
                    onToggle={onToggleCommunity}
                />
            ) : null}

            {hasAnyFilter ? (
                <Button size="sm" variant="ghost" colorScheme="teal" onClick={onClear} ml="auto">
                    Clear all filters
                </Button>
            ) : (
                <Box ml="auto">
                    <Text fontSize="xs" color="gray.600">Showing all indicators</Text>
                </Box>
            )}
        </Flex>
    );
}

export default ReportFilterPanel;
