// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import t from 'translations/translate';

import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { saveDbAction } from 'actions/dbActions';
import { lockScreenAction } from 'actions/authActions';

import type { Dispatch } from 'reducers/rootReducer';


export type OAuthTokens = {
  refreshToken: ?string,
  accessToken: ?string,
};

export const updateOAuthTokensCB = (dispatch: Dispatch) => {
  return (oAuthTokens: OAuthTokens) => {
    dispatch({ type: UPDATE_OAUTH_TOKENS, payload: oAuthTokens });
    dispatch(saveDbAction('oAuthTokens', { oAuthTokens }, true));
  };
};

export const onOAuthTokensFailedCB = (dispatch: Dispatch) => {
  return async (refreshTokensCallback: (privateKey: string) => void) => {
    dispatch(lockScreenAction(
      refreshTokensCallback,
      t('paragraph.sessionExpiredReEnterPin'),
    ));
  };
};
