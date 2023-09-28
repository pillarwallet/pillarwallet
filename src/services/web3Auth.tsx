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
import Web3Auth, { LOGIN_PROVIDER_TYPE, OPENLOGIN_NETWORK, OPENLOGIN_NETWORK_TYPE } from '@web3auth/react-native-sdk';
import * as WebBrowser from '@toruslabs/react-native-web-browser';
import EncryptedStorage from 'react-native-encrypted-storage';

// Utils
import { isProdEnv } from 'utils/environment';
import { logBreadcrumb } from 'utils/common';

// Config
import { getEnv } from 'configs/envConfig';

// Actions
import { importWalletFromPrivateKeyAction } from 'actions/onboardingActions';

// Types
import type { Dispatch } from 'reducers/rootReducer';

const scheme = 'com.pillarproject.wallet';
const resolvedRedirectUrl = `${scheme}://auth`;
const clientId = isProdEnv() ? getEnv().WEB3_AUTH_CLIENT_ID : getEnv().WEB3_AUTH_TESTNET_CLIENT_ID;

interface ParamsProps {
  clientId: string;
  network: OPENLOGIN_NETWORK_TYPE;
}

const initParams: ParamsProps = {
  clientId: clientId ?? 'clientId',
  network: isProdEnv() ? OPENLOGIN_NETWORK.MAINNET : OPENLOGIN_NETWORK.TESTNET,
};

const web3auth = new Web3Auth(WebBrowser, EncryptedStorage, initParams);

export const loginWithWeb3Auth = (loginProvider: LOGIN_PROVIDER_TYPE, email?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await web3auth.init();
      await web3auth.login({
        loginProvider,
        redirectUrl: resolvedRedirectUrl,
        extraLoginOptions: email && {
          login_hint: email,
        },
      });

      if (!web3auth?.privKey) return null;

      dispatch(importWalletFromPrivateKeyAction(web3auth.privKey));
    } catch (error) {
      logBreadcrumb('loginWithWeb3Auth', 'failed loginWithWeb3Auth', { loginProvider, error });
    }
  };
};

export const logoutWeb3Auth = async () => {
  if (!web3auth) return;

  try {
    await web3auth.logout();
  } catch (error) {
    logBreadcrumb('logoutWeb3Auth', 'failed logoutWeb3Auth', { error });
  }
};
