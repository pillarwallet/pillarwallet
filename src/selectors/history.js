// @flow
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


export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  (history, activeAccountId, activeBlockchainNetwork, bitcoinAddresses) => {
    if (activeBlockchainNetwork && activeBlockchainNetwork === 'BITCOIN' && bitcoinAddresses.length) {
      return orderBy(history[bitcoinAddresses[0].address] || [], ['createdAt'], ['desc']);
    }
    if (!activeAccountId) return [];
    return orderBy(history[activeAccountId] || [], ['createdAt'], ['desc']);
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
