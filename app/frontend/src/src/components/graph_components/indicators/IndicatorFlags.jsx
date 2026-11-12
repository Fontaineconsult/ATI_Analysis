import React from 'react';
import { Badge, HStack, Icon, Text, Tooltip } from '@chakra-ui/react';
import { FaUser, FaListUl, FaRegComment } from 'react-icons/fa';
import { strengthConfig } from '../implementation/implementationConfig';

/**
 * The indicator badges shared by the dashboard's indicator list and the report
 * meeting mode rail, so both show the same warnings from the same summary
 * (getIndicatorSummary). `fontSize` lets meeting mode scale them for a shared
 * screen; `iconSize` does the same for the count chips.
 */

const hasWarnings = (s, showExternal) => Boolean(
    s.flagMissingImplementation || s.noActiveDocs || s.allImplsRetired || s.undocumentedImplCount > 0
    || (showExternal && s.externalCount > 0)
);

// Compact count chip (icon + number). aria-hidden because the row's own
// aria-label carries the screen-reader summary; the chips are a sighted
// at-a-glance overview.
export const CountChip = ({ icon, count, label, zeroColor = 'gray.300', fontSize = '2xs', iconSize = 2.5 }) => (
    <Tooltip label={`${count} ${label}`} openDelay={400}>
        <HStack spacing={1} color={count > 0 ? 'gray.600' : zeroColor} aria-hidden="true">
            <Icon as={icon} boxSize={iconSize} />
            <Text fontSize={fontSize} fontWeight="medium">{count}</Text>
        </HStack>
    </Tooltip>
);

/** Evidence warnings: no implementations, all retired, undocumented, docs deprecated, and (optionally) external. */
export function IndicatorWarningFlags({ s, fontSize = '2xs', showExternal = false, ...rest }) {
    if (!s || !hasWarnings(s, showExternal)) return null;
    const badge = { fontSize, borderRadius: 'full', px: 2 };
    return (
        <HStack spacing={1.5} flexWrap="wrap" {...rest}>
            {s.flagMissingImplementation && (
                <Badge colorScheme="red" variant="solid" {...badge} title="No implementations are linked to this indicator">
                    ⚠ No implementations
                </Badge>
            )}
            {s.allImplsRetired && (
                <Badge colorScheme="orange" variant="solid" {...badge}
                       title="Every implementation linked to this indicator is retired — no active work addresses it">
                    ⚠ Imps retired
                </Badge>
            )}
            {s.undocumentedImplCount > 0 && (
                <Badge colorScheme="orange" variant="outline" {...badge}
                       title={`${s.undocumentedImplCount} implementation${s.undocumentedImplCount === 1 ? ' has' : 's have'} no documents or webpages attached at all`}>
                    ⚠ Undocumented ×{s.undocumentedImplCount}
                </Badge>
            )}
            {s.noActiveDocs && (
                <Badge colorScheme="orange" variant="solid" {...badge}
                       title="Every document on this indicator's implementations is depreciated — no active documentation">
                    ⚠ Docs deprecated
                </Badge>
            )}
            {showExternal && s.externalCount > 0 && (
                <Badge colorScheme="purple" variant="subtle" {...badge}
                       title={`${s.externalCount} evidence link${s.externalCount === 1 ? '' : 's'} rel${s.externalCount === 1 ? 'ies' : 'y'} on a practice the owners don't directly control (another unit, SFBRN, the CO, a vendor)`}>
                    External ×{s.externalCount}
                </Badge>
            )}
        </HStack>
    );
}

/** Counts (persons, implementations, annotations), the strongest evidence rating, and the review/year badges. */
export function IndicatorMetaRow({ s, fontSize = '2xs', iconSize = 2.5 }) {
    if (!s) return null;
    const strength = strengthConfig(s.maxStrength);
    return (
        <HStack justify="space-between" align="center">
            <HStack spacing={3}>
                <CountChip icon={FaUser} count={s.personCount} label="responsible persons" zeroColor="red.500" fontSize={fontSize} iconSize={iconSize} />
                <CountChip icon={FaListUl} count={s.implCount} label="implementations"
                           zeroColor={s.flagMissingImplementation ? 'red.500' : 'gray.300'} fontSize={fontSize} iconSize={iconSize} />
                <CountChip icon={FaRegComment} count={s.annotationCount} label="annotations" fontSize={fontSize} iconSize={iconSize} />
                {/* Evidence-strength quality: the strongest rated link.
                    aria-hidden like the chips — the row label carries it. */}
                {s.implCount > 0 && (
                    strength ? (
                        <Tooltip label={`Strongest evidence link: ${strength.description}`} openDelay={400}>
                            <Badge colorScheme={strength.colorScheme} variant="subtle" fontSize={fontSize} borderRadius="full" px={2} aria-hidden="true">
                                {strength.label}
                            </Badge>
                        </Tooltip>
                    ) : (
                        <Tooltip label="No evidence link has a strength rating yet — rate them in the evidence table below" openDelay={400}>
                            <Badge colorScheme="gray" variant="outline" fontSize={fontSize} borderRadius="full" px={2} aria-hidden="true">
                                Unrated
                            </Badge>
                        </Tooltip>
                    )
                )}
            </HStack>
            <HStack spacing={1}>
                {s.readyForReview && !s.approved && (
                    <Badge colorScheme="yellow" variant="subtle" fontSize={fontSize}>Ready</Badge>
                )}
                {s.workedThisYear && (
                    <Tooltip label="Worked on this year" openDelay={400}>
                        <Badge colorScheme="teal" variant="subtle" fontSize={fontSize}>This yr</Badge>
                    </Tooltip>
                )}
                {s.nextYear && (
                    <Tooltip label="Planned for next year" openDelay={400}>
                        <Badge colorScheme="blue" variant="subtle" fontSize={fontSize}>Next yr</Badge>
                    </Tooltip>
                )}
            </HStack>
        </HStack>
    );
}
