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
import { mapValues } from 'lodash';

// Selectors
import { useRootSelector, supportedAssetsSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountWalletBalancePerChainSelector } from 'selectors/totalBalances';

// Utils
import { mapNotNil } from 'utils/array';
import { findSupportedAssetBySymbol } from 'utils/assets';
import { getChainWalletAssetsBalances } from 'utils/balances';
import { sumRecord } from 'utils/bigNumber';
import { getImageUrl } from 'utils/images';
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

export type WalletItem = {|
  key: string,
  title: string,
  iconUrl: ?string,
  value: BigNumber,
  symbol: string,
  change?: BigNumber,
|};

export const useWalletAssetsPerChain = (): ChainRecord<WalletItem[]> => {
  const walletAssetsPerChain = getChainWalletAssetsBalances(useRootSelector(accountAssetsBalancesSelector));
  const supportedAssets = useRootSelector(supportedAssetsSelector);

  return mapValues(walletAssetsPerChain, (balancesRecord: WalletAssetsBalances, chain: Chain) => {
    const balanceList = recordValues(balancesRecord);
    return mapNotNil(balanceList, (balance) => buildWalletItem(balance, chain, supportedAssets));
  });
};

const buildWalletItem = ({ symbol, balance }: WalletAssetBalance, chain: Chain, supportedAssets: Asset[]) => {
  const asset = findSupportedAssetBySymbol(supportedAssets, symbol);
  if (!asset) return null;

  return {
    key: `${chain}-${symbol}`,
    title: asset.name,
    iconUrl: getImageUrl(asset.iconUrl, 3),
    symbol: asset.symbol,
    value: BigNumber(balance || 0),
  };
};
