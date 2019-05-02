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
} from 'constants/walletConstants';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';

export type WalletReducerState = {
  sdkInitialized: boolean,
  connectedAccount: Object,
  accounts: SmartWalletAccount[],
}

export type WalletReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  sdkInitialized: false,
  connectedAccount: {},
  accounts: [],
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
    default:
      return state;
  }
}
