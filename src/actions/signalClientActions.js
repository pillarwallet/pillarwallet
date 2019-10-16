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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import ChatService from 'services/chat';
import { updateSignalInitiatedStateAction } from 'actions/sessionActions';
import { getActiveAccountAddress } from 'utils/accounts';

const chat = new ChatService();

type SignalCredentials = {
  accessToken: string,
  refreshToken: string,
  username: string,
  userId: string,
  walletId: string,
  ethAddress: string,
  fcmToken: string,
}

export const signalInitAction = (credentials?: SignalCredentials) => {
  return async (dispatch: Function, getState: Function) => {
    const { session: { data: { isSignalInitiated, isOnline } } } = getState();
    if (!isOnline || isSignalInitiated) return;
    if (!credentials) {
      const {
        user: {
          data: {
            id: userId,
            username,
            walletId,
          },
        },
        session: { data: { fcmToken } },
        oAuthTokens: { data: OAuthTokensObject },
        accounts: { data: accounts },
      } = getState();
      const ethAddress = getActiveAccountAddress(accounts);
      credentials = {
        ...OAuthTokensObject,
        userId,
        username,
        walletId,
        ethAddress,
        fcmToken,
      };
    }

    const accessToken = get(credentials, 'accessToken');
    if (isEmpty(accessToken)) return; // init will fail if there is no access token

    const fcmToken = get(credentials, 'fcmToken');
    await chat.init(credentials)
      .then(() => chat.client.registerAccount())
      .then(() => fcmToken && chat.client.setFcmId(fcmToken))
      .then(() => dispatch(updateSignalInitiatedStateAction(true)))
      .catch(() => null);
  };
};
