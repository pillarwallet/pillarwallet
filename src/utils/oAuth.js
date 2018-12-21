// @flow
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { saveDbAction } from 'actions/dbActions';

type OAuthTokens = {
  refreshToken: string,
  accessToken: string,
};

export const updateOAuthTokensCB = (dispatch: Function) => {
  return async (oAuthTokens: OAuthTokens) => {
    dispatch({
      type: UPDATE_OAUTH_TOKENS,
      payload: oAuthTokens,
    });

    dispatch(saveDbAction('oAuthTokens', { oAuthTokens }, true));
  };
};
