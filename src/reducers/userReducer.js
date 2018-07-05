// @flow
import { UPDATE_USER, UPDATE_SEARCH_RESULTS } from 'constants/userConstants';
import merge from 'lodash.merge';

export type UserReducerState = {
  data: Object,
  userState: ?string,
  searchResults: [],
}

export type UserReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {},
  userState: null,
  searchResults: [],
};

export default function assetsReducer(
  state: UserReducerState = initialState,
  action: UserReducerAction,
) {
  switch (action.type) {
    case UPDATE_USER:
      const { state: userState, user } = action.payload;
      return {
        ...state,
        data: merge({}, { ...state.data }, user),
        userState,
      };
    case UPDATE_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload };
    default:
      return state;
  }
}
