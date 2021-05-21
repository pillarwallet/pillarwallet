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
import { BigNumber } from 'ethers';
import { ethToWei } from '@netgum/utils';

// services
import archanovaService from 'services/archanova';

// types
import type { EthereumTransaction } from 'models/Transaction';


describe('Archanova service', () => {
  const accountTransaction: EthereumTransaction = {
    to: '0x0',
    value: BigNumber.from(ethToWei(1).toString()),
  };

  it('account transaction estimate fee should be equal 350000000000000', async () => {
    const estimate = await archanovaService.estimateAccountTransactions([accountTransaction]);
    expect(estimate?.ethCost?.eq(350000000000000)).toBeTruthy();
  });
});

