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
import { NO_EVIDENCE, TREND_OPTIONS } from './reportFilters';

/**
 * The report's filter controls — search, maturity status, and year-over-year trend.
 *
 * Sits at the top of the SI report and complements the attention tiles above rather
 * than replacing them: the tiles answer "what needs work", these answer "which part of
 * the report am I looking at". Both write to the same URL state, so any combination is
 * one shareable link.
 *
 * Status and trend are multi-select menus (Chakra's Menu implements the APG pattern's
 * keyboard contract; hand-rolling it would mean owning that ourselves). Within a facet
 * the choices are OR — picking Defined and Established means either.
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

function MultiSelectMenu({ label, options, selected, onToggle }) {
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
                        </MenuItemOption>
                    ))}
                </MenuOptionGroup>
            </MenuList>
        </Menu>
    );
}

const STATUS_OPTIONS = [...STATUS_LEVELS_ORDER, NO_EVIDENCE].map((s) => ({ key: s, label: s }));

function ReportFilterPanel({ state, onToggleStatus, onToggleTrend, onSearch, onClear, hasAnyFilter }) {
    const [draft, setDraft] = useDebouncedSearch(state.q, onSearch);

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
