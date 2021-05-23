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
import { getEnv } from 'configs/envConfig';

// utils
import {
  findFirstArchanovaAccount,
  findFirstEtherspotAccount,
  getAccountId,
  getEnabledAssets,
} from 'utils/accounts';
import { getAssetData, getAssetsAsList, getBalance, getFormattedBalanceInFiat } from 'utils/assets';

// constants
import { DEFAULT_ACCOUNTS_ASSETS_DATA_KEY } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';

import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import {
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  supportedAssetsSelector,
  accountsSelector,
  ratesSelector,
  baseFiatCurrencySelector,
} from './selectors';


export const accountAssetsSelector = createSelector(
  assetsSelector,
  activeAccountIdSelector,
  hiddenAssetsSelector,
  (assets, activeAccountId, hiddenAssets) => {
    if (!activeAccountId) {
      // return default in case account was created offline
      return get(assets, DEFAULT_ACCOUNTS_ASSETS_DATA_KEY, {});
    }
    const activeAccountAssets = get(assets, activeAccountId, {});
    const activeAccountHiddenAssets = get(hiddenAssets, activeAccountId, []);

    return getEnabledAssets(activeAccountAssets, activeAccountHiddenAssets);
  },
);

export const archanovaAccountAssetsSelector = createSelector(
  assetsSelector,
  accountsSelector,
  hiddenAssetsSelector,
  (assets, accounts, hiddenAssets) => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return {};

    const accountId = getAccountId(archanovaAccount);

    const accountAssets = get(assets, accountId, {});
    const accountHiddenAssets = get(hiddenAssets, accountId, []);

    return getEnabledAssets(accountAssets, accountHiddenAssets);
  },
);

export const etherspotAccountAssetsSelector = createSelector(
  assetsSelector,
  accountsSelector,
  hiddenAssetsSelector,
  (assets, accounts, hiddenAssets) => {
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) return {};

    const accountId = getAccountId(etherspotAccount);

    const accountAssets = get(assets, accountId, {});
    const accountHiddenAssets = get(hiddenAssets, accountId, []);

    return getEnabledAssets(accountAssets, accountHiddenAssets);
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

/**
 * Returns array of assets to be used for asset data lookup.
 */
export const assetRegistrySelector: (RootReducerState) => Asset[] = createSelector(
  allAccountsAssetsSelector,
  supportedAssetsSelector,
  (assets, supportedAssets) => [...getAssetsAsList(assets), ...supportedAssets],
);

export const assetDecimalsSelector = (assetSelector: (state: Object, props: Object) => number) => createSelector(
  allAccountsAssetsSelector,
  supportedAssetsSelector,
  assetSelector,
  (assets, supportedAssets, asset) => {
    const { decimals = 18 } = getAssetData(getAssetsAsList(assets), supportedAssets, asset);
    return decimals;
  },
);

export const visibleActiveAccountAssetsWithBalanceSelector = createSelector(
  activeAccountIdSelector,
  accountEthereumWalletAssetsBalancesSelector,
  ratesSelector,
  baseFiatCurrencySelector,
  accountAssetsSelector,
  (activeAccountId: string, balances: WalletAssetsBalances, rates: Rates, baseFiatCurrency: ?string, assets: Assets) => {
    if (!activeAccountId || !balances || !assets) return {};

    return Object.keys(assets).reduce((assetsWithBalance, symbol) => {
      const relatedAsset = assets[symbol];
      const assetBalance = getBalance(balances, symbol);
      if (assetBalance) {
        const { iconUrl, address } = relatedAsset;
        const imageUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);

        // $FlowFixMe: flow update to 0.122
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
