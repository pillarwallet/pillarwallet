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
import abiHelper from 'ethjs-abi';

// services
import { buildERC20ApproveTransactionData, getContract, getContractMethodAbi } from 'services/assets';
import aaveService from 'services/aave';

// utils
import { parseTokenBigNumberAmount } from 'utils/common';

// abis
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import AAVE_LENDING_POOL_CONTRACT_ABI from 'abi/aaveLendingPool.json';
import AAVE_TOKEN_ABI from 'abi/aaveToken.json';

// types
import type { TransactionPayload } from 'models/Transaction';
import type { AssetToDeposit, DepositedAsset } from 'models/Asset';

export const isAaveDepositMethod = (data: string) => data && data.includes('d2d0e066');

export const isAaveWithdrawMethod = (data: string) => data && data.includes('---'); // TODO: add withdraw method hash

export const buildAaveDepositTransactionData = (
  assetAddress: string,
  amount: number,
  decimals: number,
): string => {
  const methodAbi = getContractMethodAbi(AAVE_LENDING_POOL_CONTRACT_ABI, 'deposit');
  const contractAmount = parseTokenBigNumberAmount(amount, decimals);
  const referralCode = 0; // TODO: get Pillar's unique
  return abiHelper.encodeMethod(methodAbi, [assetAddress, contractAmount, referralCode]);
};

export const buildAaveWithdrawTransactionData = (
  amount: number,
  decimals: number,
): string => {
  const methodAbi = getContractMethodAbi(AAVE_TOKEN_ABI, 'redeem');
  const contractAmount = parseTokenBigNumberAmount(amount, decimals);
  return abiHelper.encodeMethod(methodAbi, [contractAmount]);
};

export const getAaveDepositTransactions = async (
  senderAddress: string,
  amount: number,
  asset: AssetToDeposit,
  txFeeInWei?: BigNumber,
): TransactionPayload[] => {
  const { decimals, address: assetAddress, symbol: assetSymbol } = asset;
  const depositTransactionData = await buildAaveDepositTransactionData(assetAddress, amount, decimals);
  const { address: lendingPoolContractAddress } = await aaveService.getLendingPoolContract();

  let aaveDepositTransactions = [{
    from: senderAddress,
    data: depositTransactionData,
    to: lendingPoolContractAddress,
    amount: 0,
  }];

  // allowance must be set for core contract
  const { address: lendingPoolCoreContractAddress } = await aaveService.getLendingPoolCoreContract();
  const erc20Contract = getContract(assetAddress, ERC20_CONTRACT_ABI);
  const approvedAmountBN = await erc20Contract.allowance(senderAddress, lendingPoolCoreContractAddress);
  const neededAmountBN = parseTokenBigNumberAmount(amount, decimals);

  if (neededAmountBN.gt(approvedAmountBN)) {
    const approveTransactionData = buildERC20ApproveTransactionData(lendingPoolCoreContractAddress, amount, decimals);
    // approve must be first
    aaveDepositTransactions = [
      {
        from: senderAddress,
        data: approveTransactionData,
        to: assetAddress,
        amount: 0,
      },
      ...aaveDepositTransactions,
    ];
  }

  // only in first transaction payload:
  aaveDepositTransactions[0].txFeeInWei = txFeeInWei;
  aaveDepositTransactions[0].extra = { amount, symbol: assetSymbol };

  return aaveDepositTransactions;
};

export const getAaveWithdrawTransaction = async (
  senderAddress: string,
  amount: number,
  depositedAsset: DepositedAsset,
  txFeeInWei?: BigNumber,
): TransactionPayload => {
  const { decimals, aaveTokenAddress, symbol: assetSymbol } = depositedAsset;
  const withdrawTransactionData = await buildAaveWithdrawTransactionData(amount, decimals);

  return {
    from: senderAddress,
    data: withdrawTransactionData,
    to: aaveTokenAddress,
    extra: { amount, symbol: assetSymbol },
    amount: 0,
    txFeeInWei,
  };
};
