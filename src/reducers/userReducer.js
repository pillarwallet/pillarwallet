// @flow
import { UPDATE_USER } from 'constants/userConstants';
import merge from 'lodash.merge';

export type UserReducerState = {
  data: Object,
  userState: ?string,
}

export type UserReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {
    icoService: {},
  },
  userState: null,
};

export default function userReducer(
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
    default:
      return state;
  }
}
