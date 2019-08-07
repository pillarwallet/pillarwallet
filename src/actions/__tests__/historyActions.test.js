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
import { BigNumber } from 'bignumber.js';
import { fetchTransactionsHistoryAction, restoreTransactionHistoryAction } from 'actions/historyActions';
import { SET_HISTORY, TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';
import { ETH, PLR } from 'constants/assetsConstants';
import type { Assets } from 'models/Asset';
import { buildHistoryTransaction } from 'utils/history';
import { parseEthValue } from 'services/EthplorerSdk';

const walletAddress = 'wallet-address';
const walletId = '12345';
const bobAddress = 'bob-address';

const mockWallet: Object = {
  address: walletAddress,
};

const mockAccounts: Object[] = [{
  id: walletAddress,
  isActive: true,
}];

const plrContractAddress = '0x1234567';
const mockAssets: Assets = {
  ETH: {
    symbol: ETH,
    name: 'Ethereum',
    address: '',
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
  PLR: {
    symbol: PLR,
    name: 'Pillar',
    address: plrContractAddress,
    description: '',
    iconUrl: '',
    iconMonoUrl: '',
    wallpaperUrl: '',
    decimals: 18,
  },
};

const mockDates = [];
for (let i = 1; i <= 6; ++i) {
  mockDates.push(Math.round(+new Date() / 1000) + i);
}

const mockEthTransaction = {
  asset: ETH,
  blockNumber: 111,
  contractAddress: null,
  createdAt: mockDates[2],
  from: walletAddress,
  gasPrice: 0,
  gasUsed: 0,
  hash: '0x10000',
  pillarId: '10000',
  protocol: 'Ethereum',
  status: 'confirmed',
  to: bobAddress,
  value: 10000000000000000,
};

const mockPlrTransactions = {
  asset: PLR,
  blockNumber: 112,
  contractAddress: plrContractAddress,
  createdAt: mockDates[3],
  from: walletAddress,
  gasPrice: 0,
  gasUsed: 0,
  hash: '0x20000',
  pillarId: '20000',
  protocol: 'Ethereum',
  status: 'confirmed',
  to: bobAddress,
  value: 10000000000000000,
};

const mockImportedEthTransaction = {
  timestamp: mockDates[0],
  from: bobAddress,
  to: walletAddress,
  hash: '0x30000',
  value: '1000000000000000', // 0.001
  input: '0x',
  success: true,
};

const mockImportedPlrTransaction = {
  timestamp: mockDates[4],
  transactionHash: '0x40000',
  type: 'transfer',
  value: '1408000000',
  from: walletAddress,
  to: bobAddress,
  tokenInfo: {
    address: plrContractAddress,
    name: mockAssets[PLR].name,
    decimals: mockAssets[PLR].decimals,
    symbol: mockAssets[PLR].symbol,
    totalSupply: '55191260000000',
    owner: '',
    txsCount: 111,
    transfersCount: 2222,
    lastUpdated: mockDates[5],
    issuancesCount: 0,
    holdersCount: 2135,
    price: false,
  },
};

const transformedImportedEthTransaction = buildHistoryTransaction({
  from: mockImportedEthTransaction.from,
  to: mockImportedEthTransaction.to,
  hash: mockImportedEthTransaction.hash,
  value: mockImportedEthTransaction.value,
  asset: ETH,
  createdAt: mockImportedEthTransaction.timestamp,
  status: mockImportedEthTransaction.success ? TX_CONFIRMED_STATUS : TX_FAILED_STATUS,
});

const transformedImportedPlrTransaction = buildHistoryTransaction({
  from: mockImportedPlrTransaction.from,
  to: mockImportedPlrTransaction.to,
  hash: mockImportedPlrTransaction.transactionHash,
  value: new BigNumber(mockImportedPlrTransaction.value),
  asset: PLR,
  createdAt: mockImportedPlrTransaction.timestamp,
  status: TX_CONFIRMED_STATUS,
});

describe('History Actions', () => {
  const transactionsHistoryStep = 10;

  const api = {
    fetchHistory: jest.fn(),
    fetchSupportedAssets: jest.fn(),
    importedEthTransactionHistory: jest.fn(),
    importedErc20TransactionHistory: jest.fn(),
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
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: {} },
          wallet: { data: mockWallet },
          featureFlags: { data: { SMART_WALLET_ENABLED: false } },
        }));
        api.fetchHistory.mockImplementation(() => Promise.resolve(transactions));

        await fetchTransactionsHistoryAction(asset)(dispatchMock, getState, api);
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
          payload: accountTransactions,
        });
      });
    });

    describe('when transactions are NOT found', () => {
      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: {} },
          wallet: { data: mockWallet },
          featureFlags: { data: { SMART_WALLET_ENABLED: false } },
        }));
        api.fetchHistory.mockImplementation(() => Promise.resolve([]));

        await fetchTransactionsHistoryAction()(dispatchMock, getState, api);
      });

      it('should NOT call the dispatch function', () => {
        expect(dispatchMock).not.toBeCalled();
      });
    });
  });

  describe('restoreTransactionHistoryAction()', () => {
    beforeEach(() => {
      getState.mockImplementation(() => ({
        accounts: { data: mockAccounts },
        history: { data: {} },
        wallet: { data: mockWallet },
      }));
      api.fetchSupportedAssets.mockImplementation(() => Promise.resolve(Object.values(mockAssets)));
    });

    afterEach(() => {
      getState.mockRestore();
      api.fetchSupportedAssets.mockRestore();
      api.importedEthTransactionHistory.mockRestore();
      api.importedErc20TransactionHistory.mockRestore();
    });

    describe('when user has no transaction history', () => {
      const transactions = [];
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        api.importedEthTransactionHistory.mockImplementation(() => Promise.resolve([]));
        api.importedErc20TransactionHistory.mockImplementation(() => Promise.resolve([]));
        await restoreTransactionHistoryAction(walletAddress, walletId)(dispatchMock, getState, api);
      });

      it('should call the api.fetchSupportedAssets function', () => {
        expect(api.fetchSupportedAssets).toBeCalledWith(walletId);
      });

      it('should call the api.importedErc20TransactionHistory function', () => {
        expect(api.importedErc20TransactionHistory).toBeCalledWith(walletAddress);
      });

      it('should call the api.fetchSupportedAssets function', () => {
        expect(api.importedEthTransactionHistory).toBeCalledWith(walletAddress);
      });

      it('should call the dispatch function', () => {
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: accountTransactions,
        });
      });
    });

    describe('when user already has transactions in state and gets nothing to import', () => {
      const transactions = [mockEthTransaction, mockPlrTransactions];
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: accountTransactions },
          wallet: { data: mockWallet },
        }));

        api.importedEthTransactionHistory.mockImplementation(() => Promise.resolve([]));
        api.importedErc20TransactionHistory.mockImplementation(() => Promise.resolve([]));
        await restoreTransactionHistoryAction(walletAddress, walletId)(dispatchMock, getState, api);
      });

      it('should call the dispatch function', () => {
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: accountTransactions,
        });
      });
    });

    describe('when user imports eth transaction history', () => {
      const transactions = [mockEthTransaction, mockPlrTransactions];
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: accountTransactions },
          wallet: { data: mockWallet },
        }));

        api.importedEthTransactionHistory.mockImplementation(() => Promise.resolve([mockImportedEthTransaction]));
        api.importedErc20TransactionHistory.mockImplementation(() => Promise.resolve([]));
        await restoreTransactionHistoryAction(walletAddress, walletId)(dispatchMock, getState, api);
      });

      it('should call the dispatch function', () => {
        const expectTransactions = {
          [mockAccounts[0].id]: [transformedImportedEthTransaction, ...transactions],
        };
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: expectTransactions,
        });
      });

      it('should handle the wrong eth value that api could return', () => {
        expect(parseEthValue(1e-22)).toBe('100000000000000');
      });
    });

    describe('when user imports erc20 tokens transaction history', () => {
      const transactions = [mockEthTransaction, mockPlrTransactions];
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: accountTransactions },
          wallet: { data: mockWallet },
        }));

        api.importedEthTransactionHistory.mockImplementation(() => Promise.resolve([]));
        api.importedErc20TransactionHistory.mockImplementation(() => Promise.resolve([mockImportedPlrTransaction]));
        await restoreTransactionHistoryAction(walletAddress, walletId)(dispatchMock, getState, api);
      });

      it('should call the dispatch function', () => {
        const expectTransactions = {
          [mockAccounts[0].id]: [...transactions, transformedImportedPlrTransaction],
        };
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: expectTransactions,
        });
      });
    });

    describe('when user imports eth and erc20 tokens transaction history', () => {
      const transactions = [mockEthTransaction, mockPlrTransactions];
      const accountTransactions = {
        [mockAccounts[0].id]: transactions,
      };

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accounts: { data: mockAccounts },
          history: { data: accountTransactions },
          wallet: { data: mockWallet },
        }));

        api.importedEthTransactionHistory.mockImplementation(() => Promise.resolve([mockImportedEthTransaction]));
        api.importedErc20TransactionHistory.mockImplementation(() => Promise.resolve([mockImportedPlrTransaction]));
        await restoreTransactionHistoryAction(walletAddress, walletId)(dispatchMock, getState, api);
      });

      it('should call the dispatch function', () => {
        const expectTransactions = {
          [mockAccounts[0].id]: [transformedImportedEthTransaction, ...transactions, transformedImportedPlrTransaction],
        };
        expect(dispatchMock).toBeCalledWith({
          type: SET_HISTORY,
          payload: expectTransactions,
        });
      });
    });
  });
});
