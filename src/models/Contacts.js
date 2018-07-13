// @flow
export type ApiUser = {
  id: string,
  username: string,
  accessKey: string,
};

export type SearchResults = {
  apiUsers: ApiUser[],
  localContacts: Object[],
};
