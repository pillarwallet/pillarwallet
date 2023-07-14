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
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// utils
import { isArchanovaAccount, isEtherspotAccount } from 'utils/accounts';
import { getSupportedChains } from 'utils/chains';
import { isEtherspotAccountDeployed } from 'utils/etherspot';

// Types
import type { Account } from 'models/Account';
import type { Chain, ChainRecord } from 'models/Chain';
import type { Selector } from 'reducers/rootReducer';

export const supportedChainsSelector: Selector<Chain[]> = createSelector(
  activeAccountSelector,
  (activeAccount: ?Account) => getSupportedChains(activeAccount),
);

export const useSupportedChains = (): Chain[] => useRootSelector(supportedChainsSelector);

// Note: createSelector is used to memoize the result
export const isDeployedOnChainSelector: Selector<ChainRecord<boolean>> = createSelector(
  activeAccountSelector,
  isArchanovaAccountDeployedSelector,
  (account: ?Account, isArchanovaDeployed): ChainRecord<boolean> => {
    if (isEtherspotAccount(account)) {
      return {
        ethereum: isEtherspotAccountDeployed(account, CHAIN.ETHEREUM),
        binance: isEtherspotAccountDeployed(account, CHAIN.BINANCE),
        optimism: isEtherspotAccountDeployed(account, CHAIN.OPTIMISM),
        arbitrum: isEtherspotAccountDeployed(account, CHAIN.ARBITRUM),
        polygon: isEtherspotAccountDeployed(account, CHAIN.POLYGON),
        // Note: hardcoded due to business requirements
        xdai: true,
      };
    }

    if (isArchanovaAccount(account)) {
      return {
        ethereum: isArchanovaDeployed,
      };
    }

    return { ethereum: false };
  },
);
