// @flow
import type { ApiUser } from 'models/Contacts';

export function excludeLocalContacts(globalContacts: ApiUser[] = [], localContacts: Object[] = []): Object[] {
  const localContactsIds = localContacts.map(contact => contact.id);

  return globalContacts.filter((globalContact) => {
    return !localContactsIds.includes(globalContact.id);
  });
}
