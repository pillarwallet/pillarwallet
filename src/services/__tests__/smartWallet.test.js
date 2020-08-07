// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import smartWalletService from 'services/smartWallet';

import type { AccountTransaction } from 'services/smartWallet';
import type { AssetData } from 'models/Asset';
import { ETH } from 'constants/assetsConstants';

describe('Smart Wallet service', () => {
  const assetData: AssetData = {
    token: ETH,
    decimals: 18,
  };

  const accountTransaction: AccountTransaction = {
    recipient: '0x0',
    value: 1,
  };

  it('account transaction estimate fee should be equal 350000000000000', async () => {
    const { ethCost } = await smartWalletService().estimateAccountTransaction(accountTransaction, assetData);
    expect(ethCost.eq(350000000000000)).toBeTruthy();
  });
});

