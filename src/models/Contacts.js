// @flow
export type ApiUser = {
  id: string,
  username: string,
};

export type SearchResults = {
  apiUsers: ApiUser[],
  localContacts: Object[],
};
