// @flow
export type ApiUser = {
  id: string,
  username: string,
  connectionKey: string,
  profileImage?: string,
  profileLargeImage?: string,
  ethAddress: string,
  lastUpdateTime?: number,
};

export type SearchResults = {
  apiUsers: ApiUser[],
  localContacts: Object[],
};
