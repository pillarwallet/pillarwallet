// @flow
import { createSelector } from 'reselect';
import { PLR } from 'constants/assetsConstants';
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
      if (balances[account] && Object.keys(balances[account]).length) {
        const accountsBalances = Object.keys(balances[account]).map((symbol) => balances[account][symbol]);
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
