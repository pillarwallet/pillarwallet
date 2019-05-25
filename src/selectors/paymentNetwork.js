// @flow
import { createSelector } from 'reselect';
import { ETH } from 'constants/assetsConstants';
import { getBalance } from 'utils/assets';
import type { Balances } from 'models/Asset';
import { activeAccountIdSelector, paymentNetworkAccountsSelector } from './selectors';

export const paymentNetworkBalancesSelector: Balances = createSelector(
  paymentNetworkAccountsSelector,
  activeAccountIdSelector,
  (accounts, activeAccountId) => {
    if (!activeAccountId) return {};
    return accounts[activeAccountId] || {};
  },
);

export const availableStakeSelector: number = createSelector(
  paymentNetworkBalancesSelector,
  (balances) => getBalance(balances, ETH),
);

export const paymentNetworkNonZeroBalancesSelector: Balances = createSelector(
  paymentNetworkBalancesSelector,
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
