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

import BigNumber from 'bignumber.js';
import orderBy from 'lodash.orderby';
import get from 'lodash.get';

import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { CollectibleTrx } from 'models/Collectible';

import { TX_FAILED_STATUS, TX_PENDING_STATUS, TX_TIMEDOUT_STATUS, TRANSACTION_EVENT } from 'constants/historyConstants';
import { PAYMENT_NETWORK_ACCOUNT_TOPUP } from 'constants/paymentNetworkConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import {
  findAccountByAddress,
  checkIfSmartWalletAccount,
  checkIfKeyBasedAccount,
  getAccountName,
  getInactiveUserAccounts,
  getAccountAddress,
  getAccountTypeByAddress,
} from 'utils/accounts';
import { addressesEqual } from 'utils/assets';
import { findMatchingContact, getUserName } from './contacts';
import { uniqBy } from './common';


export function mapTransactionsHistory(
  history: Object[],
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
  eventType: string,
  keepHashDuplicatesIfBetweenAccounts?: boolean,
  duplicatePPN?: boolean,
) {
  const concatedHistory = history
    .map(({ type, ...rest }) => {
      if (eventType === TRANSACTION_EVENT) {
        return { ...rest, transactionType: type };
      }
      return rest;
    })
    .map(({ ...rest }) => ({ ...rest, type: eventType }))
    .map(({ to, from, ...rest }) => {
      const contact = findMatchingContact(to, contacts, contactsSmartAddresses)
        || findMatchingContact(from, contacts, contactsSmartAddresses);

      // apply to wallet accounts only if received from other account address
      const account = !contact && eventType !== COLLECTIBLE_TRANSACTION
        && (findAccountByAddress(from, getInactiveUserAccounts(accounts))
          || findAccountByAddress(to, getInactiveUserAccounts(accounts))
        );

      const username = account
        ? getAccountName(account.type)
        : getUserName(contact);

      const accountType = account ? account.type : null;

      return {
        username,
        to,
        from,
        accountType,
        ...rest,
      };
    });

  if (keepHashDuplicatesIfBetweenAccounts) {
    const accountsAddresses = accounts.map((acc) => getAccountAddress(acc));
    const ascendingHistory = orderBy(concatedHistory, ['createdAt'], ['asc']);

    const historyWithTrxBetweenAcc = ascendingHistory.reduce((alteredHistory, historyItem) => {
      const { from: fromAddress, to: toAddress, hash } = historyItem;
      const isTransactionFromUsersAccount = accountsAddresses
        .some((userAddress) => addressesEqual(fromAddress, userAddress));
      const isTransactionToUsersAccount = accountsAddresses
        .some((userAddress) => addressesEqual(toAddress, userAddress));
      const eventWithSameHashExists = alteredHistory.some((item) => item.hash === hash);

      if (eventWithSameHashExists) {
        if (isTransactionFromUsersAccount && isTransactionToUsersAccount) {
          return [...alteredHistory, {
            ...historyItem,
            accountType: getAccountTypeByAddress(toAddress, accounts),
            isReceived: true,
            betweenAccTrxDuplicate: true,
            _id: `${historyItem._id}_duplicate`,
            createdAt: historyItem.createdAt + 1,
          }];
        }
        return alteredHistory;
      } else if (duplicatePPN) {
        const itemTag = get(historyItem, 'tag');
        if (itemTag && itemTag === PAYMENT_NETWORK_ACCOUNT_TOPUP) {
          const duplicate = {
            ...historyItem,
            smartWalletEvent: true,
            _id: `${historyItem._id}_duplicate`,
            createdAt: historyItem.createdAt - 1,
          };
          return [...alteredHistory, duplicate, historyItem];
        }
        return [...alteredHistory, historyItem];
      }
      return [...alteredHistory, historyItem];
    }, []);
    return orderBy(historyWithTrxBetweenAcc, ['createdAt'], ['desc']);
  }

  return uniqBy(concatedHistory, 'hash');
}

// extending OpenSea transaction data with BCX data
export function mapOpenSeaAndBCXTransactionsHistory(
  openSeaHistory: CollectibleTrx[],
  BCXHistory: Object[],
  keepDuplicates?: boolean,
): CollectibleTrx[] {
  const concatedCollectiblesHistory = openSeaHistory
    .map(({ hash, ...rest }) => {
      const historyEntry = BCXHistory.find(({ hash: bcxHash }) => {
        return hash.toUpperCase() === bcxHash.toUpperCase();
      });

      return {
        hash,
        ...rest,
        ...historyEntry,
      };
    }).sort((a, b) => b.createdAt - a.createdAt);

  if (keepDuplicates) return concatedCollectiblesHistory;
  return uniqBy(concatedCollectiblesHistory, 'hash');
}

export type TransactionsGroup = {
  transactions: Transaction[],
  symbol: string,
  value: BigNumber,
};

export function groupPPNTransactions(ppnTransactions: Object[]): TransactionsGroup[] {
  const transactionsByAsset: {[string]: TransactionsGroup} = {};
  if (!ppnTransactions.length) return [];

  ppnTransactions.forEach((trx) => {
    const { symbol: _symbol, asset, value: rawValue } = trx;
    const symbol = _symbol || asset;


    const value = new BigNumber(rawValue);
    if (!transactionsByAsset[symbol]) {
      transactionsByAsset[symbol] = { transactions: [trx], value, symbol };
    } else {
      transactionsByAsset[symbol].transactions.push(trx);
      const currentValue = transactionsByAsset[symbol].value;
      transactionsByAsset[symbol].value = currentValue.plus(value);
    }
  });

  return (Object.values(transactionsByAsset): any);
}

export const elipsizeAddress = (address: string) => {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
};

export const isPendingTransaction = ({ status }: Object) => {
  return status === TX_PENDING_STATUS;
};

export const isFailedTransaction = ({ status }: Object) => {
  return status === TX_FAILED_STATUS;
};

export const isTimedOutTransaction = ({ status }: Object) => {
  return status === TX_TIMEDOUT_STATUS;
};

export const isSWAddress = (address: string, accounts: Accounts) => {
  const account = findAccountByAddress(address, accounts);
  return (!!account && checkIfSmartWalletAccount(account));
};

export const isKWAddress = (address: string, accounts: Accounts) => {
  const account = findAccountByAddress(address, accounts);
  return (!!account && checkIfKeyBasedAccount(account));
};

export const getContactWithAddress = (contacts: ApiUser[], address: string) => {
  return contacts.find(({ ethAddress }) => addressesEqual(address, ethAddress));
};

export const getUsernameOrAddress = (event: Object, address: string, contacts: ApiUser[]) => {
  if (event.username) {
    return event.username;
  }
  const contact = getContactWithAddress(contacts, address);
  if (contact) {
    return contact.username;
  }
  return elipsizeAddress(address);
};
