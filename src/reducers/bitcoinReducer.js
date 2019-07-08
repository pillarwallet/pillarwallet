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

import type { BitcoinAddress, BitcoinUtxo } from 'models/Bitcoin';
import {
  UPDATE_BITCOIN_BALANCE,
  SET_BITCOIN_ADDRESSES,
} from 'constants/bitcoinConstants';

export type BitcoinReducerState = {
  data: {
    addresses: BitcoinAddress[],
    unspentTransactions: BitcoinUtxo[],
  },
};

type BitcoinReducerActionPayload = {
  addresses?: string[],
  address?: string,
  unspentTransactions?: BitcoinUtxo[],
};

export type BitcoinReducerAction = {
  type: string,
  payload?: BitcoinReducerActionPayload,
};

const initialState = {
  data: {
    addresses: [],
    unspentTransactions: [],
  },
};

const updateBalance = (
  state: BitcoinReducerState,
  payload: BitcoinReducerActionPayload,
): BitcoinReducerState => {
  const { unspentTransactions = [], address = '' } = payload;
  const { data: { addresses, unspentTransactions: transactions } } = state;

  const filteredTransactions: BitcoinUtxo[] = transactions.filter(
    ({ address: txAddress }) => address !== txAddress,
  );

  const matchingAddress: ?BitcoinAddress = addresses.find(
    ({ address: addr }) => addr === address,
  );
  if (!matchingAddress) {
    return state;
  }

  const updatedAddress: BitcoinAddress = { address, updatedAt: Date.now() };
  const filteredAddresses: BitcoinAddress[] = addresses.filter(
    ({ address: addr }) => addr !== address,
  );

  return {
    ...state,
    data: {
      addresses: [...filteredAddresses, updatedAddress],
      unspentTransactions: filteredTransactions.concat(...unspentTransactions),
    },
  };
};

const setAddresses = (
  state: BitcoinReducerState,
  payload: BitcoinReducerActionPayload,
): BitcoinReducerState => {
  const { addresses = [], unspentTransactions = [] } = payload;

  const addressesInfo: BitcoinAddress[] = addresses.map(
    address => ({ address, updatedAt: 0 }),
  );

  return {
    ...state,
    data: { addresses: addressesInfo, unspentTransactions },
  };
};

// const createAddress = (
//   state: BitcoinReducerState,
//   payload: BitcoinReducerActionPayload,
// ): BitcoinReducerState => {
//   const { address = '' } = payload;
//   const { data: { addresses, unspentTransactions } } = state;
//
//   if (!address) {
//     return { ...state, isCreatingAddress: false };
//   }
//
//   return {
//     ...state,
//     data: {
//       addresses: [
//         ...addresses,
//         { address, updatedAt: 0 },
//       ],
//       unspentTransactions,
//     },
//   };
// };

const bitcoinReducer = (
  state: BitcoinReducerState = initialState,
  action: BitcoinReducerAction,
): BitcoinReducerState => {
  const { type, payload = {} } = action;

  switch (type) {
    case SET_BITCOIN_ADDRESSES:
      return setAddresses(state, payload);

    // case CREATED_BITCOIN_ADDRESS:
    //   return createAddress(state, payload);

    case UPDATE_BITCOIN_BALANCE:
      return updateBalance(state, payload);

    default:
      return state;
  }
};

export default bitcoinReducer;
