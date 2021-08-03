// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { orderBy } from 'lodash';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useFiatCurrency, useChainSupportedAssets, useChainRates } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { collectiblesToMigrateSelector } from 'selectors/walletMigrationArchanova';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { nativeAssetPerChain } from 'utils/chains';
import { valueForAddress } from 'utils/common';
import { recordValues } from 'utils/object';
import { getAssetValueInFiat } from 'utils/rates';
import { getTokensToMigrateAfterFee } from 'utils/walletMigrationArchanova';

// Types
import type { Asset } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Collectible } from 'models/Collectible';


export type AssetItem = TokenItem | CollectibleItem;

export type TokenItem = {|
  token: Asset,
  balance: BigNumber,
  balanceInFiat: ?number,
|};

export type CollectibleItem = {|
  collectible: Collectible,
|};

/**
 * Returns tokens & collectibles items for migration.
 */
export function useAssetItemsAfterFee(fee: ?BigNumber): AssetItem[] {
  const tokenItems = useTokenItemsAfterFee(fee);
  const collectiblesToMigrate = useRootSelector(collectiblesToMigrateSelector);

  return useMemo(() => {
    const collectibleItems = collectiblesToMigrate.map((collectible) => ({ collectible }));
    return [...tokenItems, ...collectibleItems];
  }, [tokenItems, collectiblesToMigrate]);
}

/**
 * Returns token items for migration with balance.
 *
 * Reduces max amount of ETH send if needed to accomdate fee.
 */
function useTokenItemsAfterFee(fee: ?BigNumber): TokenItem[] {
  const tokensToMigrate = useRootSelector((root) => root.walletMigrationArchanova.tokensToMigrate);
  const walletBalances = useRootSelector(accountAssetsBalancesSelector);
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  return useMemo(() => {
    const tokensToMigrateAfterFee = getTokensToMigrateAfterFee(tokensToMigrate, walletBalances?.ethereum?.wallet, fee);
    const tokenValues = recordValues(tokensToMigrateAfterFee);
    const tokens = mapNotNil(tokenValues, (tokenBalance) => {
      const token = findAssetByAddress(supportedAssets, tokenBalance.address);
      if (!token) return null;

      const balance = BigNumber(tokenBalance.balance);
      const balanceInFiat = getAssetValueInFiat(tokenBalance.balance, tokenBalance.address, rates, currency);
      return { token, balance, balanceInFiat };
    });

    return orderBy(tokens, ['balanceInFiat', 'token.name'], ['desc', 'asc']);
  }, [tokensToMigrate, walletBalances, supportedAssets, rates, currency, fee]);
}

/**
 * Checks if user has enough balance ETH balance for transaction fee. It does not need to take into account ETH
 * transfer as it will be reduced if necessary.
 */
export function hasEnoughEthBalance(walletBalances: ?WalletAssetsBalances, feeInEth: ?BigNumber) {
  // Fee is not yet known
  if (!feeInEth) return false;

  const eth = nativeAssetPerChain.ethereum;
  const ethWalletBalance = valueForAddress(walletBalances, eth.address);
  return BigNumber(ethWalletBalance?.balance ?? 0).gte(feeInEth);
}
