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
import { fetchTransactionsHistoryAction } from '../historyActions';
import { SET_HISTORY } from '../../constants/historyConstants';

describe('History Actions', () => {
  const transactionsHistoryStep = 10;
  const walletAddress = 'wallet-address';

  const api = {
    fetchHistory: jest.fn(),
  };
  const dispatchMock = jest.fn();
  const getState = jest.fn();

  afterEach(() => {
    dispatchMock.mockClear();
  });

  describe('fetchTransactionsHistoryAction()', () => {
    afterEach(() => {
      getState.mockRestore();
      api.fetchHistory.mockRestore();
    });

    describe('when transactions are found', () => {
      const asset = 'ASSET';
      const transactions = [{}];

      beforeEach(async () => {
        getState.mockImplementation(() => ({ history: { data: [] } }));
        api.fetchHistory.mockImplementation(() => Promise.resolve(transactions));

        await fetchTransactionsHistoryAction(walletAddress, asset)(dispatchMock, getState, api);
      });

      it('should call the api.fetchHistory function', () => {
        expect(api.fetchHistory).toBeCalledWith({
          address1: walletAddress,
          asset,
          nbTx: transactionsHistoryStep,
          fromIndex: 0,
        });
      });

      it('should call the dispatch function', () => {
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: transactions,
        });
      });
    });

    describe('when transactions are NOT found', () => {
      beforeEach(async () => {
        getState.mockImplementation(() => ({ history: { data: [] } }));
        api.fetchHistory.mockImplementation(() => Promise.resolve([]));

        await fetchTransactionsHistoryAction(walletAddress)(dispatchMock, getState, api);
      });

      it('should NOT call the dispatch function', () => {
        expect(dispatchMock).not.toBeCalled();
      });
    });
  });
});
