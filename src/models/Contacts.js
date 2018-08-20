// @flow
export type ApiUser = {
  id: string,
  username: string,
  connectionKey: string,
  profileImage?: string,
};

export type SearchResults = {
  apiUsers: ApiUser[],
  localContacts: Object[],
};
