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
import { SET_ETHEREUM_NETWORK } from 'constants/networkConstants';

import { updateAppSettingsAction } from 'actions/appSettingsActions';
import { findEthereumNetwork } from 'utils/networks';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { SetEthereumNetworkAction } from 'reducers/networkReducer';
import type { EthereumNetwork } from 'models/Network';
import Toast from 'components/Toast';

export const setEthereumNetwork = (network: EthereumNetwork): SetEthereumNetworkAction => ({
  type: SET_ETHEREUM_NETWORK,
  network,
});

export const selectEthereumNetworkAction = (networkId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { network: { ethereumNetwork } } = getState();
    const selectedNetwork = findEthereumNetwork(networkId);

    dispatch(updateAppSettingsAction('ethereumNetwork', selectedNetwork.id));

    if (ethereumNetwork.id !== selectedNetwork.id) {
      Toast.show({
        type: 'info',
        title: 'Network changed',
        message: 'Please restart the wallet for the changes to take effect',
      });
    }
  };
};
