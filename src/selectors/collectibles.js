// @flow
import { createSelector } from 'reselect';
import { collectiblesSelector, collectiblesHistorySelector, activeAccountIdSelector } from './selectors';

export const accountCollectiblesSelector = createSelector(
  collectiblesSelector,
  activeAccountIdSelector,
  (collectibles, activeAccountId) => {
    if (!activeAccountId) return [];
    return collectibles[activeAccountId] || [];
  },
);

export const accountCollectiblesHistorySelector = createSelector(
  collectiblesHistorySelector,
  activeAccountIdSelector,
  (history, activeAccountId) => {
    if (!activeAccountId) return [];
    return history[activeAccountId] || [];
  },
);

export const combinedCollectiblesHistorySelector = createSelector(
  collectiblesHistorySelector,
  (history) => {
    return Object.keys(history).reduce((historyArray, account) => {
      return [...historyArray, ...history[account]];
    }, []);
  },
);
