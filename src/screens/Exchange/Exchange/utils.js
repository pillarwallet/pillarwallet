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

// Constants
import { ETH } from 'constants/assetsConstants';

// Utils
import { getBalance, sortAssets, getAssetOption } from 'utils/assets';

// Types
import type { Rates, Asset, AssetsBySymbol, AssetOption, Currency } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';

export const getExchangeFromAssetOptions = (
  assets: AssetsBySymbol,
  supportedAssets: Asset[],
  balances: WalletAssetsBalances,
  currency: Currency,
  rates: Rates,
): AssetOption[] => {
  const isMatching = (asset: Asset) => asset.symbol === ETH || getBalance(balances, asset.symbol) !== 0;
  const isSupported = (asset: Asset) =>
    supportedAssets.some((supportedAsset) => asset.symbol === supportedAsset.symbol);

  return sortAssets(assets)
    .filter((asset) => isMatching(asset) && isSupported(asset))
    .map((asset) => getAssetOption(asset, balances, rates, currency));
};

export const getExchangeToAssetOptions = (
  supportedAssets: Asset[],
  balances: WalletAssetsBalances,
  currency: Currency,
  rates: Rates,
): AssetOption[] => {
  if (!Array.isArray(supportedAssets)) return [];

  return supportedAssets.map((asset) => getAssetOption(asset, balances, rates, currency));
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
    fromAsset.symbol !== toAsset.symbol &&
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
