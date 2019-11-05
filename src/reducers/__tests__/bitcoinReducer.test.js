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
import {
  UPDATE_BITCOIN_BALANCE,
  SET_BITCOIN_ADDRESSES,
} from 'constants/bitcoinConstants';
import reducer from 'reducers/bitcoinReducer';
import type { BitcoinReducerState, BitcoinReducerAction } from 'reducers/bitcoinReducer';

describe('Bitcoin reducer', () => {
  describe(SET_BITCOIN_ADDRESSES, () => {
    const address = '<address>';

    it('stores the address', () => {
      const state: BitcoinReducerState = {
        data: {
          addresses: [],
          unspentTransactions: [],
        },
      };

      const setAddress: BitcoinReducerAction = {
        type: SET_BITCOIN_ADDRESSES,
        payload: {
          addresses: [address],
        },
      };

      expect(reducer(state, setAddress)).toMatchObject({
        data: {
          addresses: [{ address, updatedAt: 0 }],
        },
      });
    });
  });

  describe(UPDATE_BITCOIN_BALANCE, () => {
    const address = '<address>';

    describe('transactions with enough confirmations', () => {
      const utxo = {
        address,
        txid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
        vout: 0,
        scriptPubKey: '76a9146d622b371423d2e450c19d98059867d71e6aa87c88ac',
        amount: 1.3,
        satoshis: 130000000,
        height: 1180957,
        confirmations: 10,
      };
      const update: BitcoinReducerAction = {
        type: UPDATE_BITCOIN_BALANCE,
        payload: {
          address,
          unspentTransactions: [utxo],
        },
      };

      describe('for an unexistent address', () => {
        const state: BitcoinReducerState = {
          data: {
            addresses: [],
            unspentTransactions: [],
          },
        };

        it('does not add the transactions', () => {
          expect(reducer(state, update)).toMatchObject({
            data: { unspentTransactions: [] },
          });
        });
      });

      describe('for an existing address', () => {
        const state: BitcoinReducerState = {
          data: {
            addresses: [{ address, updatedAt: 0 }],
            unspentTransactions: [],
          },
        };

        it('adds the transactions', () => {
          expect(reducer(state, update)).toMatchObject({
            data: { unspentTransactions: [utxo] },
          });
        });
      });
    });
  });
});
