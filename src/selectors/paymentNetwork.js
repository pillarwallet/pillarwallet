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

// constants
import { ARCHANOVA_PPN_PAYMENT_COMPLETED } from 'constants/archanovaConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// utils
import { addressesEqual, findAssetByAddress } from 'utils/assets';
import { isHiddenUnsettledTransaction } from 'utils/archanova';
import { formatUnits, addressAsKey, valueForAddress } from 'utils/common';

// models, types
import type { Asset } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { PaymentNetworkReducerState } from 'reducers/paymentNetworkReducer';
import type { WalletAssetsBalances } from 'models/Balances';

// selectors
import {
  activeAccountAddressSelector,
  activeAccountIdSelector,
  paymentNetworkBalancesSelector,
  supportedAssetsPerChainSelector,
} from './selectors';
import { archanovaAccountEthereumHistorySelector } from './history';

const ppnTrxTags = [
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
];

export const paymentNetworkAccountBalancesSelector: ((
  state: RootReducerState,
) => WalletAssetsBalances) = createSelector(
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
  archanovaAccountEthereumHistorySelector,
  activeAccountAddressSelector,
  (history: Transaction[], activeAccountAddress: string) => {
    return history.filter(({ isPPNTransaction, to }) => !!isPPNTransaction && addressesEqual(to, activeAccountAddress));
  },
);

export const PPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  archanovaAccountEthereumHistorySelector,
  (history: Transaction[]) => {
    return history.filter(({ isPPNTransaction, tag }) => !!isPPNTransaction || ppnTrxTags.includes(tag));
  },
);

export const combinedPPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  archanovaAccountEthereumHistorySelector,
  (history: Transaction[]) => {
    return history.filter(({ isPPNTransaction, tag }) => !!isPPNTransaction || ppnTrxTags.includes(tag));
  },
);

export const paymentNetworkNonZeroBalancesSelector: ((
  state: RootReducerState,
) => WalletAssetsBalances) = createSelector(
  PPNIncomingTransactionsSelector,
  archanovaAccountEthereumHistorySelector,
  supportedAssetsPerChainSelector,
  (
    PPNTransactions: Transaction[],
    history: Transaction[],
    supportedAssets: Asset[],
  ) => {
    return PPNTransactions
      .filter(({
        hash,
        stateInPPN,
      }) => stateInPPN === ARCHANOVA_PPN_PAYMENT_COMPLETED && hash && !isHiddenUnsettledTransaction(hash, history))
      .reduce((nonZeroBalances, transaction) => {
        const { value: rawValue, assetSymbol, assetAddress } = transaction;

        const value = new BigNumber(rawValue);
        const assetBalance = valueForAddress(nonZeroBalances, assetAddress) || {
          symbol: assetSymbol,
          address: assetAddress,
          rawBalance: new BigNumber(0),
        };
        const rawBalance = assetBalance.rawBalance.plus(value);

        if (rawBalance.lte(0)) return nonZeroBalances;

        const assetData = findAssetByAddress(supportedAssets, assetAddress);
        if (!assetData) return nonZeroBalances;

        const balance = formatUnits(rawBalance.toString(), assetData.decimals);

        return {
          ...nonZeroBalances,
          [addressAsKey(assetAddress)]: { ...assetBalance, balance, rawBalance },
        };
      }, {});
  },
);

export const isPPNActivatedSelector = createSelector(
  availableStakeSelector,
  PPNTransactionsSelector,
  (availableStake, ppnTransactions) => availableStake || ppnTransactions.length,
);
