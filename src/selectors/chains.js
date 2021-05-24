// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { activeAccountSelector, useRootSelector } from 'selectors';
import { isArchanovaWalletActivatedSelector } from 'selectors/archanova';

// utils
import { isArchanovaAccount, isEtherspotAccount } from 'utils/accounts';
import { isEtherspotAccountDeployed } from 'utils/etherspot';

// Types
import type { Account } from 'models/Account';
import type { Chain, ChainRecord } from 'models/Chain';
import type { RootReducerState, Selector } from 'reducers/rootReducer';

export const supportedChainsSelector = (root: RootReducerState): Chain[] => {
  const activeAccount = activeAccountSelector(root);

  if (isEtherspotAccount(activeAccount)) {
    return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM];
  }

  return [CHAIN.ETHEREUM];
};

export const useSupportedChains = (): Chain[] => useRootSelector(supportedChainsSelector);

const isActiveAccountDeployedOnEthereumSelector = (root: RootReducerState): boolean => {
  const account = activeAccountSelector(root);
  if (isEtherspotAccount(account)) return isEtherspotAccountDeployed(account, CHAIN.ETHEREUM);
  if (isArchanovaAccount(account)) return isArchanovaWalletActivatedSelector(root);
  return false;
};

// Note: createSelector is used to memoize the result
export const isDeployedOnChainSelector: Selector<ChainRecord<boolean>> = createSelector(
  activeAccountSelector,
  isActiveAccountDeployedOnEthereumSelector,
  (account: ?Account, isDeployedOnEthereum) => {
    if (isEtherspotAccount(account)) {
      return {
        ethereum: isEtherspotAccountDeployed(account, CHAIN.ETHEREUM),
        polygon: isEtherspotAccountDeployed(account, CHAIN.POLYGON),
        binance: isEtherspotAccountDeployed(account, CHAIN.BINANCE),
        xdai: isEtherspotAccountDeployed(account, CHAIN.XDAI),
      };
    }

    return {
      ethereum: isDeployedOnEthereum,
    };
  },
);
