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
import axios from 'axios';
import isEmpty from 'lodash.isempty';
import {
  NETWORK_PROVIDER,
  POOL_DAI_CONTRACT_ADDRESS,
  POOL_USDC_CONTRACT_ADDRESS,
  DAI_ADDRESS,
  USDC_ADDRESS,
} from 'react-native-dotenv';
import { utils as ptUtils } from 'pooltogetherjs';
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
import { encodeContractMethod } from './assets';

const POOL_TOGETHER_NETWORK = NETWORK_PROVIDER === 'ropsten' ? 'kovan' : NETWORK_PROVIDER;
const DAI_DECIMALS = 18;
const USDC_DECIMALS = 6;

const getPoolTogetherTokenContract = (symbol: string) => {
  const poolContractAddress = symbol === DAI ? POOL_DAI_CONTRACT_ADDRESS : POOL_USDC_CONTRACT_ADDRESS;
  const poolAbi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const unitType = symbol === DAI ? DAI_DECIMALS : USDC_DECIMALS;
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

const fetchPoolTogetherGraph = async (
  contractAddress: string,
  accountAddress: string,
  openDrawId: string): Promise<Object> => {
  const url = 'https://api.thegraph.com/subgraphs/id/QmecFPxMeFeHETwJdrivTNecBTCko5nyRGgidRrVp4BSfc';
  return axios
    .post(url, {
      timeout: 5000,
      query: `
      {
          poolContract(id: "${contractAddress.toLowerCase()}") {
            openDrawId,
            openBalance,
            committedBalance,
            sponsorshipAndFeeBalance,
            playersCount,
          },
          players(where: { address:"${accountAddress}"}) {
            consolidatedBalance,
            latestBalance,
            winnings,
          },
          draws(where: {drawId: "${openDrawId}", poolContract: "${contractAddress.toLowerCase()}"}){
            feeFraction,
            drawId,
            openedAt,
            balance,
          }
      }`,
    })
    .then(({ data: response }) => response.data);
};

export async function getPoolTogetherInfo(symbol: string, address: string): Promise<?PoolInfo> {
  try {
    const {
      poolContract: contract,
      unitType,
      provider,
      poolContractAddress: contractAddress,
    } = getPoolTogetherTokenContract(symbol);
    const currentOpenDrawId = await contract.currentOpenDrawId();
    if (!currentOpenDrawId) {
      return null;
    }
    const {
      poolContract: poolContractInfo,
      players,
      draws,
    } = await fetchPoolTogetherGraph(contractAddress, address, currentOpenDrawId.toString());
    if (isEmpty(poolContractInfo) || isEmpty(draws)) {
      return null;
    }
    const {
      openBalance,
      committedBalance,
    } = poolContractInfo;

    let userInfo;
    try {
      // TODO user players[0].latestBalance / consolidatedBalance when it gets fixed and deployed on thegraph.com
      if (!isEmpty(players)) {
        const totalBalance = await contract.totalBalanceOf(address); // open, committed, fees, sponsorship balance
        if (!totalBalance.eq(0)) {
          userInfo = {
            totalBalance: formatMoney(utils.formatUnits(totalBalance.toString(), unitType)),
            ticketBalance: formatMoney(utils.formatUnits(totalBalance.toString(), unitType)),
          };
        }
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
    const accountedBalance = await contract.accountedBalance();
    const balanceCallData = contract.interface.encodeFunctionData('balance');
    const result = await provider.call({ to: contract.address, data: balanceCallData });
    const balance = contract.interface.decodeFunctionResult('balance', result);
    const balanceTakenAt = new Date();
    const supplyRatePerBlock = await contract.supplyRatePerBlock();

    let currentPrize = ptUtils.toBN(0);
    let prizeEstimate = ptUtils.toBN(0);
    const openSupply = ptUtils.toBN(openBalance);
    const committedSupply = ptUtils.toBN(committedBalance);
    let drawDate = 0;
    let remainingTimeMs = 0;
    let totalPoolTicketsCount = 0;
    if (supplyRatePerBlock) {
      const totalSupply = openSupply.add(committedSupply);
      totalPoolTicketsCount = parseInt(utils.formatUnits(totalSupply.toString(), unitType), 10);
      const { feeFraction: feeFracString = '0', openedAt } = draws[0];
      const feeFraction = new BigNumber(feeFracString);

      const prizeIntervalMs = symbol === DAI ? 604800000 : 86400000; // DAI weekly, USDC daily in miliseconds
      drawDate = (parseFloat(openedAt) * 1000) + prizeIntervalMs; // adds 14 days to a timestamp in miliseconds

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
  const defaultResponse = { fee: new BigNumber('0'), error: true };
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
  const rawValue = 1000000000;
  const valueToApprove = utils.parseUnits(rawValue.toString(), decimals);
  const data = encodeContractMethod(tokenABI, 'approve', [poolContractAddress, valueToApprove]);
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
  const valueToDeposit = utils.parseUnits(depositAmount.toString(), decimals);
  const data = encodeContractMethod(poolAbi, 'depositPool', [valueToDeposit]);
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
  const valueToWithdraw = utils.parseUnits(withdrawAmount.toString(), decimals);
  const data = encodeContractMethod(poolAbi, 'withdraw', [valueToWithdraw]);
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
    const depositsLogs = await contract.queryFilter(depositedFilter, 0, 'latest');
    deposits = depositsLogs.map((log) => {
      const parsedLog = contract.interface.parseLog(log);
      return {
        hash: log.transactionHash,
        amount: parsedLog.args.amount.toString(),
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
    const withdrawalsLogs = await contract.queryFilter({
      topics: [
        [
          withdrawnCommitedFilter.topics[0],
          withdrawnOpenFilter.topics[0],
          withdrawnSponsorFilter.topics[0],
        ],
        withdrawnCommitedFilter.topics[1], // the address topic (second arg in any of the filters)
      ],
    }, 0, 'latest');
    const allWithdrawals = withdrawalsLogs.map((log) => {
      const parsedLog = contract.interface.parseLog(log);
      return {
        hash: log.transactionHash,
        amount: parsedLog.args.amount.toString(),
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
      };
    });
    withdrawals = allWithdrawals.reduce((txs, tx) => {
      const index = txs.findIndex(({ hash }) => hash === tx.hash);
      if (index > -1) {
        txs[index] = {
          ...txs[index],
          amount: ptUtils.toBN(txs[index].amount).add(ptUtils.toBN(tx.amount)).toString(),
        };
      } else {
        txs[txs.length] = tx;
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
