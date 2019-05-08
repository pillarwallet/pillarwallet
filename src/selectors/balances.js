// @flow
import { createSelector } from 'reselect';
import { balancesSelector, activeAccountIdSelector } from './selectors';

export const accountBalancesSelector = createSelector(
  balancesSelector,
  activeAccountIdSelector,
  (balances, activeAccountId) => {
    if (!activeAccountId) return {};
    return balances[activeAccountId] || {};
  },
);
