import { RootReducerState } from 'reducers/rootReducer';

// user, ensName,
export const purgeSensitiveDataFromState = (initialState: RootReducerState): Partial<RootReducerState> => {
  let state = { ...initialState };

  // user
  if (state.user) delete state.user;

  // appSettings
  if (state.appSettings?.data?.deviceUniqueId) delete state.appSettings.data.deviceUniqueId;

  return state;
};

export const validateStateToSync = (state: Partial<RootReducerState>): boolean => {
  // user
  if (state.user) return false;

  // appSettings
  if (state.appSettings?.data?.deviceUniqueId) return false;

  return true;
};
