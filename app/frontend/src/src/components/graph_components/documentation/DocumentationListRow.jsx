import React from 'react';
import { Badge, Box, HStack, ListItem, Text, Wrap, WrapItem } from '@chakra-ui/react';

import { DocumentationBadgeRow } from './DocumentationBadges';
import { DOC_TYPES, getTypeLabel } from './documentationConfig';

/**
 * One row of the documentation list, MEMOIZED — which is the whole reason it is
 * a separate component.
 *
 * The list runs to 418 rows on the artifacts tab and 567 on annotations, and
 * each row carries badges that are Chakra Tooltips: ~600 and ~1,240 tooltip
 * instances respectively. Inline in the parent's map, every one of them
 * re-rendered on every list render — and a click causes several (the selection,
 * the roving tab stop following it, the detail fetch resolving, the URL
 * changing). Measured in jsdom before this split: 4.5s for a selection change,
 * and 1.9s even for a re-render where nothing the list shows had changed.
 *
 * So the props here are deliberately all primitives or stable identities:
 * `index`, `isSelected`, `isFocused`, and the three handlers from
 * useListboxNavigation's `itemHandlers`, which keep one identity for the life of
 * the list. Passing `getItemProps(index)` instead would rebuild a ref callback
 * and two handlers per row per render and defeat the memo entirely.
 *
 * KEEP IT THAT WAY. Adding a prop built inline in the parent — an object
 * literal, an arrow function, a derived array — silently turns the memo off and
 * hands the 2-second click back.
 */
function DocumentationListRow({
    item,
    index,
    isSelected,
    isFocused,
    onSelect,
    registerItem,
    onItemFocus,
    onItemKeyDown,
}) {
    const locator = item.url || item.uri_path || item.file_path || '';

    return (
        <ListItem
            ref={(el) => registerItem(index, el)}
            tabIndex={isFocused ? 0 : -1}
            onFocus={() => onItemFocus(index)}
            onKeyDown={(e) => onItemKeyDown(index, e)}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
            px={3}
            py={2}
            cursor="pointer"
            bg={isSelected ? 'teal.50' : 'white'}
            borderLeftWidth="3px"
            borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
            borderBottomWidth="1px"
            borderBottomColor="gray.100"
            _hover={{ bg: isSelected ? 'teal.50' : 'gray.50', boxShadow: 'md' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
        >
            <HStack justify="space-between" align="flex-start" spacing={2}>
                <Box minW="0" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color="gray.800" noOfLines={2}>
                        {item.title || <em>Untitled</em>}
                    </Text>
                    {locator && (
                        <Text
                            fontSize="2xs"
                            color="gray.600"
                            fontFamily="mono"
                            noOfLines={1}
                            title={locator}
                        >
                            {locator}
                        </Text>
                    )}
                </Box>
                {/* Reference count is red at zero — an orphan is the thing you
                    most need to notice while scanning. */}
                <Badge
                    flexShrink={0}
                    colorScheme={item.reference_count ? 'gray' : 'red'}
                    borderRadius="full"
                    fontSize="2xs"
                    title={`${item.reference_count} reference(s), ${item.parent_count} record(s)`}
                >
                    {item.reference_count}
                </Badge>
            </HStack>
            <Wrap spacing={1} mt={1}>
                <WrapItem>
                    <Badge
                        colorScheme={DOC_TYPES[item.doc_type]?.colorScheme || 'gray'}
                        borderRadius="md"
                        fontSize="2xs"
                        textTransform="uppercase"
                    >
                        {getTypeLabel(item.doc_type)}
                    </Badge>
                </WrapItem>
                <WrapItem>
                    <HStack spacing={1}>
                        <DocumentationBadgeRow item={item} />
                    </HStack>
                </WrapItem>
            </Wrap>
        </ListItem>
    );
}

export default React.memo(DocumentationListRow);
