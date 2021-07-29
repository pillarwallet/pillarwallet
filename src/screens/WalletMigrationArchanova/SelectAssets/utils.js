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
import { useRootSelector, useChainSupportedAssets, useChainRates, useFiatCurrency } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { sumBy } from 'utils/number';
import { recordValues } from 'utils/object';
import { getAssetValueInFiat } from 'utils/rates';

// Types
import type { Asset } from 'models/Asset';


export type TokenWithBalance = {|
  token: Asset,
  balance: BigNumber,
  balanceInFiat: ?number,
|};

export const useTotalMigrationValueInFiat = () => {
  const tokensToMigrate = useRootSelector((root) => root.walletMigrationArchanova.tokensToMigrate);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  return sumBy(tokensToMigrate, (tokenBalance) =>
    getAssetValueInFiat(tokenBalance.balance, tokenBalance.address, rates, currency),
  );
};

export const useTokensWithBalances = (): TokenWithBalance[] => {
  const walletBalances = useRootSelector(accountAssetsBalancesSelector)?.ethereum?.wallet;
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  return useMemo(() => {
    const balanceValues = recordValues(walletBalances);
    const tokens = mapNotNil(balanceValues, (balanceValue) => {
      const token = findAssetByAddress(supportedAssets, balanceValue.address);
      if (!token) return null;

      const balance = BigNumber(balanceValue.balance);
      const balanceInFiat = getAssetValueInFiat(balance, balanceValue.address, rates, currency);
      return { token, balance, balanceInFiat };
    });

    return orderBy(tokens, [(token) => token.balanceInFiat ?? 0, (token) => token.token.name], ['desc', 'asc']);
  }, [walletBalances, supportedAssets, rates, currency]);
};
