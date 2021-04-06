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

// Selectors
import { useRootSelector } from 'selectors';
import {
  walletBalanceSelector,
  depositsBalanceSelector,
  investmentsBalanceSelector,
  liquidityPoolsBalanceSelector,
} from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { contactsCountSelector } from 'selectors/contacts';

// Utils
import { BigNumber } from 'utils/common';

// Types
import type { WalletInfo, BalanceInfo } from 'models/Home';

export const useTotalBalance = (): BalanceInfo => {
  const walletBalance = useRootSelector(walletBalanceSelector);

  return {
    balanceInFiat: walletBalance,
  };
};

export const useWalletInfo = (): WalletInfo => {
  const walletBalance = useRootSelector(walletBalanceSelector);
  const depositsBalance = useRootSelector(depositsBalanceSelector);
  const investmentsBalance = useRootSelector(investmentsBalanceSelector);
  const liquidityPoolsBalance = useRootSelector(liquidityPoolsBalanceSelector);

  const collectiblesCount = useRootSelector(accountCollectiblesSelector).length;
  const contactsCount = useRootSelector(contactsCountSelector);

  return {
    ethereum: {
      wallet: {
        balanceInFiat: walletBalance,
      },
      deposits: wrapBalance(depositsBalance),
      investments: wrapBalance(investmentsBalance),
      liquidityPools: wrapBalance(liquidityPoolsBalance),
      collectibles: collectiblesCount,
      contacts: contactsCount,
    },
  };
};

const wrapBalance = (balance: BigNumber): BalanceInfo | void => {
  if (balance.isZero()) return undefined;

  return {
    balanceInFiat: balance,
  };
};
