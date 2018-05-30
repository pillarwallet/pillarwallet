// @flow
import { SET_USER } from 'constants/userConstants';

export type UserReducerState = {
  data: Object,
  userState: ?string,
}

export type UserReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {},
  userState: null,
};

export default function assetsReducer(
  state: UserReducerState = initialState,
  action: UserReducerAction,
) {
  switch (action.type) {
    case SET_USER:
      const { state: userState, user } = action.payload;
      return {
        ...state,
        data: user,
        userState,
      };
    default:
      return state;
  }
}
