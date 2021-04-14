// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import get from 'lodash.get';

import { defaultFiatCurrency } from 'constants/assetsConstants';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Asset, Assets, AssetsByAccount } from 'models/asset';

import { getAccountAddress } from 'utils/accounts';

export type Selector<Result, Props = void> = (state: RootReducerState, props?: Props) => Result;

export const useRootSelector = <T>(selector: (state: RootReducerState) => T): T =>
  useSelector((root: RootReducerState) => selector(root));

// Most commonly used selectors
export const useFiatCurrency = () => useRootSelector(fiatCurrencySelector);
export const useRates = () => useRootSelector(ratesSelector);

//
// Global selectors here
//

export const fiatCurrencySelector = (root: RootReducerState) =>
  root.appSettings.data.baseFiatCurrency ?? defaultFiatCurrency;

export const balancesSelector = ({ balances }: RootReducerState) => balances.data;
export const collectiblesSelector = ({ collectibles }: RootReducerState) => collectibles.data;
export const collectiblesHistorySelector =
  ({ collectibles }: RootReducerState) => collectibles.transactionHistory;
export const historySelector = ({ history }: RootReducerState) => history.data;

export const paymentNetworkBalancesSelector =
  ({ paymentNetwork }: RootReducerState) => paymentNetwork.balances;

export const accountsSelector = ({ accounts }: RootReducerState) => accounts.data;

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

export const assetsSelector = ({ assets }: RootReducerState): AssetsByAccount => assets.data;
export const syntheticAssetsSelector = ({ synthetics }: RootReducerState) => synthetics.data;


export const hiddenAssetsSelector = ({ userSettings }: RootReducerState) =>
  get(userSettings, 'data.hiddenAssets', {});

export const supportedAssetsSelector = ({ assets }: RootReducerState): Asset[] =>
  get(assets, 'supportedAssets', []);

export const activeBlockchainSelector = ({ appSettings }: RootReducerState) =>
  get(appSettings, 'data.blockchainNetwork', 'Ethereum');

export const themeSelector = ({ appSettings }: RootReducerState) => appSettings.data.themeType;
export const baseFiatCurrencySelector = ({ appSettings }: RootReducerState) => appSettings.data.baseFiatCurrency;

export const ratesSelector = ({ rates }: RootReducerState) => rates.data;

export const poolTogetherStatsSelector = ({ poolTogether }: RootReducerState) =>
  get(poolTogether, 'poolStats', {});

export const contactsSelector = ({ contacts }: RootReducerState) => contacts.data;

export const lendingSelector = ({ lending }: RootReducerState) => lending;

export const sablierSelector = ({ sablier }: RootReducerState) => sablier;

export const rariSelector = ({ rari }: RootReducerState) => rari;

export const liquidityPoolsSelector = ({ liquidityPools }: RootReducerState) => liquidityPools;
