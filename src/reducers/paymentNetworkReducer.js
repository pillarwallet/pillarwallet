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
import merge from 'lodash.merge';
import {
  SET_ESTIMATED_TOPUP_FEE,
  UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
  PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
  PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
} from 'constants/paymentNetworkConstants';
import type { Accounts, TopUpFee } from 'models/PaymentNetwork';

export type PaymentNetworkState = {
  accounts: Accounts,
  topUpFee: TopUpFee,
  txToListen: string[],
};

export type PaymentNetworkAction = {
  type: string,
  payload: any,
};

const initialState = {
  accounts: {},
  topUpFee: {
    isFetched: false,
    feeInfo: null,
  },
  txToListen: [],
};

export default function paymentNetworkReducer(
  state: PaymentNetworkState = initialState,
  action: PaymentNetworkAction,
): PaymentNetworkState {
  switch (action.type) {
    case UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES:
      return merge({}, state, { accounts: { [action.payload.accountId]: action.payload.balances } });
    case SET_ESTIMATED_TOPUP_FEE:
      return merge({}, state, { topUpFee: { feeInfo: action.payload, isFetched: true } });
    case PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS:
      return merge({}, state, { txToListen: [...state.txToListen, action.payload] });
    case PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS:
      return merge(
        {},
        state,
        {
          txToListen: state.txToListen.filter(hash => hash.toLowerCase() !== action.payload.toLowerCase()),
        },
      );
    default:
      return state;
  }
}
