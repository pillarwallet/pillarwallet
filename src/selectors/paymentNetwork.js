// @flow
import { createSelector } from 'reselect';
import { addressesEqual, getBalance } from 'utils/assets';
import type { Balances } from 'models/Asset';
import type { Transaction } from 'models/Transaction';
import type { PaymentNetworkReducerState } from 'reducers/paymentNetworkReducer';
import { activeAccountAddressSelector, activeAccountIdSelector, paymentNetworkBalancesSelector } from './selectors';
import { accountHistorySelector } from './history';

export const paymentNetworkAccountBalancesSelector: ((state: Object) => Balances) = createSelector(
  paymentNetworkBalancesSelector,
  activeAccountIdSelector,
  (balances, activeAccountId) => {
    if (!activeAccountId) return {};
    return balances[activeAccountId] || {};
  },
);

export const availableStakeSelector =
  ({ paymentNetwork }: {paymentNetwork: PaymentNetworkReducerState}) => Number(paymentNetwork.availableStake);

export const paymentNetworkNonZeroBalancesSelector: ((state: Object) => Balances) = createSelector(
  paymentNetworkAccountBalancesSelector,
  (balances) => {
    return Object.keys(balances).reduce((nonZeroBalances, ticker) => {
      const balance = getBalance(balances, ticker);
      if (balance <= 0) return nonZeroBalances;
      return {
        ...nonZeroBalances,
        [ticker]: balances[ticker],
      };
    }, {});
  },
);

export const PPNTransactionsSelector: ((state: Object) => Transaction[]) = createSelector(
  accountHistorySelector,
  activeAccountAddressSelector,
  (history: Transaction[], activeAccountAddress: string) => {
    return history.filter(({ isPPNTransaction, to }) => !!isPPNTransaction && addressesEqual(to, activeAccountAddress));
  },
);
