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
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import PillarSdk from 'services/api';
import {
  refreshBitcoinBalanceAction,
  refreshBTCTransactionsAction,
} from 'actions/bitcoinActions';
import type { BitcoinReducerState } from 'reducers/bitcoinReducer';
import {
  UPDATE_BITCOIN_BALANCE,
  UPDATE_BITCOIN_TRANSACTIONS,
} from 'constants/bitcoinConstants';
import { getAddressBalance, getBTCTransactions } from 'services/bitcoin';

const pillarSdk = new PillarSdk();
const mockStore = configureMockStore([thunk.withExtraArgument(pillarSdk), ReduxAsyncQueue]);

const address = '<address>';

const initialBitcoinState: BitcoinReducerState = {
  data: {
    addresses: [
      { address, updatedAt: 0 },
    ],
    unspentTransactions: [],
    balances: {},
    transactions: [],
  },
};

const initialState = {
  bitcoin: initialBitcoinState,
  assets: { data: [], supportedAssets: [] },
};

describe('Bitcoin actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  describe('refreshBitcoinBalanceAction', () => {
    describe('for existing address', () => {
      it('updates the balance', async () => {
        await store.dispatch(refreshBitcoinBalanceAction(false));

        const actions = store.getActions();

        expect(actions.length).toEqual(1);

        const balance = await getAddressBalance(address);

        expect(actions[0]).toMatchObject({
          type: UPDATE_BITCOIN_BALANCE,
          address,
          balance,
        });
      });
    });
  });

  describe('refreshBTCTransactionsAction', () => {
    describe('for existing address', () => {
      it('updates the transactions', async () => {
        await store.dispatch(refreshBTCTransactionsAction(false));

        const actions = store.getActions();

        expect(actions.length).toEqual(3);

        const txs = await getBTCTransactions(address);

        expect(actions[2]).toMatchObject({
          type: UPDATE_BITCOIN_TRANSACTIONS,
          address,
          transactions: txs,
        });
      });
    });
  });
});
