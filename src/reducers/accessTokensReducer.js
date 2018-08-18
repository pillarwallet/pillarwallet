// @flow
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';

export type AccessToken = {
  userId: string,
  myAccessToken: string,
  userAccessToken: string,
}

export type AccessTokensReducerState = {
  data: AccessToken[],
}

export type AccessTokensReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: [],
};

export default function accessTokensReducer(
  state: AccessTokensReducerState = initialState,
  action: AccessTokensReducerAction,
) {
  switch (action.type) {
    case UPDATE_ACCESS_TOKENS:
      return { ...state, data: action.payload };
    default:
      return state;
  }
}
