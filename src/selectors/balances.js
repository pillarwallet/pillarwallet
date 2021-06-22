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
import { BigNumber } from 'bignumber.js';

// Constants
import { PLR } from 'constants/assetsConstants';

// Utils
import { isEtherspotAccount } from 'utils/accounts';
import { getTotalBalanceInFiat } from 'utils/assets';

// Selectors
import {
  fiatCurrencySelector,
  ratesPerChainSelector,
  activeAccountIdSelector,
  activeAccountSelector,
} from 'selectors';

// Types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { WalletAssetsBalances, CategoryBalancesPerChain, AssetBalancesPerAccount } from 'models/Balances';
import type { RatesPerChain } from 'models/Rates';


export const assetsBalancesPerAccountSelector = ({ assetsBalances }: RootReducerState) => assetsBalances.data;

export const accountAssetsBalancesSelector: Selector<CategoryBalancesPerChain> = createSelector(
  assetsBalancesPerAccountSelector,
  activeAccountIdSelector,
  (balances: AssetBalancesPerAccount, activeAccountId: ?string): CategoryBalancesPerChain => {
    if (!activeAccountId) return {};
    return balances?.[activeAccountId] ?? {};
  },
);

export const accountEthereumWalletAssetsBalancesSelector = createSelector(
  accountAssetsBalancesSelector,
  (accountBalances): WalletAssetsBalances => accountBalances?.ethereum?.wallet || {},
);

export const keyBasedWalletHasPositiveBalanceSelector = createSelector(
  ({ keyBasedAssetTransfer }: RootReducerState) => keyBasedAssetTransfer?.hasPositiveBalance,
  (hasPositiveBalance) => !!hasPositiveBalance,
);

export const paymentNetworkTotalBalanceSelector: (RootReducerState) => BigNumber = createSelector(
  activeAccountSelector,
  ({ paymentNetwork }) => paymentNetwork.availableStake,
  ratesPerChainSelector,
  fiatCurrencySelector,
  (activeAccount: Account, ppnBalance: number, ratesPerChain: RatesPerChain, currency: string) => {
    // currently not supported by Etherspot
    if (isEtherspotAccount(activeAccount)) return BigNumber(0);

    const balances: WalletAssetsBalances = { [PLR]: { balance: ppnBalance.toString(), symbol: PLR } };
    return BigNumber(getTotalBalanceInFiat(balances, ratesPerChain.ethereum ?? {}, currency));
  },
);
