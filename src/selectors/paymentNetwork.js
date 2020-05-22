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
import BigNumber from 'bignumber.js';

// constants
import { PAYMENT_COMPLETED } from 'constants/smartWalletConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// utils
import { addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';
import { isHiddenUnsettledTransaction } from 'utils/smartWallet';
import { formatUnits } from 'utils/common';

// models, types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { PaymentNetworkReducerState } from 'reducers/paymentNetworkReducer';

// selectors
import {
  activeAccountAddressSelector,
  activeAccountIdSelector,
  paymentNetworkBalancesSelector,
  supportedAssetsSelector,
} from './selectors';
import { accountHistorySelector } from './history';
import { accountAssetsSelector } from './assets';

export const paymentNetworkAccountBalancesSelector: ((state: RootReducerState) => Balances) = createSelector(
  paymentNetworkBalancesSelector,
  activeAccountIdSelector,
  (balances, activeAccountId) => {
    if (!activeAccountId) return {};
    return balances[activeAccountId] || {};
  },
);

export const availableStakeSelector =
  ({ paymentNetwork }: {paymentNetwork: PaymentNetworkReducerState}) => Number(paymentNetwork.availableStake);

export const PPNIncomingTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  accountHistorySelector,
  activeAccountAddressSelector,
  (history: Transaction[], activeAccountAddress: string) => {
    return history.filter(({ isPPNTransaction, to }) => !!isPPNTransaction && addressesEqual(to, activeAccountAddress));
  },
);

export const PPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  accountHistorySelector,
  (history: Transaction[]) => {
    const ppnTags = [
      PAYMENT_NETWORK_ACCOUNT_TOPUP,
      PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
      PAYMENT_NETWORK_TX_SETTLEMENT,
    ];
    return history.filter(({ isPPNTransaction, tag }) => !!isPPNTransaction || ppnTags.includes(tag));
  },
);

export const paymentNetworkNonZeroBalancesSelector: ((state: RootReducerState) => Balances) = createSelector(
  PPNIncomingTransactionsSelector,
  accountHistorySelector,
  supportedAssetsSelector,
  accountAssetsSelector,
  (PPNTransactions: Transaction[], history: Transaction[], supportedAssets: Asset[], accountAssets: Assets) => {
    return PPNTransactions
      .filter(
        ({ hash, stateInPPN }) => stateInPPN === PAYMENT_COMPLETED && !isHiddenUnsettledTransaction(hash, history),
      )
      .reduce((nonZeroBalances, transaction) => {
        const { value: rawValue, asset: symbol } = transaction;

        const value = new BigNumber(rawValue);
        const assetBalance = nonZeroBalances[symbol] || { symbol, rawBalance: new BigNumber(0) };
        const rawBalance = assetBalance.rawBalance.plus(value);

        if (rawBalance.lte(0)) return nonZeroBalances;

        const assetData = getAssetData(getAssetsAsList(accountAssets), supportedAssets, symbol);
        if (isEmpty(assetData)) return nonZeroBalances;

        const balance = formatUnits(rawBalance.toString(), assetData.decimals);

        return {
          ...nonZeroBalances,
          [symbol]: { ...assetBalance, balance, rawBalance },
        };
      }, {});
  },
);

export const isPPNActivatedSelector = createSelector(
  availableStakeSelector,
  PPNTransactionsSelector,
  (availableStake, ppnTransactions) => availableStake || ppnTransactions.length,
);
