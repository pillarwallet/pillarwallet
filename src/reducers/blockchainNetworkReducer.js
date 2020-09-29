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
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import {
  BLOCKCHAIN_NETWORK_TYPES,
  SET_ACTIVE_NETWORK,
} from 'constants/blockchainNetworkConstants';

export type BlockchainNetworkReducerState = {
  data: BlockchainNetwork[],
};

export type BlockchainNetworkAction = {
  type: string,
  payload: string,
};

const initialState: BlockchainNetworkReducerState = {
  data: [
    {
      id: BLOCKCHAIN_NETWORK_TYPES.ETHEREUM,
      isActive: true,
      translationKey: 'ethereum',
    },
    {
      id: BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK,
      isActive: false,
      translationKey: 'pillarNetwork',
    },
  ],
};

const blockchainNetworkReducer = (
  state: BlockchainNetworkReducerState = initialState,
  action: BlockchainNetworkAction,
): BlockchainNetworkReducerState => {
  switch (action.type) {
    case SET_ACTIVE_NETWORK:
      const activatedId = action.payload;

      return {
        ...state,
        data: state.data.map(
          ({ id, ...rest }) => ({ id, ...rest, isActive: id === activatedId }),
        ),
      };
    default:
      return state;
  }
};

export default blockchainNetworkReducer;
