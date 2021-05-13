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

// selectors
import { useRootSelector, useActiveAccount } from 'selectors';
import { isArchanovaWalletActivatedSelector } from 'selectors/archanova';

// utils
import { isEtherspotAccount } from 'utils/accounts';

// constants
import { CHAIN } from 'models/Chain';

// types
import type { Chain } from 'models/Chain';

export const useSupportedChains = (): Chain[] => {
  const activeAccount = useActiveAccount();

  if (isEtherspotAccount(activeAccount)) {
    return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM];
  }

  return [CHAIN.ETHEREUM];
};

export const useIsActiveAccountDeployedOnEthereum = () => {
  // TODO: check etherspot for being deployed
  const activeAccount = useActiveAccount();
  const isArchanovaWalletActivated = useRootSelector(isArchanovaWalletActivatedSelector);
  return isEtherspotAccount(activeAccount) || isArchanovaWalletActivated;
};
