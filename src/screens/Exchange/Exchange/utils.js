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
import { uniqBy } from 'lodash';

// Utils
import {
  getBalance,
  sortAssets,
  getAssetOption,
  addressesEqual,
} from 'utils/assets';
import { nativeAssetPerChain } from 'utils/chains';
import { reportErrorLog } from 'utils/common';

// Types
import type {
  Asset,
  AssetByAddress,
  AssetOption,
  AssetsPerChain,
} from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency, RatesPerChain } from 'models/Rates';
import type { Chain, ChainRecord } from 'models/Chain';

export const getExchangeFromAssetOptions = (
  assetsPerChain: ChainRecord<AssetByAddress>,
  supportedAssetsPerChain: AssetsPerChain,
  balancesPerChain: ChainRecord<WalletAssetsBalances>,
  currency: Currency,
  ratesPerChain: RatesPerChain,
  chain: Chain,
): AssetOption[] => {
  const chainNativeAssetAddress = nativeAssetPerChain[chain].address;
  const chainAssets = assetsPerChain?.[chain] ?? {};
  const chainSupportedAssets = uniqBy(supportedAssetsPerChain?.[chain] ?? [], 'address');
  const chainRates = ratesPerChain?.[chain] ?? {};
  const chainBalances = balancesPerChain?.[chain] ?? {};

  const isMatching = (
    asset: Asset,
  ) => asset.address === chainNativeAssetAddress || getBalance(chainBalances, asset.address) !== 0;
  const isSupported = (
    asset: Asset,
  ) => chainSupportedAssets.some((supportedAsset) => addressesEqual(asset.address, supportedAsset.address));

  return sortAssets(chainAssets)
    .filter((asset) => {
      if (!asset) {
        // debug and safe return for Sentry issue #2605322771
        reportErrorLog('getExchangeFromAssetOptions failed: no asset', { asset, chainAssets });
        return false;
      }
      return isMatching(asset) && isSupported(asset);
    })
    .map((asset) => getAssetOption(asset, chainBalances, chainRates, currency, chain));
};

export const getExchangeToAssetOptions = (
  supportedAssetsPerChain: AssetsPerChain,
  balancesPerChain: ChainRecord<WalletAssetsBalances>,
  currency: Currency,
  ratesPerChain: RatesPerChain,
  chain: Chain,
): AssetOption[] => {
  const chainSupportedAssets = uniqBy(supportedAssetsPerChain?.[chain] ?? [], 'address');
  const chainRates = ratesPerChain?.[chain] ?? {};
  const chainBalances = balancesPerChain?.[chain] ?? {};

  return chainSupportedAssets.map((asset) => getAssetOption(asset, chainBalances, chainRates, currency, chain));
};

export const shouldTriggerSearch = (
  fromAsset: ?AssetOption,
  toAsset: ?AssetOption,
  fromAmount: string,
): boolean %checks => {
  return (
    !!fromAsset &&
    !!toAsset &&
    !!+fromAmount &&
    fromAmount[fromAmount.length - 1] !== '.' &&
    !addressesEqual(fromAsset.address, toAsset.address) &&
    fromAsset.chain === toAsset.chain &&
    isEnoughAssetBalance(fromAsset.assetBalance, fromAmount)
  );
};

const isEnoughAssetBalance = (assetBalance: ?string, amount: string): boolean => {
  try {
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(assetBalance ?? 0);
    // assetBalance is fixed to 6 digits and amount is not, so usually amount will be technically higher
    // fix and round both down to 6 to get meaningful info
    const amountFixed = amountBN.toFixed(6, 1);
    const balanceFixed = balanceBN.toFixed(6, 1);
    return new BigNumber(balanceFixed).isGreaterThanOrEqualTo(new BigNumber(amountFixed));
  } catch {
    return false;
  }
};
