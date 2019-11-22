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
import type { BitcoinAddress, BitcoinUtxo, BitcoinBalance, BTCBalance } from 'models/Bitcoin';
import {
  CREATED_BITCOIN_ADDRESS,
  UPDATE_BITCOIN_BALANCE,
  SET_BITCOIN_ADDRESSES,
  BITCOIN_WALLET_CREATION_FAILED,
  UPDATE_UNSPENT_TRANSACTIONS,
} from 'constants/bitcoinConstants';

export type BitcoinReducerState = {
  data: {
    addresses: BitcoinAddress[],
    unspentTransactions: BitcoinUtxo[],
    balances: BitcoinBalance,
  },
  creationFailed?: boolean,
};

export type UpdateUnspentTransactionsAction = {
  type: 'UPDATE_UNSPENT_TRANSACTIONS',
  address: string,
  unspentTransactions: BitcoinUtxo[],
};

export type UpdateBitcoinBalanceAction = {
  type: 'UPDATE_BITCOIN_BALANCE',
  address: string,
  balance: BTCBalance,
};

export type SetBitcoinAddressesAction = {
  type: 'SET_BITCOIN_ADDRESSES',
  addresses: string[],
};

export type CreatedBitcoinAddressAction = {
  type: 'CREATED_BITCOIN_ADDRESS',
  address: string,
};

export type BitcoinWalletCreationFailedAction = {
  type: 'BITCOIN_WALLET_CREATION_FAILED',
};

export type BitcoinReducerAction =
  | UpdateBitcoinBalanceAction
  | UpdateUnspentTransactionsAction
  | SetBitcoinAddressesAction
  | CreatedBitcoinAddressAction
  | BitcoinWalletCreationFailedAction;

export const initialState = {
  data: {
    addresses: [],
    unspentTransactions: [],
    balances: {},
  },
};

const updateBalance = (
  state: BitcoinReducerState,
  action: UpdateBitcoinBalanceAction,
): BitcoinReducerState => {
  const { data: { balances, addresses, unspentTransactions } } = state;
  const { address, balance } = action;

  return {
    ...state,
    data: {
      balances: { ...balances, [address]: balance },
      addresses,
      unspentTransactions,
    },
  };
};

const updateUnspentTransactions = (
  state: BitcoinReducerState,
  action: UpdateUnspentTransactionsAction,
): BitcoinReducerState => {
  const { unspentTransactions, address } = action;
  const { data: { addresses, unspentTransactions: transactions, balances } } = state;

  const filteredTransactions: BitcoinUtxo[] = transactions.filter(
    ({ address: txAddress }) => address !== txAddress,
  );

  const matchingAddress = addresses.find(({ address: addr }) => addr === address);
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
      balances,
      addresses: [...filteredAddresses, updatedAddress],
      unspentTransactions: filteredTransactions.concat(...unspentTransactions),
    },
  };
};

const setAddresses = (
  state: BitcoinReducerState,
  action: SetBitcoinAddressesAction,
): BitcoinReducerState => {
  const { addresses } = action;
  const { data } = state;

  const addressesInfo: BitcoinAddress[] = addresses.map(
    address => ({ address, updatedAt: 0 }),
  );

  return {
    ...state,
    data: {
      ...data,
      addresses: addressesInfo,
    },
  };
};

const createdAddress = (
  state: BitcoinReducerState,
  action: CreatedBitcoinAddressAction,
): BitcoinReducerState => {
  const { address = '' } = action;
  const { data: { addresses, unspentTransactions, balances } } = state;

  if (!address) {
    return { ...state, isCreatingAddress: false };
  }

  return {
    ...state,
    data: {
      addresses: [
        ...addresses,
        { address, updatedAt: 0 },
      ],
      unspentTransactions,
      balances,
    },
  };
};

const bitcoinReducer = (
  state: BitcoinReducerState = initialState,
  action: BitcoinReducerAction,
): BitcoinReducerState => {
  switch (action.type) {
    case SET_BITCOIN_ADDRESSES:
      return setAddresses(state, action);
    case CREATED_BITCOIN_ADDRESS:
      return createdAddress(state, action);
    case UPDATE_BITCOIN_BALANCE:
      return updateBalance(state, action);
    case UPDATE_UNSPENT_TRANSACTIONS:
      return updateUnspentTransactions(state, action);
    case BITCOIN_WALLET_CREATION_FAILED:
      return { ...state, creationFailed: true };
    default:
      return state;
  }
};

export default bitcoinReducer;
