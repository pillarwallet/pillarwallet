// @flow
import { createSelector } from 'reselect';
import { balancesSelector } from './selectors';

export const accountBalancesSelector = createSelector(
  balancesSelector,
  balances => balances,
);
