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

import orderBy from 'lodash.orderby';
import { createSelector } from 'reselect';

import { getSmartWalletAddress } from 'utils/accounts';
import { userHasSmartWallet } from 'utils/smartWallet';

import {
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  accountsSelector,
} from './selectors';
import { accountAssetsSelector } from './assets';



export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  accountAssetsSelector,
  (history, activeAccountId, activeBlockchainNetwork, bitcoinAddresses, activeAssets) => {
    let mergedHistory = [];
    if (bitcoinAddresses.length && (activeAssets.BTC || activeBlockchainNetwork === 'BITCOIN')) {
      mergedHistory = [...(history[bitcoinAddresses[0].address] || [])];
    }
    if (!activeAccountId) return [];
    mergedHistory = [...mergedHistory, ...(history[activeAccountId] || [])];
    return orderBy(mergedHistory, ['createdAt'], ['desc']);
  },
);

export const smartAccountHistorySelector = createSelector(
  historySelector,
  accountsSelector,
  (history, accounts) => {
    const userHasSW = userHasSmartWallet(accounts);
    if (!userHasSW) return [];
    const smartAccountId = getSmartWalletAddress(accounts);
    if (!smartAccountId) return [];
    return orderBy(history[smartAccountId] || [], ['createdAt'], ['desc']);
  },
);

export const combinedHistorySelector = createSelector(
  historySelector,
  (history) => {
    const combinedHistory = Object.keys(history).reduce((historyArray, account) => {
      return [...historyArray, ...history[account]];
    }, []);

    return orderBy(combinedHistory, ['createdAt'], ['desc']);
  },
);

export const smartAccountHistorySelector = createSelector(
  historySelector,
  accountsSelector,
  (history, accounts) => {
    const userHasSW = userHasSmartWallet(accounts);
    if (!userHasSW) return [];
    const smartAccountId = getSmartWalletAddress(accounts);
    if (!smartAccountId) return [];
    return orderBy(history[smartAccountId] || [], ['createdAt'], ['desc']);
  },
);

export const combinedHistorySelector = createSelector(
  historySelector,
  (history) => {
    const combinedHistory = Object.keys(history).reduce((historyArray, account) => {
      return [...historyArray, ...history[account]];
    }, []);

    return orderBy(combinedHistory, ['createdAt'], ['desc']);
  },
);
