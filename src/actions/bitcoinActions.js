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
import Toast from 'components/Toast';
import {
  UPDATE_BITCOIN_BALANCE,
  REFRESH_THRESHOLD,
  SET_BITCOIN_ADDRESSES,
  BITCOIN_WALLET_CREATION_FAILED,
} from 'constants/bitcoinConstants';
import {
  keyPairAddress,
  getAddressUtxos,
  importKeyPair,
  exportKeyPair,
  rootFromMnemonic,
  transactionFromPlan,
  sendRawTransaction,
} from 'services/bitcoin';
import Storage from 'services/storage';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  BitcoinReducerAction,
  SetBitcoinAddressesAction,
  UpdateBitcoinBalanceAction,
  BitcoinWalletCreationFailedAction,
} from 'reducers/bitcoinReducer';
import type { EthereumWallet } from 'models/Wallet';
import type {
  BitcoinAddress,
  BitcoinTransactionPlan,
  BitcoinUtxo,
  BitcoinStore,
} from 'models/Bitcoin';

import { saveDbAction } from 'actions/dbActions';

const storage = Storage.getInstance('db');

const saveDb = (data: BitcoinStore) => {
  return saveDbAction('bitcoin', data);
};

const loadDb = async (): BitcoinStore => {
  return storage.get('bitcoin');
};

const setBitcoinAddresses = (addresses: string[]): SetBitcoinAddressesAction => ({
  type: SET_BITCOIN_ADDRESSES,
  addresses,
});

const updateBitcoinBalance = (
  address: string,
  unspentTransactions: BitcoinUtxo[],
): UpdateBitcoinBalanceAction => ({
  type: UPDATE_BITCOIN_BALANCE,
  address,
  unspentTransactions,
});

const bitcoinWalletCreationFailed = (): BitcoinWalletCreationFailedAction => ({
  type: BITCOIN_WALLET_CREATION_FAILED,
});

export const initializeBitcoinWalletAction = (wallet: EthereumWallet) => {
  return async (dispatch: Dispatch) => {
    const { mnemonic, path } = wallet;
    if (!mnemonic) {
      dispatch(bitcoinWalletCreationFailed());
      return;
    }

    const root = await rootFromMnemonic(mnemonic);
    const keyPair = root.derivePath(path);

    const address = keyPairAddress(keyPair);
    if (!address) {
      Toast.show({
        message: 'There was an error creating your Bitcoin wallet',
        type: 'warning',
        title: 'Cannot initialize Bitcoin',
        autoClose: false,
      });

      return;
    }

    dispatch(saveDb({
      keys: { [address]: exportKeyPair(keyPair) },
    }));

    dispatch(setBitcoinAddresses([address]));
  };
};

export const loadBitcoinAddresses = () => {
  return async (dispatch: Dispatch) => {
    const { keys = {} } = await loadDb();

    const loaded: string[] = Object.keys(keys);

    if (loaded.length) {
      dispatch(setBitcoinAddresses(loaded));
    }
  };
};

const outdatedAddresses = (addresses: BitcoinAddress[]): BitcoinAddress[] => {
  const threshold = Date.now() - REFRESH_THRESHOLD;

  return addresses.filter(({ updatedAt }) => updatedAt <= threshold);
};

const fetchBalanceAction = (address: string): Promise<BitcoinReducerAction> => {
  return getAddressUtxos(address)
    .then(unspentTransactions => updateBitcoinBalance(address, unspentTransactions))
    .catch(error => error);
};

const transactionSendingFailed = () => {
  Toast.show({
    message: 'There was an error sending the transaction',
    type: 'warning',
    title: 'Transaction could not be sent',
    autoClose: false,
  });
};

const fetchBalanceFailed = () => {
  Toast.show({
    message: 'There was an error fetching the Bitcoin balance',
    type: 'warning',
    title: 'Cannot fetch balance',
    autoClose: false,
  });
};

const transactionSent = () => {
  Toast.show({
    message: 'The transaction was sent to the Bitcoin network',
    type: 'success',
    title: 'Transaction sent',
    autoClose: true,
  });
};

export const sendTransactionAction = (plan: BitcoinTransactionPlan) => {
  return async () => {
    const { keys = {} } = await loadDb();

    const rawTransaction = transactionFromPlan(
      plan,
      (address: string) => importKeyPair(keys[address]),
    );

    sendRawTransaction(rawTransaction)
      .then((txid) => {
        if (!txid) {
          transactionSendingFailed();
          return;
        }

        transactionSent();
      })
      .catch(transactionSendingFailed);
  };
};

export const refreshBitcoinBalanceAction = (force: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { bitcoin: { data: { addresses } } } = getState();

    const addressesToUpdate = force ? addresses : outdatedAddresses(addresses);
    if (!addressesToUpdate.length) {
      return;
    }

    await Promise.all(addressesToUpdate.map(({ address }) => {
      return fetchBalanceAction(address)
        .then(action => dispatch(action))
        .catch(fetchBalanceFailed);
    }));
  };
};
