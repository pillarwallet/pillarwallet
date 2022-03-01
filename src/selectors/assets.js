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
  findAssetByAddress,
  getBalanceBN,
  getBalanceInFiat,
  getFormattedBalanceInFiat,
  mapWalletAssetsBalancesIntoAssetsByAddress,
} from 'utils/assets';
import { logBreadcrumb } from 'utils/common';

// Selectors
import {
  activeAccountIdSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  ratesPerChainSelector,
  type Selector,
  fiatCurrencySelector,
  useChainSupportedAssets,
} from 'selectors';
import {
  assetsBalancesPerAccountSelector,
  accountAssetsBalancesSelector,
  accountEthereumWalletAssetsBalancesSelector,
} from 'selectors/balances';

// Types
import type { Account } from 'models/Account';
import type { AssetsPerChain, AssetByAddress, Asset } from 'models/Asset';
import type { AssetBalancesPerAccount, AccountAssetBalances, WalletAssetsBalances } from 'models/Balances';
import type { Chain, ChainRecord } from 'models/Chain';
import type { RatesPerChain, Currency } from 'models/Rates';


export const ethereumSupportedAssetsSelector: Selector<Asset[]> = createSelector(
  supportedAssetsPerChainSelector,
  (supportedAssets: AssetsPerChain): Asset[] => supportedAssets?.ethereum ?? [],
);


export const accountAssetsPerChainSelector: Selector<ChainRecord<AssetByAddress>> = createSelector(
  accountAssetsBalancesSelector,
  supportedAssetsPerChainSelector,
  (
    accountAssetsBalances: AccountAssetBalances,
    supportedAssets: AssetsPerChain,
  ): ChainRecord<AssetByAddress> => mapValues(
    accountAssetsBalances,
    ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssetsByAddress(
      accountWalletBalances,
      supportedAssets?.[chain] ?? [],
    ),
  ),
);

export const accountEthereumAssetsSelector: Selector<AssetByAddress> = createSelector(
  accountEthereumWalletAssetsBalancesSelector,
  ethereumSupportedAssetsSelector,
  (
    accountEthereumWalletBalances: WalletAssetsBalances,
    ethereumSupportedAssets: Asset[],
  ): AssetByAddress => mapWalletAssetsBalancesIntoAssetsByAddress(
    accountEthereumWalletBalances,
    ethereumSupportedAssets,
  ),
);

export const archanovaAccountEthereumAssetsSelector: Selector<AssetByAddress> = createSelector(
  assetsBalancesPerAccountSelector,
  ethereumSupportedAssetsSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    ethereumSupportedAssets: Asset[],
    accounts: Account[],
  ): AssetByAddress => {
    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) return {};

    const accountId = getAccountId(archanovaAccount);
    const accountEthereumAssets = assetsBalances?.[accountId]?.ethereum ?? {};
    const accountEthereumWalletBalances = accountEthereumAssets?.wallet ?? {};

    return mapWalletAssetsBalancesIntoAssetsByAddress(
      accountEthereumWalletBalances,
      ethereumSupportedAssets,
    );
  },
);

export const etherspotAccountAssetsSelector: Selector<ChainRecord<AssetByAddress>> = createSelector(
  assetsBalancesPerAccountSelector,
  supportedAssetsPerChainSelector,
  accountsSelector,
  (
    assetsBalances: AssetBalancesPerAccount,
    supportedAssets: AssetsPerChain,
    accounts: Account[],
  ): ChainRecord<AssetByAddress> => {
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) return { ethereum: {} };

    const accountId = getAccountId(etherspotAccount);
    const accountAssetsBalances = assetsBalances?.[accountId] ?? {};

    return mapValues(
      accountAssetsBalances,
      ({ wallet: accountWalletBalances }, chain) => mapWalletAssetsBalancesIntoAssetsByAddress(
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
  ethereumSupportedAssetsSelector,
  assetSelector,
  (
    ethereumSupportedAssets: Asset[],
    assetAddress: string,
  ): number => {
    const asset = findAssetByAddress(ethereumSupportedAssets, assetAddress);
    return asset?.decimals ?? 18;
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

      Object.keys(balances).forEach((assetAddress) => {
        const assetBalanceBN = getBalanceBN(balances, assetAddress);
        if (assetBalanceBN.isZero()) return;

        const chainSupportedAssets = supportedAssetsPerChain[chain];
        if (!chainSupportedAssets?.length) return;

        const relatedAsset = findAssetByAddress(chainSupportedAssets, assetAddress);
        if (!relatedAsset) {
          logBreadcrumb(
            'accountAssetsWithBalanceSelector', 'failed: no supported asset found for existing balance',
            { assetAddress },
          );
          return;
        }

        const chainRates = ratesPerChain[chain] ?? {};

        const { iconUrl: imageUrl, address, symbol } = relatedAsset;

        const balanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalanceBN, chainRates, address);
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalanceBN, chainRates, address);

        assetsWithBalance.push({
          ...relatedAsset,
          imageUrl,
          formattedBalanceInFiat,
          balance: {
            balance: assetBalanceBN.toNumber(),
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

export const useSupportedAsset = (chain: ?Chain, address: ?string): ?Asset => {
  const supportedAssets = useChainSupportedAssets(chain);
  return findAssetByAddress(supportedAssets, address);
};
