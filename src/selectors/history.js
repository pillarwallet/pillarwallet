// @flow
import orderBy from 'lodash.orderby';
import { createSelector } from 'reselect';
import {
  historySelector,
  activeAccountIdSelector,
  activeBlockchainSelector,
  bitcoinAddressSelector,
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
