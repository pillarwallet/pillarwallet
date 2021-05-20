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
import { PLR, USD } from 'constants/assetsConstants';
import { LIQUIDITY_POOLS } from 'constants/liquidityPoolsConstants';

// utils
import { getTotalBalanceInFiat } from 'utils/assets';
import { getStreamBalance } from 'utils/sablier';
import { BigNumber, formatUnits } from 'utils/common';
import { getPoolStats } from 'utils/liquidityPools';
import { sum } from 'utils/bigNumber';
import { isEtherspotAccount } from 'utils/accounts';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates, Balances, MixedBalance } from 'models/Asset';
import type { LendingReducerState } from 'reducers/lendingReducer';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { SablierReducerState } from 'reducers/sablierReducer';
import type { RariReducerState } from 'reducers/rariReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { Account } from 'models/Account';
import type { AccountsTotals, CategoryBalancesPerChain } from 'models/Home';

// selectors
import {
  balancesSelector,
  fiatCurrencySelector,
  ratesSelector,
  activeAccountIdSelector,
  lendingSelector,
  poolTogetherStatsSelector,
  sablierSelector,
  rariSelector,
  liquidityPoolsSelector,
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

const aaveBalanceListSelector = createSelector(
  lendingSelector,
  (lending: LendingReducerState): MixedBalance[] =>
    lending.depositedAssets.map(({ currentBalance: balance, symbol }) => ({ symbol, balance })),
);

const poolTogetherBalanceListSelector = createSelector(
  poolTogetherStatsSelector,
  (poolTogetherStats: PoolPrizeInfo): MixedBalance[] => Object.keys(poolTogetherStats)
    .map(symbol => ({
      symbol,
      balance: poolTogetherStats[symbol].userInfo?.ticketBalance ?? 0,
    })),
);

const sablierBalanceListSelector = createSelector(
  sablierSelector,
  ({ outgoingStreams }: SablierReducerState): MixedBalance[] => outgoingStreams
    .map<?MixedBalance>(stream => {
      const { symbol, decimals } = stream.token;
      if (!symbol || !decimals) return null;

      return {
        symbol,
        balance: formatUnits(getStreamBalance(stream), parseInt(decimals, 10)),
      };
    })
    .filter(Boolean),
);

const rariBalanceListSelector = createSelector(
  rariSelector,
  ({ userDepositInUSD }: RariReducerState): MixedBalance[] => Object.keys(userDepositInUSD)
    .map(pool => ({ balance: userDepositInUSD[pool], symbol: USD })),
);

const liquidityPoolsBalanceListSelector = createSelector(
  liquidityPoolsSelector,
  (liquidityPoolsState: LiquidityPoolsReducerState): MixedBalance[] => LIQUIDITY_POOLS().map(pool => {
    const {
      currentPrice,
      userLiquidityTokenBalance,
      stakedAmount,
    } = getPoolStats(pool, liquidityPoolsState) ?? {};

    if (currentPrice == null || !userLiquidityTokenBalance || !stakedAmount) return null;

    return {
      balance: (userLiquidityTokenBalance.toNumber() + stakedAmount.toNumber()) * currentPrice,
      symbol: USD,
    };
  }).filter(Boolean),
);

export const accountsTotalsSelector = ({ totals }: RootReducerState): AccountsTotals => totals.data;

export const activeAccountTotalsSelector: (RootReducerState) => CategoryBalancesPerChain = createSelector(
  activeAccountIdSelector,
  accountsTotalsSelector,
  (
    activeAccountId: string,
    accountsTotals: AccountsTotals,
  ): CategoryBalancesPerChain => accountsTotals[activeAccountId],
);

export const paymentNetworkBalanceSelector: (RootReducerState) => BigNumber = createSelector(
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

export const walletBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountTotalsSelector,
  paymentNetworkBalanceSelector,
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

export const sablierBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  sablierBalanceListSelector,
  ratesSelector,
  fiatCurrencySelector,
  (
    activeAccount: Account,
    sablierBalances: Balances,
    rates: Rates,
    fiatCurrency: string,
  ) => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    return BigNumber(getTotalBalanceInFiat(sablierBalances, rates, fiatCurrency));
  },
);

// TODO: replace from totals when added to SDK
export const depositsBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  fiatCurrencySelector,
  ratesSelector,
  aaveBalanceListSelector,
  rariBalanceListSelector,
  sablierBalanceSelector,
  (
    activeAccount: Account,
    fiatCurrency: string,
    rates: Rates,
    aaveBalancesList: Balances,
    rariBalancesList: Balances,
    sablierBalance: BigNumber,
  ): BigNumber => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    return sum([
      BigNumber(getTotalBalanceInFiat(aaveBalancesList, rates, fiatCurrency)),
      BigNumber(getTotalBalanceInFiat(rariBalancesList, rates, fiatCurrency)),
      sablierBalance,
    ]);
  },
);

// TODO: replace from totals when added to SDK
export const investmentsBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  fiatCurrencySelector,
  ratesSelector,
  poolTogetherBalanceListSelector,
  (
    activeAccount: Account,
    fiatCurrency: string,
    rates: Rates,
    poolTogetherBalances: Balances,
  ): BigNumber => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    return BigNumber(getTotalBalanceInFiat(poolTogetherBalances, rates, fiatCurrency));
  },
);

// TODO: replace from totals when added to SDK
export const liquidityPoolsBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  fiatCurrencySelector,
  ratesSelector,
  liquidityPoolsBalanceListSelector,
  (
    activeAccount: Account,
    fiatCurrency: string,
    rates: Rates,
    liquidityPoolsBalances: Balances,
  ): BigNumber => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    return BigNumber(getTotalBalanceInFiat(liquidityPoolsBalances, rates, fiatCurrency));
  },
);

export const totalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  walletBalanceSelector,
  investmentsBalanceSelector,
  depositsBalanceSelector,
  liquidityPoolsBalanceSelector,
  // TODO: include rewards
  // TODO: include collectibles pricing?
  (
    walletBalance: BigNumber,
    investmentsBalance: BigNumber,
    depositsBalance: BigNumber,
    liquidityPoolsBalance: BigNumber,
  ): BigNumber => sum([
    walletBalance,
    investmentsBalance,
    depositsBalance,
    liquidityPoolsBalance,
  ]),
);

export const rewardsBalanceSelector: (RootReducerState) => BigNumber = () => {
  return BigNumber(0);
};
