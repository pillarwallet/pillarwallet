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

import { createSelector } from 'reselect';
import { mapValues } from 'lodash';

// utils
import { findFirstArchanovaAccount, getAccountId } from 'utils/accounts';
import {
  getAssetData,
  getAssetsAsList,
  getBalanceBN,
  getBalanceInFiat,
  getFormattedBalanceInFiat,
  mapWalletAssetsBalancesIntoAssets,
} from 'utils/assets';
import { reportErrorLog } from 'utils/common';

// types
import type {
  SupportedAssetsPerChain,
  Rates,
  Assets,
  Asset,
} from 'models/Asset';
import type {
  AssetBalancesPerAccount,
  CategoryBalancesPerChain,
  WalletAssetsBalances,
} from 'models/Balances';
import type { ChainRecord } from 'models/Chain';
import type { Account } from 'models/Account';

import {
  accountAssetsBalancesSelector,
  accountEthereumWalletAssetsBalancesSelector,
} from 'selectors/balances';
import {
  activeAccountIdSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  ratesSelector,
  baseFiatCurrencySelector,
  assetsBalancesSelector,
} from './selectors';


export const ethereumSupportedAssetsSelector = createSelector(
  supportedAssetsPerChainSelector,
  (supportedAssets: SupportedAssetsPerChain): Asset[] => supportedAssets?.ethereum ?? [],
);


export const accountAssetsSelector = createSelector(
  accountAssetsBalancesSelector,
  supportedAssetsPerChainSelector,
  (
    accountAssetsBalances: CategoryBalancesPerChain,
    supportedAssets: SupportedAssetsPerChain,
  ): ChainRecord<Assets> => mapValues(
    accountAssetsBalances,
    ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssets(
      accountWalletBalances,
      supportedAssets?.[chain] ?? [],
    ),
  ),
);

export const accountEthereumAssetsSelector = createSelector(
  accountEthereumWalletAssetsBalancesSelector,
  ethereumSupportedAssetsSelector,
  (
    accountEthereumWalletBalances: WalletAssetsBalances,
    ethereumSupportedAssets: Asset[],
  ): Assets => mapWalletAssetsBalancesIntoAssets(
    accountEthereumWalletBalances,
    ethereumSupportedAssets,
  ),
);

export const archanovaAccountEthereumAssetsSelector = createSelector(
  assetsBalancesSelector,
  ethereumSupportedAssetsSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    ethereumSupportedAssets: Asset[],
    accounts: Account[],
  ): Assets => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return {};

    const accountId = getAccountId(archanovaAccount);
    const accountEthereumAssets = assetsBalances?.[accountId]?.ethereum ?? {};
    const accountEthereumWalletBalances = accountEthereumAssets?.wallet ?? {};

    return mapWalletAssetsBalancesIntoAssets(
      accountEthereumWalletBalances,
      ethereumSupportedAssets,
    );
  },
);

export const etherspotAccountAssetsSelector = createSelector(
  assetsBalancesSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    supportedAssets: SupportedAssetsPerChain,
    accounts: Account[],
  ): ChainRecord<Assets> => {
    const etherspotAccount = findFirstArchanovaAccount(accounts);
    if (!etherspotAccount) return { ethereum: {} };

    const accountId = getAccountId(etherspotAccount);
    const accountAssetsBalances = assetsBalances?.[accountId] ?? {};

    return mapValues(
      accountAssetsBalances,
      ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssets(
        accountWalletBalances,
        supportedAssets?.[chain] ?? [],
      ),
    );
  },
);

/**
 * @deprecated: used only on Archanova legacy screens
 */
export const assetDecimalsSelector = (assetSelector: (state: Object, props: Object) => number) => createSelector(
  accountEthereumAssetsSelector,
  ethereumSupportedAssetsSelector,
  assetSelector,
  (
    assets: Assets,
    ethereumSupportedAssets: Asset[],
    asset: string,
  ) => {
    const { decimals = 18 } = getAssetData(getAssetsAsList(assets), ethereumSupportedAssets, asset);
    return decimals;
  },
);

export const accountAssetsWithBalanceSelector = createSelector(
  activeAccountIdSelector,
  ratesSelector,
  baseFiatCurrencySelector,
  accountAssetsBalancesSelector,
  supportedAssetsPerChainSelector,
  (
    activeAccountId: string,
    rates: Rates,
    baseFiatCurrency: ?string,
    accountAssetsBalances: CategoryBalancesPerChain,
    supportedAssets: SupportedAssetsPerChain,
  ) => {
    if (!activeAccountId) return {};

    return Object.keys(accountAssetsBalances).reduce((assetsWithBalance, chain) => {
      const balances = accountAssetsBalances[chain]?.wallet ?? {};

      Object.keys(balances).forEach((symbol) => {
        const assetBalanceBN = getBalanceBN(balances, symbol);
        if (assetBalanceBN.isZero()) return;

        const chainSupportedAssets = supportedAssets[chain];
        if (!chainSupportedAssets?.length) return;

        const relatedAsset = chainSupportedAssets.find(({ symbol: supportedSymbol }) => supportedSymbol === symbol);
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
