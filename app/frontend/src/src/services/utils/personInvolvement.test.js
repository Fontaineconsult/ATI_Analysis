import { involvementOf, isAtiParticipant, isCurrentPerson, sortByName } from './personInvolvement';

describe('personInvolvement', () => {
    const person = (active, ati_involvement) => ({ active, ati_involvement });

    test('members and contributors who are still in role are participants', () => {
        expect(isAtiParticipant(person(true, 'member'))).toBe(true);
        expect(isAtiParticipant(person(true, 'contributor'))).toBe(true);
    });

    test('a contact is never a participant, which keeps TAAP signers out of member pickers', () => {
        expect(isAtiParticipant(person(true, 'contact'))).toBe(false);
    });

    test('someone no longer in role is not offered, whatever their involvement', () => {
        expect(isAtiParticipant(person(false, 'member'))).toBe(false);
        expect(isCurrentPerson(person(false, 'contact'))).toBe(false);
    });

    test('contacts are current people for record pickers such as TAAP signers', () => {
        expect(isCurrentPerson(person(true, 'contact'))).toBe(true);
    });

    test('a person with no involvement recorded is treated as a contact', () => {
        expect(involvementOf({ active: true })).toBe('contact');
        expect(isAtiParticipant({ active: true })).toBe(false);
    });

    test('people sort by name, ignoring case, without changing the input', () => {
        const people = [{ name: 'zoe Adams' }, { name: 'Amir Khan' }, { name: 'Ángela Ruiz' }, {}];
        expect(sortByName(people).map((p) => p.name)).toEqual([undefined, 'Amir Khan', 'Ángela Ruiz', 'zoe Adams']);
        expect(people[0].name).toBe('zoe Adams');
    });
});
