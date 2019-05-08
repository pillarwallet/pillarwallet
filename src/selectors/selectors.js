// @flow
import type { AccountsState } from 'reducers/accountsReducer';
import type { BalancesState } from 'reducers/balancesReducer';
import { createSelector } from 'reselect';

//
// Global selectors here
//

export const balancesSelector = ({ balances }: {balances: BalancesState}) => balances.data;

export const activeAccountSelector =
  ({ accounts }: {accounts: AccountsState}) => accounts.data.find(({ isActive }) => isActive);

export const activeAccountIdSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? activeAccount.id : null,
);
