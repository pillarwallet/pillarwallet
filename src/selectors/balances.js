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
import isEmpty from 'lodash.isempty';

// constants
import { PLR } from 'constants/assetsConstants';

// types
import type { RootReducerState } from 'reducers/rootReducer';

// selectors
import { balancesSelector, activeAccountIdSelector } from './selectors';
import { availableStakeSelector } from './paymentNetwork';


export const accountBalancesSelector = createSelector(
  balancesSelector,
  activeAccountIdSelector,
  (balances, activeAccountId) => {
    if (!activeAccountId) return {};
    return balances[activeAccountId] || {};
  },
);

export const allBalancesSelector = createSelector(
  balancesSelector,
  availableStakeSelector,
  (balances, ppnBalance) => {
    const allBalances = Object.keys(balances).reduce((memo, account) => {
      if (!isEmpty(balances[account])) {
        const accountsBalances: Object[] = Object.values(balances[account]);
        return [...memo, ...accountsBalances];
      }
      return memo;
    }, []);

    const balancesWithPPN = [...allBalances, { symbol: PLR, balance: ppnBalance }];

    return balancesWithPPN.reduce((memo, { balance, symbol }) => {
      if (!balance || !symbol) return memo;
      const assetInfo = memo[symbol] || { symbol, balance: 0 };
      const newBalance = parseFloat(assetInfo.balance) + parseFloat(balance);
      assetInfo.balance = newBalance.toString();
      memo[symbol] = assetInfo;
      return memo;
    }, {});
  },
);

export const keyBasedWalletHasPositiveBalanceSelector = createSelector(
  ({ keyBasedAssetTransfer }: RootReducerState) => keyBasedAssetTransfer?.hasPositiveBalance,
  (hasPositiveBalance) => !!hasPositiveBalance,
);
