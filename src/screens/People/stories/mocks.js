// @flow

/* eslint no-console: 0, no-unused-vars: 0 */
export const navigation = {
  addListener: (event: string, callback: Function) => ({ remove: () => console.log('remove') }),
  isFocused: () => true,
  dismiss: () => true,
  dispatch: () => true,
  getParam: () => console.log('getParam'),
  goBack: () => true,
  navigate: () => true,
  router: () => console.log('router'),
  state: {},
  setParams: () => true,
};

export const searchResults = {
  apiUsers: [],
  localContacts: [],
};
