// @flow
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { signalInitAction } from 'actions/signalClientActions';
import { saveDbAction } from 'actions/dbActions';

export type OAuthTokens = {
  refreshToken?: string,
  accessToken?: string,
};

export const updateOAuthTokensCB = (dispatch: Function, signalCredentials?: Object) => {
  return async (oAuthTokens: OAuthTokens) => {
    dispatch({
      type: UPDATE_OAUTH_TOKENS,
      payload: oAuthTokens,
    });
    if (typeof signalCredentials !== 'undefined') dispatch(signalInitAction({ ...signalCredentials, ...oAuthTokens }));
    dispatch(saveDbAction('oAuthTokens', { oAuthTokens }, true));
  };
};
