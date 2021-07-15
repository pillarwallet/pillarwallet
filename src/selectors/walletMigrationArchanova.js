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

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useChainRates, useFiatCurrency } from 'selectors';
import { archanovaAccountIdSelector } from 'selectors/accounts';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';

// Utils
import { recordValues } from 'utils/object';
import { getAssetValueInFiat } from 'utils/rates';
import { hasNonNegligileWalletBalances } from 'utils/walletMigrationArchanova';

// Types
import type { Selector } from 'reducers/rootReducer';
import type { AssetBalancesPerAccount } from 'models/Balances';

// Checks for non-negligible balances
export const showWalletMigrationSelector: Selector<boolean> = createSelector(
  archanovaAccountIdSelector,
  assetsBalancesPerAccountSelector,
  (accountId: ?string, balancesPerAccount: AssetBalancesPerAccount): boolean => {
    if (!accountId) return false;

    const ethereumWalletBalancs = balancesPerAccount[accountId]?.ethereum?.wallet;
    return hasNonNegligileWalletBalances(ethereumWalletBalancs);
  },
);

export const useTotalMigrationValueInFiat = () => {
  const tokensToMigrate = useRootSelector(root => root.walletMigrationArchanova.tokensToMigrate);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  let result = 0;
  recordValues(tokensToMigrate).forEach((tokenBalance) => {
    result += getAssetValueInFiat(tokenBalance.balance, tokenBalance.address, rates, currency);
  });

  return result;
};
