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

import { EtherspotBundler, ModularSdk } from '@etherspot/modular-sdk';

// Constant
import { RESET_PILLARX_ADDRESS, SET_PILLARX_ADDRESS } from 'constants/modularSdkConstants';

// Reducer
import type { Dispatch } from 'reducers/rootReducer';

// Utils
import { reportErrorLog, logBreadcrumb } from 'utils/common';

// Configs
import { getEnv } from 'configs/envConfig';

export const fetchPillarXAddress = (privateKey: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const bundlerApiKey = getEnv().BUNDLER_API_KEY;
      const modularSdk = new ModularSdk(privateKey, {
        chainId: 1,
        bundlerProvider: new EtherspotBundler(1, bundlerApiKey),
      });

      const address: string = await modularSdk.getCounterFactualAddress();
      logBreadcrumb('fetchPillarXAddress', 'Successfully fetched PillarX address', { address });
      dispatch({ type: SET_PILLARX_ADDRESS, payload: address });
    } catch (error) {
      reportErrorLog('ModularSDK fetch pillarX address failed at', { error });
      dispatch({ type: RESET_PILLARX_ADDRESS });
    }
  };
};