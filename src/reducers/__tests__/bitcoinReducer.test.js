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
  CREATED_BITCOIN_ADDRESS,
  SET_BITCOIN_ADDRESSES,
  UPDATE_BITCOIN_TRANSACTIONS,
} from 'constants/bitcoinConstants';
import reducer, { initialState } from 'reducers/bitcoinReducer';
import type { BitcoinReducerAction } from 'reducers/bitcoinReducer';

describe('Bitcoin reducer', () => {
  describe(CREATED_BITCOIN_ADDRESS, () => {
    const address = '<address>';

    it('adds the address to the store', () => {
      const state = reducer(initialState, {
        type: SET_BITCOIN_ADDRESSES,
        addresses: [address],
      });

      const address2 = '<address 2>';
      const createdAddress: BitcoinReducerAction = {
        type: CREATED_BITCOIN_ADDRESS,
        address: address2,
      };

      expect(reducer(state, createdAddress)).toMatchObject({
        data: {
          addresses: [
            { address, updatedAt: 0 },
            { address: address2, updatedAt: 0 },
          ],
        },
      });
    });
  });

  describe(SET_BITCOIN_ADDRESSES, () => {
    const address = '<address>';

    it('stores the address', () => {
      const setAddress: BitcoinReducerAction = {
        type: SET_BITCOIN_ADDRESSES,
        addresses: [address],
      };

      expect(reducer(initialState, setAddress)).toMatchObject({
        data: {
          addresses: [{ address, updatedAt: 0 }],
        },
      });
    });
  });

  describe(UPDATE_BITCOIN_BALANCE, () => {
    const address = '<address>';

    describe('transactions with enough confirmations', () => {
      const balance = {
        confirmed: 0,
        unconfirmed: 0,
        balance: 0,
      };
      const update: BitcoinReducerAction = {
        type: UPDATE_BITCOIN_BALANCE,
        address,
        balance,
      };

      describe('for an unexistent address', () => {
        it('does not add the transactions', () => {
          expect(reducer(initialState, update)).toMatchObject({
            data: { balances: {} },
          });
        });
      });

      describe('for an existing address', () => {
        it('adds the transactions', () => {
          const setAddress: BitcoinReducerAction = {
            type: SET_BITCOIN_ADDRESSES,
            addresses: [address],
          };
          const state = reducer(initialState, setAddress);

          expect(reducer(state, update)).toMatchObject({
            data: { balances: { [address]: balance } },
          });
        });
      });
    });
  });

  describe(UPDATE_BITCOIN_TRANSACTIONS, () => {
    const address = '<address>';
    describe('for an existing address', () => {
      it('adds the transactions', () => {
        const updateTransactions: BitcoinReducerAction = {
          type: UPDATE_BITCOIN_TRANSACTIONS,
          transactions: [],
          address,
        };

        const state = reducer(initialState, updateTransactions);

        expect(reducer(state, updateTransactions)).toMatchObject({
          data: { transactions: [] },
        });
      });
    });
  });
});
