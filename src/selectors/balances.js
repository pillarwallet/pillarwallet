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
import { isEmpty } from 'lodash';

// constants
import { PLR } from 'constants/assetsConstants';

// utils
import { getTotalBalanceInFiat } from 'utils/assets';
import { BigNumber } from 'utils/common';
import { sum } from 'utils/bigNumber';
import { isEtherspotAccount } from 'utils/accounts';
import { getChainBalancesForCategory, getTotalCategoryBalance } from 'utils/balances';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { ChainBalancesPerAccount, CategoryBalancesPerChain, ChainBalances } from 'models/Home';

// selectors
import {
  balancesSelector,
  fiatCurrencySelector,
  ratesSelector,
  activeAccountIdSelector,
  activeAccountSelector,
} from './selectors';
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
      const assetInfo = memo[symbol] || { symbol, balance: '0' };
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

export const accountsTotalBalancesSelector = ({ totals }: RootReducerState): ChainBalancesPerAccount => totals.balances;

export const activeAccountTotalBalancesSelector: (RootReducerState) => CategoryBalancesPerChain = createSelector(
  activeAccountIdSelector,
  accountsTotalBalancesSelector,
  (
    activeAccountId: string,
    accountsTotals: ChainBalancesPerAccount,
  ): CategoryBalancesPerChain => accountsTotals[activeAccountId],
);

export const paymentNetworkTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  availableStakeSelector,
  ratesSelector,
  fiatCurrencySelector,
  (activeAccount: Account, ppnBalance: number, rates: Rates, currency: string) => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    const balances: Balances = { [PLR]: { balance: ppnBalance.toString(), symbol: PLR } };
    return BigNumber(getTotalBalanceInFiat(balances, rates, currency));
  },
);

export const walletTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountTotalBalancesSelector,
  paymentNetworkTotalBalanceSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    paymentNetworkBalance: BigNumber,
  ): BigNumber => {
    const balancesOnChains = (Object.values(accountTotals || {}): any);

    const walletBalancesOnChains = balancesOnChains.map((chainTotals) => {
      return chainTotals?.wallet || BigNumber(0);
    });

    return sum([...walletBalancesOnChains, paymentNetworkBalance]);
  },
);

export const depositsTotalBalanceByChainsSelector: (RootReducerState) => ChainBalances = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): ChainBalances => getChainBalancesForCategory(accountTotals, 'deposits'),
);

export const investmentsTotalBalanceByChainsSelector: (RootReducerState) => ChainBalances = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): ChainBalances => getChainBalancesForCategory(accountTotals, 'investments'),
);

export const liquidityPoolsTotalBalanceByChainsSelector: (RootReducerState) => ChainBalances = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): ChainBalances => getChainBalancesForCategory(accountTotals, 'liquidityPools'),
);

export const rewardsTotalBalanceByChainsSelector: (RootReducerState) => ChainBalances = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): ChainBalances => getChainBalancesForCategory(accountTotals, 'rewards'),
);

export const depositsTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): BigNumber => getTotalCategoryBalance(accountTotals, 'deposits'),
);

export const investmentsTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): BigNumber => getTotalCategoryBalance(accountTotals, 'investments'),
);

export const liquidityPoolsTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountTotalBalancesSelector,
  (
    accountTotals: ?CategoryBalancesPerChain,
    // eslint-disable-next-line i18next/no-literal-string
  ): BigNumber => getTotalCategoryBalance(accountTotals, 'liquidityPools'),
);

// TODO: add once ready
export const rewardsTotalBalanceSelector: (RootReducerState) => BigNumber = () => {
  return BigNumber(0);
};

export const totalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  walletTotalBalanceSelector,
  investmentsTotalBalanceSelector,
  depositsTotalBalanceSelector,
  liquidityPoolsTotalBalanceSelector,
  rewardsTotalBalanceSelector,
  (
    walletBalance: BigNumber,
    investmentsBalance: BigNumber,
    depositsBalance: BigNumber,
    liquidityPoolsBalance: BigNumber,
    rewardsBalance: BigNumber,
  ): BigNumber => sum([
    walletBalance,
    investmentsBalance,
    depositsBalance,
    liquidityPoolsBalance,
    rewardsBalance,
  ]),
);
