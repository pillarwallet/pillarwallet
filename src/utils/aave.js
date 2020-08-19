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
import { BigNumber as BN } from 'ethers';

// constants
import { ETH } from 'constants/assetsConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';

// services
import { buildERC20ApproveTransactionData, encodeContractMethod, getContract } from 'services/assets';
import aaveService from 'services/aave';

// utils
import { isCaseInsensitiveMatch, parseTokenBigNumberAmount } from 'utils/common';
import { addressesEqual } from 'utils/assets';

// abis
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import AAVE_LENDING_POOL_CONTRACT_ABI from 'abi/aaveLendingPool.json';
import AAVE_TOKEN_ABI from 'abi/aaveToken.json';

// config
import aaveConfig from 'configs/aaveConfig';

// types
import type { Transaction, AaveExtra } from 'models/Transaction';
import type { Asset, AssetToDeposit, DepositedAsset } from 'models/Asset';

export const AAVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const parseReserveAssetAddress = (asset: Asset) => asset.symbol === ETH ? AAVE_ETH_ADDRESS : asset.address;

export const buildAaveDepositTransactionData = (
  assetAddress: string,
  amount: number,
  decimals: number,
): string => {
  const contractAmount = parseTokenBigNumberAmount(amount, decimals);
  return encodeContractMethod(AAVE_LENDING_POOL_CONTRACT_ABI, 'deposit', [
    assetAddress,
    contractAmount,
    aaveConfig.REFERRAL_CODE,
  ]);
};

export const buildAaveWithdrawTransactionData = (
  amount: number,
  balance: number,
  decimals: number,
): string => {
  const amountBN = parseTokenBigNumberAmount(amount, decimals);
  const balanceBN = parseTokenBigNumberAmount(balance, decimals);
  const maxUint256 = BN.from(2).pow(256).sub(1); // 2**256-1 === uint256(-1) in solidity
  const withdrawAmount = balanceBN.sub(amountBN).gt(0)
    ? amountBN
    : maxUint256; // uint256(-1) is all
  return encodeContractMethod(AAVE_TOKEN_ABI, 'redeem', [withdrawAmount]);
};

export const getAaveDepositTransactions = async (
  senderAddress: string,
  amount: number,
  asset: AssetToDeposit,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const { decimals, symbol: assetSymbol } = asset;
  const amountBN = parseTokenBigNumberAmount(amount, decimals);
  const assetReserveAddress = parseReserveAssetAddress(asset);
  const depositTransactionData = await buildAaveDepositTransactionData(assetReserveAddress, amount, decimals);
  const lendingPoolContractAddress = await aaveService.getLendingPoolAddress();

  let aaveDepositTransactions = [{
    from: senderAddress,
    to: lendingPoolContractAddress,
    data: depositTransactionData,
    amount: assetSymbol === ETH ? amount : 0,
    symbol: ETH,
  }];

  if (asset.symbol !== ETH) {
    // allowance must be set for core contract
    const lendingPoolCoreContractAddress = await aaveService.getLendingPoolCoreAddress();
    const erc20Contract = getContract(assetReserveAddress, ERC20_CONTRACT_ABI);
    const approvedAmountBN = erc20Contract
      ? await erc20Contract.allowance(senderAddress, lendingPoolCoreContractAddress)
      : null;

    if (!approvedAmountBN || amountBN.gt(approvedAmountBN)) {
      const approveTransactionData = buildERC20ApproveTransactionData(lendingPoolCoreContractAddress, amount, decimals);
      // approve must be first
      aaveDepositTransactions = [
        {
          from: senderAddress,
          to: assetReserveAddress,
          data: approveTransactionData,
          amount: 0,
          symbol: ETH,
        },
        ...aaveDepositTransactions,
      ];
    }
  }

  // only in first transaction payload:
  aaveDepositTransactions[0] = {
    ...aaveDepositTransactions[0],
    txFeeInWei,
    tag: AAVE_LENDING_DEPOSIT_TRANSACTION,
    extra: { amount: amountBN.toString(), symbol: assetSymbol, decimals },
  };

  return aaveDepositTransactions;
};

export const getAaveWithdrawTransaction = async (
  senderAddress: string,
  amount: number,
  depositedAsset: DepositedAsset,
  txFeeInWei?: BigNumber,
): Promise<Object> => {
  const {
    decimals,
    aaveTokenAddress,
    symbol: assetSymbol,
    currentBalance,
  } = depositedAsset;

  const withdrawTransactionData = await buildAaveWithdrawTransactionData(
    amount,
    currentBalance,
    decimals,
  );

  const amountBN = parseTokenBigNumberAmount(amount, decimals);

  return {
    from: senderAddress,
    to: aaveTokenAddress,
    data: withdrawTransactionData,
    amount: 0,
    symbol: ETH,
    tag: AAVE_LENDING_WITHDRAW_TRANSACTION,
    extra: { amount: amountBN.toString(), symbol: assetSymbol, decimals },
    txFeeInWei,
  };
};

const buildAaveTransaction = (
  tag: string,
  transaction: Transaction,
  aaveTransactions: Object[],
) => {
  let extra: AaveExtra;
  const aaveTransaction = aaveTransactions.find(({
    id,
  }) => isCaseInsensitiveMatch(id.split(':')[0], transaction.hash));
  if (aaveTransaction) {
    extra = {
      symbol: aaveTransaction?.reserve?.symbol,
      decimals: aaveTransaction?.reserve?.decimals,
      amount: aaveTransaction?.amount,
    };
  }
  return {
    ...transaction,
    extra,
    tag,
  };
};

export const isAaveTransactionTag = (tag?: string): boolean => !!tag && [
  AAVE_LENDING_DEPOSIT_TRANSACTION,
  AAVE_LENDING_WITHDRAW_TRANSACTION,
].includes(tag);

export const mapTransactionsHistoryWithAave = async (
  accountAddress: string,
  transactionHistory: Transaction[],
): Promise<Transaction[]> => {
  const aaveLendingPoolContractAddress = await aaveService.getLendingPoolAddress();
  if (!aaveLendingPoolContractAddress) return [];

  const aaveTokenAddresses = await aaveService.getAaveTokenAddresses();
  const fetchedAaveTransactions = await aaveService.fetchAccountDepositAndWithdrawTransactions(accountAddress);
  const deposits = fetchedAaveTransactions?.deposits || [];
  const withdraws = fetchedAaveTransactions?.withdraws || [];

  return transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to, tag } = transaction;

    // do not update if already tagged
    if (isAaveTransactionTag(tag)) return transactions;

    if (addressesEqual(aaveLendingPoolContractAddress, to)) {
      transactions[transactionIndex] = buildAaveTransaction(
        AAVE_LENDING_DEPOSIT_TRANSACTION,
        transaction,
        deposits,
      );
    }

    if (aaveTokenAddresses.some((aaveTokenAddress) => addressesEqual(aaveTokenAddress, to))) {
      transactions[transactionIndex] = buildAaveTransaction(
        AAVE_LENDING_WITHDRAW_TRANSACTION,
        transaction,
        withdraws,
      );
    }

    return transactions;
  }, transactionHistory);
};
