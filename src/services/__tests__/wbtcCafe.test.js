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

import { mapPendingToTransactions, getValidPendingTransactions } from 'services/wbtcCafe';
import { WBTC } from 'constants/assetsConstants';
import { WBTC_PENDING_TRANSACTION } from 'constants/exchangeConstants';
import { getEnv } from 'configs/envConfig';
import { TX_PENDING_STATUS } from 'constants/historyConstants';

const pendingTxOne = { amount: 1, dateCreated: Date.now() - 10000 }; // 10 seconds ago
const pendingTxTwo = { amount: 3, dateCreated: 4000 };
const pendingTxThree = { amount: 5, dateCreated: Date.now() - (24 * 3600000) }; // 24 hrs ago

describe('WBTC.Cafe service tests', () => {
  const to = '123';
  it('maps pending transactions', () => {
    const expected = {
      _id: '4000',
      createdAt: 4,
      hash: '',
      tag: WBTC_PENDING_TRANSACTION,
      asset: WBTC,
      to,
      from: getEnv().WBTC_FROM_ADDRESS,
      status: TX_PENDING_STATUS,
      type: 'transactionEvent',
      value: '3000000000000000000',
    };
    expect(mapPendingToTransactions([pendingTxTwo], to)).toEqual([expected]);
  });
  it('gets valid pending txs', () => {
    const valid = getValidPendingTransactions([pendingTxOne, pendingTxThree]);
    expect(valid).toEqual([pendingTxOne]);
  });
});
