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
import { Contract, utils } from 'ethers';
import {
  NETWORK_PROVIDER,
  POOL_DAI_CONTRACT_ADDRESS,
  POOL_USDC_CONTRACT_ADDRESS,
  DAI_ADDRESS,
  USDC_ADDRESS,
} from 'react-native-dotenv';
import { utils as ptUtils } from 'pooltogetherjs';
import abi from 'ethjs-abi';
import { BigNumber } from 'bignumber.js';
import * as Sentry from '@sentry/react-native';

import { DAI } from 'constants/assetsConstants';
import {
  POOLTOGETHER_WITHDRAW_TRANSACTION,
  POOLTOGETHER_DEPOSIT_TRANSACTION,
} from 'constants/poolTogetherConstants';

import type { PoolInfo } from 'models/PoolTogether';

import { getEthereumProvider, formatMoney, reportLog } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

import POOL_DAI_ABI from 'abi/poolDAI.json';
import POOL_USDC_ABI from 'abi/poolUSDC.json';
import DAI_ABI from 'abi/DAI.json';
import USDC_ABI from 'abi/USDC.json';

import smartWalletService from './smartWallet';

const POOL_TOGETHER_NETWORK = NETWORK_PROVIDER === 'ropsten' ? 'kovan' : NETWORK_PROVIDER;

const getPoolTogetherTokenContract = (symbol: string) => {
  const poolContractAddress = symbol === DAI ? POOL_DAI_CONTRACT_ADDRESS : POOL_USDC_CONTRACT_ADDRESS;
  const poolAbi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const unitType = symbol === DAI ? 18 : 6; // DAI 18 decimals, USDC 6 decimals
  const provider = getEthereumProvider(POOL_TOGETHER_NETWORK);
  const poolContract = new Contract(poolContractAddress, poolAbi, provider);

  const tokenContractAddress = symbol === DAI ? DAI_ADDRESS : USDC_ADDRESS;
  const tokenABI = symbol === DAI ? DAI_ABI : USDC_ABI;
  const tokenContract = new Contract(tokenContractAddress, tokenABI, provider);


  return {
    poolContract,
    poolContractAddress,
    poolAbi,
    unitType,
    provider,
    tokenContractAddress,
    tokenABI,
    tokenContract,
  };
};

export async function getPoolTogetherInfo(symbol: string, address: string): Promise<?PoolInfo> {
  try {
    const {
      poolContract: contract,
      unitType,
      provider,
      poolContractAddress: contractAddress,
    } = getPoolTogetherTokenContract(symbol);
    const accountedBalance = await contract.accountedBalance();
    const balanceCallData = contract.interface.functions.balance.encode([]);
    const result = await provider.call({ to: contract.address, data: balanceCallData });
    const balance = contract.interface.functions.balance.decode(result);
    const balanceTakenAt = new Date();
    const currentOpenDrawId = await contract.currentOpenDrawId();
    const currentDraw = await contract.getDraw(currentOpenDrawId);
    const committedSupply = await contract.committedSupply();
    const openSupply = await contract.openSupply();

    let userInfo;
    try {
      const totalBalance = await contract.totalBalanceOf(address); // open, committed, fees, sponsorship balance
      if (!totalBalance.eq(0)) {
        const openBalance = await contract.openBalanceOf(address); // balance in the open Draw
        const userCurrentPoolBalance = await contract.balanceOf(address); // balance in the current committed Draw
        const ticketBalance = openBalance.add(userCurrentPoolBalance); // this is the current ticket balance in total
        userInfo = {
          openBalance: formatMoney(utils.formatUnits(openBalance.toString(), unitType)),
          totalBalance: formatMoney(utils.formatUnits(totalBalance.toString(), unitType)),
          userCurrentPoolBalance: formatMoney(utils.formatUnits(userCurrentPoolBalance.toString(), unitType)),
          ticketBalance: formatMoney(utils.formatUnits(ticketBalance.toString(), unitType)),
        };
      }
    } catch (e) {
      reportLog('Error checking PoolTogether User Info', {
        address,
        contractAddress,
        symbol,
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    }

    const supplyRatePerBlock = await contract.supplyRatePerBlock();

    let currentPrize = ptUtils.toBN(0);
    let prizeEstimate = ptUtils.toBN(0);
    let drawDate = 0;
    let remainingTimeMs = 0;
    let totalPoolTicketsCount = 0;
    if (balance && openSupply && committedSupply && accountedBalance && currentDraw && supplyRatePerBlock) {
      const totalSupply = openSupply.add(committedSupply);
      totalPoolTicketsCount = parseInt(utils.formatUnits(totalSupply.toString(), unitType), 10);
      const { feeFraction, openedBlock } = currentDraw;

      const prizeIntervalMs = symbol === DAI ? 604800000 : 86400000; // DAI weekly, USDC daily
      const { timestamp: blockTimestamp } = await provider.getBlock(openedBlock.toNumber());
      drawDate = (blockTimestamp.toString() * 1000) + prizeIntervalMs; // adds 14 days to a timestamp in miliseconds

      remainingTimeMs = drawDate - balanceTakenAt.getTime();
      remainingTimeMs = remainingTimeMs < 0 ? 0 : remainingTimeMs;
      const remainingTimeS = remainingTimeMs > 0 ? remainingTimeMs / 1000 : prizeIntervalMs / 1000;
      const remainingBlocks = remainingTimeS / 15.0; // about 15 second block periods
      const blockFixedPoint18 = utils.parseEther(remainingBlocks.toString());

      const prizeSupplyRate = ptUtils.calculatePrizeSupplyRate(
        supplyRatePerBlock,
        feeFraction,
      );

      currentPrize = ptUtils.calculatePrize(
        balance,
        accountedBalance,
        feeFraction,
      );
      prizeEstimate = ptUtils.calculatePrizeEstimate(
        balance,
        currentPrize,
        blockFixedPoint18,
        prizeSupplyRate,
      );
    }

    return {
      currentPrize: formatMoney(utils.formatUnits(currentPrize.toString(), unitType)),
      prizeEstimate: formatMoney(utils.formatUnits(prizeEstimate.toString(), unitType)),
      drawDate,
      remainingTimeMs,
      totalPoolTicketsCount,
      userInfo,
    };
  } catch (e1) {
    reportLog('Error fetching PoolTogether Info', {
      message: e1.message,
    }, Sentry.Severity.Error);
    return null;
  }
}

export const getSmartWalletTxFee = async (transaction: Object, useGasToken: boolean): Promise<Object> => {
  const defaultResponse = { fee: new BigNumber(0), error: true };
  const estimateTransaction = {
    data: transaction.data,
    recipient: transaction.to,
    value: transaction.amount,
  };

  const estimated = await smartWalletService
    .estimateAccountTransaction(estimateTransaction)
    .then(result => buildTxFeeInfo(result, useGasToken))
    .catch((e) => {
      reportLog('Error getting PoolTogether fee for transaction', {
        ...transaction,
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    });

  if (!estimated) {
    return defaultResponse;
  }

  return estimated;
};

export async function getApproveFeeAndTransaction(symbol: string, useGasToken: boolean) {
  const {
    tokenContractAddress: contractAddress,
    poolContractAddress,
    unitType: decimals,
    tokenABI,
  } = getPoolTogetherTokenContract(symbol);
  const transferMethod = tokenABI.find(item => item.name === 'approve');
  const rawValue = 1000000000;
  const valueToApprove = utils.parseUnits(rawValue.toString(), decimals);
  const data = abi.encodeMethod(transferMethod, [poolContractAddress, valueToApprove]);
  let transactionPayload = {
    amount: 0,
    to: contractAddress,
    symbol,
    contractAddress,
    decimals,
    data,
    extra: {
      poolTogetherApproval: {
        symbol,
      },
    },
  };

  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(transactionPayload, useGasToken);
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  if (error) {
    return null;
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
}

export const checkPoolAllowance = async (symbol: string, address: string): Promise<?boolean> => {
  const {
    poolContractAddress,
    tokenContractAddress: contractAddress,
    tokenContract: contract,
  } = getPoolTogetherTokenContract(symbol);
  let hasAllowance = false;
  try {
    const allowanceResult = await contract.allowance(address, poolContractAddress);
    if (allowanceResult) {
      hasAllowance = allowanceResult.toString() !== '0';
    }
  } catch (e) {
    reportLog('Error checking PoolTogether Allowance', {
      address,
      poolContractAddress,
      contractAddress,
      symbol,
      message: e.message,
    }, Sentry.Severity.Error);
    return null;
  }
  return hasAllowance;
};

export async function getPurchaseTicketFeeAndTransaction(depositAmount: number, symbol: string, useGasToken: boolean) {
  const {
    poolAbi,
    unitType: decimals,
    poolContractAddress,
  } = getPoolTogetherTokenContract(symbol);
  const depositMethod = poolAbi.find(item => item.name === 'depositPool');
  const valueToDeposit = utils.parseUnits(depositAmount.toString(), decimals);
  const data = abi.encodeMethod(depositMethod, [valueToDeposit]);
  let transactionPayload = {
    amount: 0,
    to: poolContractAddress,
    symbol,
    poolContractAddress,
    decimals,
    data,
    extra: {
      symbol,
      amount: valueToDeposit,
      decimals,
    },
    tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
  };

  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(transactionPayload, useGasToken);
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  if (error) {
    return null;
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
}

export async function getWithdrawTicketFeeAndTransaction(withdrawAmount: number, symbol: string, useGasToken: boolean) {
  const {
    poolAbi,
    unitType: decimals,
    poolContractAddress,
  } = getPoolTogetherTokenContract(symbol);
  const withdrawMethod = poolAbi.find(item => item.name === 'withdraw');
  const valueToWithdraw = utils.parseUnits(withdrawAmount.toString(), decimals);
  const data = abi.encodeMethod(withdrawMethod, [valueToWithdraw]);
  let transactionPayload = {
    amount: 0,
    to: poolContractAddress,
    symbol,
    poolContractAddress,
    decimals,
    data,
    extra: {
      symbol,
      amount: valueToWithdraw,
      decimals,
    },
    tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
  };

  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(transactionPayload, useGasToken);
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  if (error) {
    return null;
  }

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
}

export async function getPoolTogetherTransactions(symbol: string, address: string): Promise<Object> {
  const {
    poolContract: contract,
    unitType,
    poolContractAddress: contractAddress,
  } = getPoolTogetherTokenContract(symbol);
  let deposits = [];
  try {
    const depositedFilter = contract.filters.Deposited(address);
    const depositsLogs = await contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      ...depositedFilter,
    });
    deposits = depositsLogs.map((log) => {
      const parsedLog = contract.interface.parseLog(log);
      return {
        hash: log.transactionHash,
        amount: parsedLog.values.amount.toString(),
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
      };
    });
  } catch (e1) {
    reportLog('Error getting PoolTogether deposit transaction logs', {
      address,
      contractAddress,
      symbol,
      message: e1.message,
    }, Sentry.Severity.Error);
  }

  let withdrawals = [];
  try {
    const withdrawnCommitedFilter = contract.filters.CommittedDepositWithdrawn(address);
    const withdrawnOpenFilter = contract.filters.OpenDepositWithdrawn(address);
    const withdrawnSponsorFilter = contract.filters.SponsorshipAndFeesWithdrawn(address);
    const commitedWithdrawLogs = await contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      ...withdrawnCommitedFilter,
    });
    const openWithdrawLogs = await contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      ...withdrawnOpenFilter,
    });
    const sponsorWithdrawLogs = await contract.provider.getLogs({
      fromBlock: 0,
      toBlock: 'latest',
      ...withdrawnSponsorFilter,
    });
    const withdrawalsLogs = [].concat(commitedWithdrawLogs, openWithdrawLogs, sponsorWithdrawLogs);
    const allWithdrawals = withdrawalsLogs.map((log) => {
      const parsedLog = contract.interface.parseLog(log);
      return {
        hash: log.transactionHash,
        amount: parsedLog.values.amount.toString(),
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
      };
    });
    withdrawals = allWithdrawals.reduce((txs, tx, i) => {
      const index = txs.findIndex(({ hash }) => hash === tx.hash);
      if (index > -1) {
        txs[index] = {
          ...txs[index],
          amount: ptUtils.toBN(txs[index].amount).add(ptUtils.toBN(tx.amount)).toString(),
        };
      } else {
        txs[i] = tx;
      }
      return txs;
    }, []);
  } catch (e2) {
    reportLog('Error getting PoolTogether withdrawal transaction logs', {
      address,
      contractAddress,
      symbol,
      message: e2.message,
    }, Sentry.Severity.Error);
  }
  return {
    withdrawals,
    deposits,
  };
}
