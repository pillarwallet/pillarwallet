// @flow
import orderBy from 'lodash.orderby';
import { createSelector } from 'reselect';
import { historySelector, activeAccountIdSelector } from './selectors';

export const accountHistorySelector = createSelector(
  historySelector,
  activeAccountIdSelector,
  (history, activeAccountId) => {
    if (!activeAccountId) return [];
    return orderBy(history[activeAccountId] || [], ['createdAt'], ['desc']);
  },
);
