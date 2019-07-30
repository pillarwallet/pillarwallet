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
  UPDATE_PAYMENT_NETWORK_BALANCES,
  UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES,
  PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
  PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS,
  SET_ESTIMATED_SETTLE_BALANCE_FEE,
  UPDATE_PAYMENT_NETWORK_STAKED,
  RESET_PAYMENT_NETWORK,
  SET_AVAILABLE_TO_SETTLE_TX,
  START_FETCHING_AVAILABLE_TO_SETTLE_TX,
} from 'constants/paymentNetworkConstants';
import type { TopUpFee, SettleBalanceFee } from 'models/PaymentNetwork';
import type { Balances } from 'models/Asset';

export type PaymentNetworkState = {
  availableStake: string,
  balances: Balances,
  topUpFee: TopUpFee,
  settleBalanceFee: SettleBalanceFee,
  txToListen: string[],
  availableToSettleTx: {
    data: Object[],
    isFetched: boolean,
  },
};

export type PaymentNetworkAction = {
  type: string,
  payload: any,
};

const initialState = {
  availableStake: '0',
  balances: {},
  topUpFee: {
    isFetched: false,
    feeInfo: null,
  },
  settleBalanceFee: {
    isFetched: false,
    feeInfo: null,
  },
  txToListen: [],
  availableToSettleTx: {
    data: [],
    isFetched: false,
  },
};

export default function paymentNetworkReducer(
  state: PaymentNetworkState = initialState,
  action: PaymentNetworkAction,
): PaymentNetworkState {
  switch (action.type) {
    case UPDATE_PAYMENT_NETWORK_BALANCES:
      return merge({}, state, { balances: action.payload });
    case UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES:
      return merge({}, state, { balances: { [action.payload.accountId]: action.payload.balances } });
    case UPDATE_PAYMENT_NETWORK_STAKED:
      return merge({}, state, { availableStake: action.payload || initialState.availableStake });
    case SET_ESTIMATED_TOPUP_FEE:
      return merge({}, state, { topUpFee: { feeInfo: action.payload, isFetched: true } });
    case SET_ESTIMATED_SETTLE_BALANCE_FEE:
      return merge({}, state, { settleBalanceFee: { feeInfo: action.payload, isFetched: true } });
    case PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS:
      return merge({}, state, { txToListen: [...state.txToListen, action.payload] });
    case PAYMENT_NETWORK_UNSUBSCRIBE_TX_STATUS:
      return {
        ...state,
        txToListen: state.txToListen.filter(hash => hash.toLowerCase() !== action.payload.toLowerCase()),
      };
    case RESET_PAYMENT_NETWORK:
      return { ...initialState };
    case START_FETCHING_AVAILABLE_TO_SETTLE_TX:
      return {
        ...state,
        availableToSettleTx: {
          data: [],
          isFetched: false,
        },
      };
    case SET_AVAILABLE_TO_SETTLE_TX:
      return {
        ...state,
        availableToSettleTx: {
          data: action.payload,
          isFetched: true,
        },
      };
    default:
      return state;
  }
}
