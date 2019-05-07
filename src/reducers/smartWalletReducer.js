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
import {
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  ADD_SMART_WALLET_UPGRADE_ASSETS,
  ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  DISMISS_SMART_WALLET_UPGRADE,
} from 'constants/smartWalletConstants';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';
import type { AssetTransfer } from 'models/Asset';
import type { CollectibleTransfer } from 'models/Collectible';

export type WalletReducerState = {
  upgradeDismissed: boolean,
  sdkInitialized: boolean,
  connectedAccount: Object,
  accounts: SmartWalletAccount[],
  upgrade: {
    transfer: {
      assets: AssetTransfer[],
      collectibles: CollectibleTransfer[],
    },
  }
}

export type WalletReducerAction = {
  type: string,
  payload?: any,
};

const initialState = {
  upgradeDismissed: false,
  sdkInitialized: false,
  connectedAccount: {},
  accounts: [],
  upgrade: {
    transfer: {
      assets: [],
      collectibles: [],
    },
  },
};

export default function smartWalletReducer(
  state: WalletReducerState = initialState,
  action: WalletReducerAction,
) {
  switch (action.type) {
    case SET_SMART_WALLET_SDK_INIT:
      return {
        ...state,
        sdkInitialized: action.payload,
      };
    case SET_SMART_WALLET_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload,
      };
    case SET_SMART_WALLET_CONNECTED_ACCOUNT:
      return {
        ...state,
        connectedAccount: action.payload,
      };
    case ADD_SMART_WALLET_UPGRADE_ASSETS:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          transfer: {
            ...state.upgrade.transfer,
            assets: action.payload,
          },
        },
      };
    case ADD_SMART_WALLET_UPGRADE_COLLECTIBLES:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          transfer: {
            ...state.upgrade.transfer,
            collectibles: action.payload,
          },
        },
      };
    case DISMISS_SMART_WALLET_UPGRADE:
      return {
        ...state,
        upgradeDismissed: true,
      };
    default:
      return state;
  }
}
