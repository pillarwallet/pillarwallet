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

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useChainSupportedAssets, useChainRates, useFiatCurrency } from 'selectors';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { collectiblesPerAccountSelector } from 'selectors/collectibles';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { getAssetRateInFiat, getAssetValueInFiat } from 'utils/rates';
import { recordValues } from 'utils/object';

// Types
import type { Asset } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { TokensToMigrateByAddress } from 'models/WalletMigrationArchanova';

export type TokenItem = {|
  asset: Asset,
  rateToFiat: ?number,
  balance: BigNumber,
  balanceInFiat: ?number,
|};

export const useTokenItems = (accountId: string): TokenItem[] => {
  const balancesPerAccount = useRootSelector(assetsBalancesPerAccountSelector);
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  return useMemo(() => {
    const balanceValues = recordValues(balancesPerAccount[accountId]?.ethereum?.wallet);

    return mapNotNil(balanceValues, (balanceValue) => {
      const asset = findAssetByAddress(supportedAssets, balanceValue.address);
      if (!asset) return null;

      const rateToFiat = getAssetRateInFiat(rates, balanceValue.address, currency);
      const balance = BigNumber(balanceValue.balance);
      const balanceInFiat = getAssetValueInFiat(balance, balanceValue.address, rates, currency);
      return { asset, rateToFiat, balance, balanceInFiat };
    });
  }, [accountId, balancesPerAccount, supportedAssets, rates, currency]);
};

export const useCollectibles = (accountId: string): Collectible[] => {
  const collectiblesPerAccount = useRootSelector(collectiblesPerAccountSelector);
  return collectiblesPerAccount[accountId]?.ethereum ?? [];
};

export const getTotaValueInFiat = (tokens: TokenItem[], tokensToMigrate: TokensToMigrateByAddress) => {
  let result = 0;

  tokens.forEach((tokenBalance) => {
    if (tokensToMigrate[tokenBalance.asset.address]) {
      // TODO handle partial amount
      result += tokenBalance.balanceInFiat;
    }
  });

  return result;
};
