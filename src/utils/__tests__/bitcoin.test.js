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
import { unspentAmount, btcToSatoshis } from 'utils/bitcoin';
import type { BitcoinUtxo } from 'models/Bitcoin';

const buildUtxo = (values: $Shape<BitcoinUtxo>): BitcoinUtxo => {
  return {
    address: '<address>',
    txid: '<txid>',
    vout: 0,
    scriptPubKey: '',
    amount: 1.0,
    satoshis: btcToSatoshis(1.0),
    height: 0,
    confirmations: 10,
    ...values,
  };
};

describe('Bitcoin utils', () => {
  describe('unspentAmount', () => {
    it('returns the total in satoshis', () => {
      const transactions: BitcoinUtxo[] = [
        buildUtxo({ satoshis: 1000 }),
        buildUtxo({ satoshis: 500 }),
      ];

      const balance = unspentAmount(transactions);

      expect(balance).toEqual(1500);
    });

    describe('with unconfirmed transactions', () => {
      it('sums only confirmed transactions', () => {
        const transactions: BitcoinUtxo[] = [
          buildUtxo({ satoshis: 1000 }),
          buildUtxo({ satoshis: 500, confirmations: 0 }),
        ];

        const balance = unspentAmount(transactions);

        expect(balance).toEqual(1000);
      });
    });
  });
});
