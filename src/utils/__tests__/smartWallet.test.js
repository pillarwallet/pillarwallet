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
import { userHasSmartWallet, addAllowanceTransaction, getTxFeeAndTransactionPayload } from 'utils/smartWallet';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import * as assetServices from 'services/assets';
import * as smartWalletService from 'services/smartWallet';
import type { Accounts } from 'models/Account';


const token = {
  address: '0x2222',
  decimals: 18,
  description: '',
  iconMonoUrl: '',
  iconUrl: '',
  name: '',
  symbol: '',
  wallpaperUrl: '',
};

describe('Smartwallet utils', () => {
  describe('userHasSmartWallet', () => {
    it('returns false when user does not have a smart wallet', () => {
      const accounts: Accounts = [
        {
          id: '',
          type: ACCOUNT_TYPES.KEY_BASED,
          walletId: '',
          isActive: true,
        },
      ];

      expect(userHasSmartWallet(accounts)).toBe(false);
    });

    it('returns true when user has a smart wallet', () => {
      const accounts: Accounts = [
        {
          id: '',
          type: ACCOUNT_TYPES.KEY_BASED,
          walletId: '',
          isActive: true,
        },
        {
          id: '',
          type: ACCOUNT_TYPES.SMART_WALLET,
          walletId: '',
          isActive: false,
        },
      ];

      expect(userHasSmartWallet(accounts)).toBe(true);
    });
  });

  describe('getTxFeeAndTransactionPayload', () => {
    it('returns a proper tx fee and transaction payload', async () => {
      const transaction = {
        from: '0x0000',
        to: '0x1111',
      };

      const txCost = new BigNumber(100);

      (smartWalletService: any).default.estimateAccountTransaction = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ethCost: txCost,
        }),
      );

      const result = await getTxFeeAndTransactionPayload(transaction, false);
      expect(result).toMatchObject({
        gasToken: undefined,
        transactionPayload: {
          from: '0x0000',
          to: '0x1111',
          txFeeInWei: txCost,
        },
        txFeeInWei: txCost,
      });
    });
    it('returns a proper tx fee and transaction payload when using gas token', async () => {
      const transaction = {
        from: '0x0000',
        to: '0x1111',
      };

      const txCost = new BigNumber(100);
      const txTokenCost = new BigNumber(200);
      const gasToken = {
        symbol: 'TEST',
      };

      (smartWalletService: any).default.estimateAccountTransaction = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ethCost: txCost,
          gasTokenCost: txTokenCost,
          gasToken,
        }),
      );

      const result = await getTxFeeAndTransactionPayload(transaction, true);
      expect(result).toEqual({
        gasToken,
        transactionPayload: {
          from: '0x0000',
          to: '0x1111',
          txFeeInWei: txTokenCost,
          gasToken,
        },
        txFeeInWei: txTokenCost,
      });
    });
    it('returns null on error', async () => {
      const transaction = {
        from: '0x0000',
        to: '0x1111',
      };

      (smartWalletService: any).default.estimateAccountTransaction = jest.fn().mockImplementation(() =>
        Promise.reject(new Error('test')),
      );

      const result = await getTxFeeAndTransactionPayload(transaction, false);
      expect(result).toEqual(null);
    });
  });

  describe('addAllowanceTransaction', () => {
    it('adds an allowance tx if necessary', async () => {
      const fromAddress = '0x0000';
      const toAddress = '0x1111';

      const transaction = {
        from: fromAddress,
        to: toAddress,
      };

      (assetServices: any).getContract = jest.fn().mockImplementation(() => ({
        allowance: () => 0,
      }));
      (assetServices: any).buildERC20ApproveTransactionData =
        jest.fn().mockImplementation(() => 'approve transaction data');

      const txWithAllowance = await addAllowanceTransaction(
        transaction, fromAddress, toAddress, token, new BigNumber(1000),
      );
      expect(txWithAllowance).toEqual({
        from: fromAddress,
        to: token.address,
        data: 'approve transaction data',
        amount: 0,
        symbol: 'ETH',
        sequentialSmartWalletTransactions: [transaction],
      });
    });
    it('doesn\'t add an allowance tx if not necessary', async () => {
      const fromAddress = '0x0000';
      const toAddress = '0x1111';

      const transaction = {
        from: fromAddress,
        to: toAddress,
      };

      (assetServices: any).getContract = jest.fn().mockImplementation(() => ({
        allowance: () => 10000,
      }));
      (assetServices: any).buildERC20ApproveTransactionData =
        jest.fn().mockImplementation(() => 'approve transaction data');

      const txWithAllowance = await addAllowanceTransaction(
        transaction, fromAddress, toAddress, token, new BigNumber(1000),
      );
      expect(txWithAllowance).toEqual(transaction);
    });
  });
});
