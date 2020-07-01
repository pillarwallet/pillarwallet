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

import get from 'lodash.get';
import { createSelector } from 'reselect';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { getFormattedBalanceInFiat } from 'screens/Exchange/utils';
import type { Assets, Balance, Rates } from 'models/Asset';
import { getEnabledAssets, getSmartWalletAddress } from 'utils/accounts';
import { getAssetData, getAssetsAsList, getBalance } from 'utils/assets';
import { userHasSmartWallet } from 'utils/smartWallet';
import {
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  supportedAssetsSelector,
  accountsSelector,
  ratesSelector,
  balancesSelector,
  baseFiatCurrencySelector,
} from './selectors';


export const accountAssetsSelector = createSelector(
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  (assets, activeAccountId, hiddenAssets) => {
    if (!activeAccountId) return {};
    const activeAccountAssets = get(assets, activeAccountId, {});
    const activeAccountHiddenAssets = get(hiddenAssets, activeAccountId, []);

    return getEnabledAssets(activeAccountAssets, activeAccountHiddenAssets);
  },
);

export const smartAccountAssetsSelector = createSelector(
  assetsSelector,
  accountsSelector,
  hiddenAssetsSelector,
  (assets, accounts, hiddenAssets) => {
    const userHasSW = userHasSmartWallet(accounts);
    if (!userHasSW) return {};
    const smartAccountId = getSmartWalletAddress(accounts);
    if (!smartAccountId) return {};

    const activeAccountAssets = get(assets, smartAccountId, {});
    const activeAccountHiddenAssets = get(hiddenAssets, smartAccountId, []);

    return getEnabledAssets(activeAccountAssets, activeAccountHiddenAssets);
  },
);

export const makeAccountEnabledAssetsSelector = (accountId: string) => createSelector(
  assetsSelector,
  hiddenAssetsSelector,
  (assets, hiddenAssets) => {
    const accountAssets = get(assets, accountId, {});
    const accountHiddenAssets = get(hiddenAssets, accountId, []);
    return getEnabledAssets(accountAssets, accountHiddenAssets);
  },
);

export const allAccountsAssetsSelector = createSelector(
  assetsSelector,
  hiddenAssetsSelector,
  (assets, hiddenAssets) => {
    return Object.keys(assets).reduce((memo, accountId) => {
      const accountAssets = get(assets, accountId, {});
      const accountHiddenAssets = get(hiddenAssets, accountId, []);
      const enabledAssets = getEnabledAssets(accountAssets, accountHiddenAssets);
      const newAssets = Object.keys(enabledAssets).filter((asset) => !memo.includes(asset));
      return [...memo, ...newAssets];
    }, []);
  },
);

export const assetDecimalsSelector = (assetSelector: (state: Object, props: Object) => number) => createSelector(
  assetsSelector,
  supportedAssetsSelector,
  assetSelector,
  (assets, supportedAssets, asset) => {
    const { decimals = 18 } = getAssetData(getAssetsAsList(assets), supportedAssets, asset);
    return decimals;
  },
);

export const visibleActiveAccountAssetsWithBalanceSelector = createSelector(
  activeAccountIdSelector,
  balancesSelector,
  ratesSelector,
  baseFiatCurrencySelector,
  accountAssetsSelector,
  (activeAccountId: string, balances: Balance, rates: Rates, baseFiatCurrency: ?string, assets: Assets) => {
    if (!activeAccountId || !balances || !assets) return {};
    const activeAccountBalance = balances[activeAccountId] || {};

    return Object.keys(assets).reduce((assetsWithBalance, symbol) => {
      const relatedAsset = assets[symbol];
      const assetBalance = getBalance(activeAccountBalance, symbol);
      if (assetBalance) {
        const { iconUrl, address } = relatedAsset;
        const imageUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);

        assetsWithBalance.push({
          imageUrl,
          formattedBalanceInFiat,
          balance: !!formattedBalanceInFiat && {
            balance: assetBalance,
            value: formattedBalanceInFiat,
            token: symbol,
          },
          token: symbol,
          value: symbol,
          contractAddress: address,
          ...relatedAsset,
        });
      }
      return assetsWithBalance;
    }, []);
  },
);
