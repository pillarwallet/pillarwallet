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
import { UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES } from 'constants/paymentNetworkConstants';
import type { PaymentNetworkStore } from 'models/PaymentNetwork';

export type PaymentNetworkState = {
  data: PaymentNetworkStore,
};

export type PaymentNetworkAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    accounts: {},
  },
};

export default function paymentNetworkReducer(
  state: PaymentNetworkState = initialState,
  action: PaymentNetworkAction,
): PaymentNetworkState {
  switch (action.type) {
    case UPDATE_PAYMENT_NETWORK_ACCOUNT_BALANCES:
      return merge({}, state, { data: { accounts: { [action.payload.accountId]: action.payload.balances } } });
    default:
      return state;
  }
}
