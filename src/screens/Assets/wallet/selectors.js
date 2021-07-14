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

import { BigNumber } from 'bignumber.js';

// Selectors
import { useRootSelector, supportedAssetsPerChainSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountWalletBalancePerChainSelector } from 'selectors/totalBalances';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { getChainWalletAssetsBalances } from 'utils/balances';
import { mapChainRecordValues } from 'utils/chains';
import { sumRecord } from 'utils/bigNumber';
import { recordValues } from 'utils/object';

// Types
import type { Asset } from 'models/Asset';
import type { WalletAssetBalance, WalletAssetsBalances } from 'models/Balances';
import type { Chain, ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';

export function useWalletTotalBalance(): FiatBalance {
  const value = sumRecord(useWalletBalancePerChain());
  return { value };
}

export function useWalletBalancePerChain(): ChainRecord<BigNumber> {
  return useRootSelector(accountWalletBalancePerChainSelector);
}

/**
 * TODO: get assetSymbol from matching asset once assets can be queried by assetAddress as key
 * instead of performing expensive search on whole assets array
 */
export type WalletItem = {|
  key: string,
  title: string,
  iconUrl: ?string,
  value: BigNumber,
  assetSymbol: string,
  assetAddress: string,
  change?: BigNumber,
  chain: Chain,
|};

export const useWalletAssetsPerChain = (): ChainRecord<WalletItem[]> => {
  const walletAssetsPerChain = getChainWalletAssetsBalances(useRootSelector(accountAssetsBalancesSelector));
  const supportedAssets = useRootSelector(supportedAssetsPerChainSelector);

  return mapChainRecordValues(walletAssetsPerChain, (balancesRecord: WalletAssetsBalances, chain: Chain) => {
    const balanceList = recordValues(balancesRecord);
    const chainSupportedAssets = supportedAssets[chain] ?? [];
    return mapNotNil(balanceList, (balance) => buildWalletItem(balance, chain, chainSupportedAssets));
  });
};

const buildWalletItem = (
  { address: assetAddress, balance }: WalletAssetBalance,
  chain: Chain,
  supportedAssets: Asset[],
) => {
  const asset = findAssetByAddress(supportedAssets, assetAddress);
  if (!asset) return null;

  const { name: title, iconUrl, symbol: assetSymbol } = asset;

  return {
    key: `${chain}-${assetAddress}`,
    title,
    iconUrl,
    assetSymbol,
    assetAddress,
    value: BigNumber(balance || 0),
    chain,
  };
};
