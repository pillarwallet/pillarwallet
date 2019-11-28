// @flow

import { createSelector } from 'reselect';
import isEmpty from 'lodash.isempty';
import BigNumber from 'bignumber.js';

// constants
import { PAYMENT_COMPLETED } from 'constants/smartWalletConstants';

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

export const PPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  accountHistorySelector,
  activeAccountAddressSelector,
  (history: Transaction[], activeAccountAddress: string) => {
    return history.filter(({ isPPNTransaction, to }) => !!isPPNTransaction && addressesEqual(to, activeAccountAddress));
  },
);

export const paymentNetworkNonZeroBalancesSelector: ((state: RootReducerState) => Balances) = createSelector(
  PPNTransactionsSelector,
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

        if (!rawBalance.gt(0)) return nonZeroBalances;

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
