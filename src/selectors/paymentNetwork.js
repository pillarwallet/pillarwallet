// @flow
import { createSelector } from 'reselect';
import { ETH } from 'constants/assetsConstants';
import { getBalance } from 'utils/assets';
import type { Balances } from 'models/Asset';
import { activeAccountIdSelector, paymentNetworkBalancesSelector } from './selectors';

export const paymentNetworkAccountBalancesSelector: Balances = createSelector(
  paymentNetworkBalancesSelector,
  activeAccountIdSelector,
  (balances, activeAccountId) => {
    if (!activeAccountId) return {};
    return balances[activeAccountId] || {};
  },
);

export const availableStakeSelector: number = createSelector(
  paymentNetworkAccountBalancesSelector,
  (balances) => getBalance(balances, ETH),
);

export const paymentNetworkNonZeroBalancesSelector: Balances = createSelector(
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
