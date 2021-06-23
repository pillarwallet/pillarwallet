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

// Utils
import { findFirstArchanovaAccount, findFirstEtherspotAccount, getAccountId } from 'utils/accounts';
import {
  getAssetData,
  getAssetsAsList,
  getBalanceBN,
  getBalanceInFiat,
  getFormattedBalanceInFiat,
  mapWalletAssetsBalancesIntoAssetsBySymbol,
} from 'utils/assets';
import { reportErrorLog } from 'utils/common';

// Selectors
import {
  activeAccountIdSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  ratesPerChainSelector,
  type Selector,
  fiatCurrencySelector,
} from 'selectors';
import {
  assetsBalancesPerAccountSelector,
  accountAssetsBalancesSelector,
  accountEthereumWalletAssetsBalancesSelector,
} from 'selectors/balances';

// Types
import type { Account } from 'models/Account';
import type { AssetsPerChain, AssetsBySymbol, Asset } from 'models/Asset';
import type { AssetBalancesPerAccount, AccountAssetBalances, WalletAssetsBalances } from 'models/Balances';
import type { ChainRecord } from 'models/Chain';
import type { RatesPerChain, Currency } from 'models/Rates';


export const ethereumSupportedAssetsSelector: Selector<Asset[]> = createSelector(
  supportedAssetsPerChainSelector,
  (supportedAssets: AssetsPerChain): Asset[] => supportedAssets?.ethereum ?? [],
);


export const accountAssetsPerChainSelector: Selector<ChainRecord<AssetsBySymbol>> = createSelector(
  accountAssetsBalancesSelector,
  supportedAssetsPerChainSelector,
  (
    accountAssetsBalances: AccountAssetBalances,
    supportedAssets: AssetsPerChain,
  ): ChainRecord<AssetsBySymbol> => mapValues(
    accountAssetsBalances,
    ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssetsBySymbol(
      accountWalletBalances,
      supportedAssets?.[chain] ?? [],
    ),
  ),
);

export const accountEthereumAssetsSelector: Selector<AssetsBySymbol> = createSelector(
  accountEthereumWalletAssetsBalancesSelector,
  ethereumSupportedAssetsSelector,
  (
    accountEthereumWalletBalances: WalletAssetsBalances,
    ethereumSupportedAssets: Asset[],
  ): AssetsBySymbol => mapWalletAssetsBalancesIntoAssetsBySymbol(
    accountEthereumWalletBalances,
    ethereumSupportedAssets,
  ),
);

export const archanovaAccountEthereumAssetsSelector: Selector<AssetsBySymbol> = createSelector(
  assetsBalancesPerAccountSelector,
  ethereumSupportedAssetsSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    ethereumSupportedAssets: Asset[],
    accounts: Account[],
  ): AssetsBySymbol => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return {};

    const accountId = getAccountId(archanovaAccount);
    const accountEthereumAssets = assetsBalances?.[accountId]?.ethereum ?? {};
    const accountEthereumWalletBalances = accountEthereumAssets?.wallet ?? {};

    return mapWalletAssetsBalancesIntoAssetsBySymbol(
      accountEthereumWalletBalances,
      ethereumSupportedAssets,
    );
  },
);

export const etherspotAccountAssetsSelector: Selector<ChainRecord<AssetsBySymbol>> = createSelector(
  assetsBalancesPerAccountSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    supportedAssets: AssetsPerChain,
    accounts: Account[],
  ): ChainRecord<AssetsBySymbol> => {
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) return { ethereum: {} };

    const accountId = getAccountId(etherspotAccount);
    const accountAssetsBalances = assetsBalances?.[accountId] ?? {};

    return mapValues(
      accountAssetsBalances,
      ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssetsBySymbol(
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
    assets: AssetsBySymbol,
    ethereumSupportedAssets: Asset[],
    asset: string,
  ) => {
    const { decimals = 18 } = getAssetData(getAssetsAsList(assets), ethereumSupportedAssets, asset);
    return decimals;
  },
);

export const accountAssetsWithBalanceSelector = createSelector(
  activeAccountIdSelector,
  ratesPerChainSelector,
  fiatCurrencySelector,
  accountAssetsBalancesSelector,
  supportedAssetsPerChainSelector,
  (
    activeAccountId: string,
    ratesPerChain: RatesPerChain,
    baseFiatCurrency: Currency,
    accountAssetsBalances: AccountAssetBalances,
    supportedAssetsPerChain: AssetsPerChain,
  ) => {
    if (!activeAccountId) return {};

    return Object.keys(accountAssetsBalances).reduce((assetsWithBalance, chain) => {
      const balances = accountAssetsBalances[chain]?.wallet ?? {};

      Object.keys(balances).forEach((symbol) => {
        const assetBalanceBN = getBalanceBN(balances, symbol);
        if (assetBalanceBN.isZero()) return;

        const chainSupportedAssets = supportedAssetsPerChain[chain];
        if (!chainSupportedAssets?.length) return;

        const relatedAsset = chainSupportedAssets.find(({ symbol: supportedSymbol }) => supportedSymbol === symbol);
        if (!relatedAsset) {
          reportErrorLog(
            'accountAssetsWithBalanceSelector failed: no supported asset found for existing balance',
            { symbol },
          );
          return;
        }

        const chainRates = ratesPerChain[chain] ?? {};

        const { iconUrl: imageUrl, address } = relatedAsset;
        const balanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalanceBN, chainRates, symbol);
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalanceBN, chainRates, symbol);

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
