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

// utils
import {
  findFirstArchanovaAccount,
  findFirstEtherspotAccount,
  getAccountId,
  getEnabledAssets,
} from 'utils/accounts';
import {
  getAssetData,
  getAssetsAsList,
  getBalanceBN,
  getBalanceInFiat,
  getFormattedBalanceInFiat,
} from 'utils/assets';
import { reportErrorLog } from 'utils/common';

// constants
import { DEFAULT_ACCOUNTS_ASSETS_DATA_KEY } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Rates } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { CategoryBalancesPerChain } from 'models/Balances';

import { accountAssetsBalancesSelector } from 'selectors/balances';
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

export const accountAssetsWithBalanceSelector = createSelector(
  activeAccountIdSelector,
  ratesSelector,
  baseFiatCurrencySelector,
  accountAssetsBalancesSelector,
  supportedAssetsSelector,
  (
    activeAccountId: string,
    rates: Rates,
    baseFiatCurrency: ?string,
    accountAssetsBalances: CategoryBalancesPerChain,
    supportedAssets: Assets[],
  ) => {
    if (!activeAccountId || !supportedAssets?.length) return {};

    return Object.keys(accountAssetsBalances).reduce((assetsWithBalance, chain) => {
      const balances = accountAssetsBalances[chain]?.wallet ?? {};

      Object.keys(balances).forEach((symbol) => {
        const assetBalanceBN = getBalanceBN(balances, symbol);
        if (assetBalanceBN.isZero()) return;

        const relatedAsset = supportedAssets.find(({ symbol: supportedSymbol }) => supportedSymbol === symbol);
        if (!relatedAsset) {
          reportErrorLog(
            'accountAssetsWithBalanceSelector failed: no supported asset found for existing balance',
            { symbol },
          );
          return;
        }

        const { iconUrl: imageUrl, address } = relatedAsset;
        const balanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalanceBN, rates, symbol);
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalanceBN, rates, symbol);

        assetsWithBalance.push({
          ...relatedAsset,
          imageUrl,
          formattedBalanceInFiat,
          balance: !!formattedBalanceInFiat && {
            balance: assetBalanceBN,
            balanceInFiat,
            value: formattedBalanceInFiat,
            token: symbol,
          },
          token: symbol,
          value: symbol,
          contractAddress: address,
          chain,
        });
      });

      return assetsWithBalance;
    }, []);
  },
);
