// How a person takes part in the ATI (Person.ati_involvement; vocab in
// data_config.ati_involvement_levels). `active` says only whether the person is still
// in their role. Pickers for ATI work offer participants; pickers for records that
// name outside people (TAAP signers, vendor contacts, asset stewards) offer anyone
// current, contacts included.

export const INVOLVEMENT_LABELS = {
    member: 'Member',
    contributor: 'Contributor',
    contact: 'Contact',
};

export const INVOLVEMENT_ORDER = ['member', 'contributor', 'contact'];

export const involvementOf = (person) => person?.ati_involvement || 'contact';

// A current member or contributor: the people who can be assigned ATI work.
export const isAtiParticipant = (person) =>
    Boolean(person?.active) && ['member', 'contributor'].includes(involvementOf(person));

// Anyone still in their role, contacts included.
export const isCurrentPerson = (person) => Boolean(person?.active);

// Alphabetical by name, ignoring case and accents. Every people picker lists in this order.
export const byName = (a, b) =>
    (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' });

export const sortByName = (people) => [...(people || [])].sort(byName);
