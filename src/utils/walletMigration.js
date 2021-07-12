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

import { BigNumber } from 'bignumber.js';

// Types
import type { WalletAssetsBalances, WalletAssetBalance } from 'models/Balances';

export function hasNonNegligileWalletBalances(balances: ?WalletAssetsBalances) {
  if (!balances) return false;

  return Object.keys(balances).some((symbol) => isNonNegligibleBalance(balances[symbol]));
}

export function isNonNegligibleBalance(balance: WalletAssetBalance) {
  // TODO: improve this check
  return BigNumber(balance.balance).gte(1e-12);
}
