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
import type { EthereumNetwork } from 'models/Network';

import {
  ETHEREUM_NETWORKS,
  SET_ETHEREUM_NETWORK,
} from 'constants/networkConstants';

export type NetworkReducerState = {|
  ethereumNetwork: EthereumNetwork,
|};

export type SetEthereumNetworkAction = {|
  type: 'SET_ETHEREUM_NETWORK',
  network: EthereumNetwork,
|};

export type NetworkReducerAction = SetEthereumNetworkAction

export const initialState: NetworkReducerState = {
  ethereumNetwork: ETHEREUM_NETWORKS[0],
};

const networkReducer = (
  state: NetworkReducerState = initialState,
  action: NetworkReducerAction,
): NetworkReducerState => {
  switch (action.type) {
    case SET_ETHEREUM_NETWORK:
      return { ...state, ethereumNetwork: action.network };

    default:
      return state;
  }
};
export default networkReducer;
