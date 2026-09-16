import React from 'react';
import { Box, Heading, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { navigateToIndicator } from '../../../../services/utils/tools';
import { getStatusBackgroundColor, getStatusTextColor } from '../../../../services/utils/statusColors';
import { T } from '../../presentScale';

/**
 * The indicators the plan on stage furthers, one section per campus, in the
 * lower half of the notes column. Each chip is a button that opens the
 * indicator in the goal view through the app's existing route helper
 * (navigateToIndicator), the same target the desk YSE board uses.
 *
 * Props:
 *   plan        The plan on stage (for the empty-state wording).
 *   evidences   fetchPlanYses rows: indicator_key, status_level, campus_abbrev, year_name, unique_id.
 *   campuses    SettingsContext campuses: [{ name, abbreviation }].
 *   campus      The current campus abbreviation (its section is highlighted).
 *   year        The academic year on the bar; earlier years' links are left out.
 *   loading     True while the rows load.
 */
function IndicatorsPanel({ plan, evidences = [], campuses = [], campus, year, loading = false }) {
    const navigate = useNavigate();

    const forCampus = (abbrev) => evidences
        .filter((e) => e.campus_abbrev === abbrev && (!year || !e.year_name || e.year_name === year))
        .sort((a, b) => (a.indicator_key || '').localeCompare(b.indicator_key || ''));

    // Campuses the settings list does not know still get a section, so no link is hidden.
    const known = new Set(campuses.map((c) => c.abbreviation));
    const extra = [...new Set(evidences.map((e) => e.campus_abbrev).filter((a) => a && !known.has(a)))]
        .map((a) => ({ abbreviation: a, name: a.toUpperCase() }));
    const sections = [...campuses, ...extra];
    const total = sections.reduce((n, c) => n + forCampus(c.abbreviation).length, 0);

    return (
        <Box as="section" aria-label="Indicators furthered" h="100%" display="flex" flexDirection="column"
             bg="white" borderTopWidth="2px" borderColor="gray.300" minH="0">
            <HStack px={4} py={2} borderBottomWidth="1px" borderColor="gray.200" justify="space-between">
                <Heading as="h2" fontSize={T.section} textTransform="uppercase" letterSpacing="wide" color="teal.700">
                    Indicators furthered
                </Heading>
                {total > 0 && <Text fontSize={T.meta} color="gray.700" fontWeight="semibold">{total}</Text>}
            </HStack>

            <Box flex="1" overflowY="auto" minH="0" px={4} py={3}>
                {loading ? (
                    <Text fontSize={T.body} color="gray.700">Loading indicators…</Text>
                ) : !plan ? (
                    <Text fontSize={T.body} color="gray.700" fontStyle="italic">No plan on stage.</Text>
                ) : total === 0 ? (
                    <Text fontSize={T.body} color="gray.700" fontStyle="italic">
                        This plan furthers no indicator for {year || 'this year'}.
                    </Text>
                ) : (
                    <VStack align="stretch" spacing={3}>
                        {sections.map((c) => {
                            const rows = forCampus(c.abbreviation);
                            const current = c.abbreviation === campus;
                            return (
                                <Box key={c.abbreviation} as="section" aria-label={`${c.name} indicators`}
                                     borderWidth="1px" borderColor={current ? 'teal.300' : 'gray.200'} borderRadius="md"
                                     bg={current ? 'teal.50' : 'white'} p={2.5}>
                                    <HStack justify="space-between" mb={rows.length ? 2 : 0}>
                                        <Heading as="h3" fontSize={T.meta} textTransform="uppercase" letterSpacing="wide"
                                                 color={current ? 'teal.800' : 'gray.700'}>
                                            {c.name}
                                        </Heading>
                                        <Text fontSize={T.meta} color="gray.700">{rows.length || 'none'}</Text>
                                    </HStack>
                                    {rows.length > 0 && (
                                        <Wrap spacing={2}>
                                            {rows.map((ev) => (
                                                <WrapItem key={`${c.abbreviation}-${ev.indicator_key}-${ev.year_name || ''}`}>
                                                    <HStack
                                                        as="button"
                                                        type="button"
                                                        spacing={2} px={2.5} py={1}
                                                        borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="white"
                                                        onClick={() => navigateToIndicator(navigate, ev.indicator_key, ev.campus_abbrev || c.abbreviation)}
                                                        aria-label={`Open indicator ${ev.indicator_key} at ${c.name}`}
                                                        title="Open this indicator in the goal view"
                                                        _hover={{ borderColor: 'teal.500', bg: 'gray.50' }}
                                                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '2px' }}
                                                    >
                                                        <Text fontSize={T.meta} fontFamily="mono" color="teal.700" fontWeight="semibold"
                                                              textDecoration="underline" textDecorationColor="teal.300">
                                                            {ev.indicator_key}
                                                        </Text>
                                                        {ev.status_level && (
                                                            <Text fontSize={T.meta} px={1.5} borderRadius="sm"
                                                                  color={getStatusTextColor(ev.status_level)}
                                                                  bg={getStatusBackgroundColor(ev.status_level)}>
                                                                {ev.status_level}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                </WrapItem>
                                            ))}
                                        </Wrap>
                                    )}
                                </Box>
                            );
                        })}
                    </VStack>
                )}
            </Box>
        </Box>
    );
}

export default IndicatorsPanel;
