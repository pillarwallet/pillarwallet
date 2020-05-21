// @flow
import orderBy from 'lodash.orderby';
import { createSelector } from 'reselect';
import {
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
} from './selectors';

export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
  (history, activeAccountId, activeBlockchainNetwork, bitcoinAddresses) => {
    let mergedHistory = [];
    if (activeBlockchainNetwork && bitcoinAddresses.length) {
      mergedHistory = [...(history[bitcoinAddresses[0].address] || [])];
    }
    if (!activeAccountId) return [];
    mergedHistory = [...mergedHistory, ...(history[activeAccountId] || [])];
    return orderBy(mergedHistory, ['createdAt'], ['desc']);
  },
);
