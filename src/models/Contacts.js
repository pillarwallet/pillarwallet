// @flow
export type ApiUser = {
  id: string,
  username: string,
  connectionKey: string,
  profileImage?: string,
  ethAddress: string,
};

export type SearchResults = {
  apiUsers: ApiUser[],
  localContacts: Object[],
};
