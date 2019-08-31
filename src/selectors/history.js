// @flow
import { createSelector } from 'reselect';
import { historySelector, activeAccountIdSelector } from './selectors';

export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  (history, activeAccountId) => {
    if (!activeAccountId) return [];
    return (history[activeAccountId] || []).sort((a, b) => b.createdAt - a.createdAt);
  },
);
