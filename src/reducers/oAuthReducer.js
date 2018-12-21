// @flow
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';

type OAuthTokens = {
  refreshToken: ?string,
  accessToken: ?string,
};

export type OAuthReducerState = {
  data: OAuthTokens
}

export type OAuthReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {
    refreshToken: null,
    accessToken: null,
  },
};

export default function oAuthReducer(
  state: OAuthReducerState = initialState,
  action: OAuthReducerAction,
): OAuthReducerState {
  switch (action.type) {
    case UPDATE_OAUTH_TOKENS:
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}
