// @flow
import { createSelector } from 'reselect';
import type { AccountsState } from 'reducers/accountsReducer';
import type { BalancesState } from 'reducers/balancesReducer';
import type { CollectiblesState } from 'reducers/collectiblesReducer';
import type { HistoryState } from 'reducers/historyReducer';
import type { PaymentNetworkState } from 'reducers/paymentNetworkReducer';

//
// Global selectors here
//

export const balancesSelector = ({ balances }: {balances: BalancesState}) => balances.data;
export const collectiblesSelector = ({ collectibles }: {collectibles: CollectiblesState}) => collectibles.data;
export const collectiblesHistorySelector =
  ({ collectibles }: {collectibles: CollectiblesState}) => collectibles.transactionHistory;
export const historySelector = ({ history }: {history: HistoryState}) => history.data;

export const paymentNetworkAccountsSelector =
  ({ paymentNetwork }: {paymentNetwork: PaymentNetworkState}) => paymentNetwork.accounts;

export const activeAccountSelector =
  ({ accounts }: {accounts: AccountsState}) => accounts.data.find(({ isActive }) => isActive);

export const activeAccountIdSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? activeAccount.id : null,
);
