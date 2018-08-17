// @flow
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
      const transactions = [{}, {}];

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
          payload: { transactions, asset },
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
