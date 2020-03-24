// @flow
import get from 'lodash.get';
import { createSelector } from 'reselect';
import { getAccountAddress } from 'utils/accounts';

import type { RootReducerState } from 'reducers/rootReducer';

//
// Global selectors here
//

export const balancesSelector = ({ balances }: RootReducerState) => balances.data;
export const collectiblesSelector = ({ collectibles }: RootReducerState) => collectibles.data;
export const collectiblesHistorySelector =
  ({ collectibles }: RootReducerState) => collectibles.transactionHistory;
export const historySelector = ({ history }: RootReducerState) => history.data;

export const paymentNetworkBalancesSelector =
  ({ paymentNetwork }: RootReducerState) => paymentNetwork.balances;

export const activeAccountSelector =
  ({ accounts }: RootReducerState) => accounts.data.find(({ isActive }) => isActive);

export const activeAccountIdSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? activeAccount.id : null,
);

export const activeAccountWalletIdSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? activeAccount.walletId : null,
);

export const activeAccountAddressSelector = createSelector(
  activeAccountSelector,
  activeAccount => activeAccount ? getAccountAddress(activeAccount) : '',
);

export const assetsSelector = ({ assets }: RootReducerState) => assets.data;

export const hiddenAssetsSelector = ({ userSettings }: RootReducerState) =>
  get(userSettings, 'data.hiddenAssets', {});

export const supportedAssetsSelector = ({ assets }: RootReducerState) =>
  get(assets, 'supportedAssets', []);

export const bitcoinAddressSelector = ({ bitcoin }: RootReducerState) =>
  get(bitcoin, 'data.addresses', []);

export const activeBlockchainSelector = ({ appSettings }: RootReducerState) =>
  get(appSettings, 'data.blockchainNetwork', 'Ethereum');
