// @flow
import get from 'lodash.get';
import { createSelector } from 'reselect';
import type { AccountsReducerState } from 'reducers/accountsReducer';
import type { BalancesReducerState } from 'reducers/balancesReducer';
import type { CollectiblesReducerState } from 'reducers/collectiblesReducer';
import type { HistoryReducerState } from 'reducers/historyReducer';
import type { PaymentNetworkReducerState } from 'reducers/paymentNetworkReducer';
import type { AssetsReducerState } from 'reducers/assetsReducer';
import type { UserSettingsReducerState } from 'reducers/userSettingsReducer';

import { getAccountAddress } from 'utils/accounts';

//
// Global selectors here
//

export const balancesSelector = ({ balances }: {balances: BalancesReducerState}) => balances.data;
export const collectiblesSelector = ({ collectibles }: {collectibles: CollectiblesReducerState}) => collectibles.data;
export const collectiblesHistorySelector =
  ({ collectibles }: {collectibles: CollectiblesReducerState}) => collectibles.transactionHistory;
export const historySelector = ({ history }: {history: HistoryReducerState}) => history.data;

export const paymentNetworkBalancesSelector =
  ({ paymentNetwork }: {paymentNetwork: PaymentNetworkReducerState}) => paymentNetwork.balances;

export const activeAccountSelector =
  ({ accounts }: {accounts: AccountsReducerState}) => accounts.data.find(({ isActive }) => isActive);

export const activeAccountIdSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? activeAccount.id : null,
);

export const activeAccountAddressSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? getAccountAddress(activeAccount) : '',
);

export const assetsSelector = ({ assets }: {assets: AssetsReducerState}) => assets.data;

export const hiddenAssetsSelector = ({ userSettings }: { userSettings: UserSettingsReducerState}) =>
  get(userSettings, 'data.hiddenAssets', {});
