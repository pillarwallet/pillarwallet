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

import Web3Auth, { type LoginProvider, Web3authNetwork } from '@web3auth/react-native-sdk';

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

const initParams = {
  clientId,
  network: isProdEnv() ? Web3authNetwork.MAINNET : Web3authNetwork.TESTNET,
  redirectUrl: resolvedRedirectUrl,
};

export const loginWithWeb3Auth = (provider: LoginProvider, email?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await Web3Auth.init(initParams);

      const result = await Web3Auth.login({
        provider,
        redirectUrl: resolvedRedirectUrl,
        extraLoginOptions: email && {
          login_hint: email,
        },
      });

      if (!result) return null;

      dispatch(importWalletFromPrivateKeyAction(result?.privKey));
    } catch (error) {
      logBreadcrumb('loginWithWeb3Auth', 'failed loginWithWeb3Auth', { provider, error });
    }
  };
};
