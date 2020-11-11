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
import isEmpty from 'lodash.isempty';
import { utils as ptUtils } from 'pooltogetherjs';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';

// constants
import { DAI } from 'constants/assetsConstants';
import { POOLTOGETHER_WITHDRAW_TRANSACTION, POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';

// utils
import { getEthereumProvider, formatMoney, reportErrorLog } from 'utils/common';

// abi
import POOL_DAI_ABI from 'abi/poolDAI.json';
import POOL_USDC_ABI from 'abi/poolUSDC.json';
import DAI_ABI from 'abi/DAI.json';
import USDC_ABI from 'abi/USDC.json';

// types
import type { PoolInfo } from 'models/PoolTogether';

// services
import { encodeContractMethod } from './assets';
import { callSubgraph } from './theGraph';


const DAI_DECIMALS = 18;
const USDC_DECIMALS = 6;

const getPoolNetwork = () => {
  return getEnv().NETWORK_PROVIDER === 'ropsten' ? 'kovan' : getEnv().NETWORK_PROVIDER;
};

const getPoolTogetherTokenContract = (symbol: string) => {
  const poolContractAddress =
    symbol === DAI ? getEnv().POOL_DAI_CONTRACT_ADDRESS : getEnv().POOL_USDC_CONTRACT_ADDRESS;
  const poolAbi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const unitType = symbol === DAI ? DAI_DECIMALS : USDC_DECIMALS;
  const provider = getEthereumProvider(getPoolNetwork());
  const poolContract = new Contract(poolContractAddress, poolAbi, provider);

  const tokenContractAddress = symbol === DAI ? getEnv().DAI_ADDRESS : getEnv().USDC_ADDRESS;
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
  /* eslint-disable i18next/no-literal-string */
  const query = `
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
        },
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().POOLTOGETHER_SUBGRAPH_NAME, query);
};

const fetchPoolTogetherHistory = async (contractAddress: string, accountAddress: string): Promise<Object> => {
  const poolAddress = contractAddress.toLowerCase();
  const sender = accountAddress.toLowerCase();
  /* eslint-disable i18next/no-literal-string */
  const query = `
    {
      deposits(where: {sender: "${sender}", contractAddress: "${poolAddress}"}) {
        hash
        contractAddress
        sender
        amount
      },
      withdrawals(where: {sender: "${sender}", contractAddress: "${poolAddress}"}) {
        hash
        contractAddress
        sender
        amount
      },
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().POOLTOGETHER_SUBGRAPH_NAME, query);
};

export async function getPoolTogetherInfo(symbol: string, address: string): Promise<?PoolInfo> {
  const {
    poolContract: contract,
    unitType,
    provider,
    poolContractAddress: contractAddress,
  } = getPoolTogetherTokenContract(symbol);

  const currentOpenDrawId = await contract.currentOpenDrawId().catch(() => {
    reportErrorLog('Error getting PoolTogether currentOpenDrawId', {
      address,
      contractAddress,
    });
    return null;
  });

  if (!currentOpenDrawId) {
    return null;
  }
  const poolGraphInfo = await fetchPoolTogetherGraph(contractAddress, address, currentOpenDrawId.toString());
  if (!poolGraphInfo) {
    return null;
  }
  const {
    poolContract: poolContractInfo,
    players,
    draws,
  } = poolGraphInfo;

  if (isEmpty(poolContractInfo) || isEmpty(draws)) {
    return null;
  }
  const {
    openBalance,
    committedBalance,
  } = poolContractInfo;

  let userInfo;
  // TODO user players[0].latestBalance / consolidatedBalance when it gets fixed and deployed on thegraph.com
  if (!isEmpty(players)) {
    // open, committed, fees, sponsorship balance
    const totalBalance = await contract.totalBalanceOf(address).catch(() => {
      reportErrorLog('Error getting PoolTogether user totalBalance', {
        address,
        contractAddress,
      });
      return null;
    });
    if (!totalBalance) { // if an error occurred do not return results at all
      return null;
    }
    if (!totalBalance.eq(0)) { // if the balance is 0 the user has no tickets, returns userInfo null
      userInfo = {
        totalBalance: formatMoney(utils.formatUnits(totalBalance.toString(), unitType)),
        ticketBalance: formatMoney(utils.formatUnits(totalBalance.toString(), unitType)),
      };
    }
  }
  let accountedBalance;
  let balance;
  let supplyRatePerBlock;
  try {
    accountedBalance = await contract.accountedBalance();
    const balanceCallData = contract.interface.encodeFunctionData('balance');
    const result = await provider.call({ to: contract.address, data: balanceCallData });
    balance = contract.interface.decodeFunctionResult('balance', result);
    supplyRatePerBlock = await contract.supplyRatePerBlock();
  } catch (e) {
    reportErrorLog('Error getting PoolTogether balances', {
      address,
      contractAddress,
      message: e.message,
    });
    return null;
  }

  const balanceTakenAt = new Date();

  let currentPrize = ptUtils.toBN(0);
  let prizeEstimate = ptUtils.toBN(0);
  const openSupply = ptUtils.toBN(openBalance);
  const committedSupply = ptUtils.toBN(committedBalance);
  let drawDate = 0;
  let remainingTimeMs = 0;
  let totalPoolTicketsCount = 0;
  if (supplyRatePerBlock && balance && accountedBalance) {
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
  } else {
    return null;
  }

  return {
    currentPrize: formatMoney(utils.formatUnits(currentPrize.toString(), unitType)),
    prizeEstimate: formatMoney(utils.formatUnits(prizeEstimate.toString(), unitType)),
    drawDate,
    remainingTimeMs,
    totalPoolTicketsCount,
    userInfo,
  };
}

export function getApproveTransaction(symbol: string) {
  const {
    tokenContractAddress: contractAddress,
    poolContractAddress,
    unitType: decimals,
    tokenABI,
  } = getPoolTogetherTokenContract(symbol);
  const rawValue = 1000000000;
  const valueToApprove = utils.parseUnits(rawValue.toString(), decimals);
  const data = encodeContractMethod(tokenABI, 'approve', [poolContractAddress, valueToApprove]);

  return {
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
    reportErrorLog('Error checking PoolTogether Allowance', {
      address,
      poolContractAddress,
      contractAddress,
      symbol,
      message: e.message,
    });
    return null;
  }
  return hasAllowance;
};

export function getPurchaseTicketTransaction(depositAmount: number, symbol: string) {
  const {
    poolAbi,
    unitType: decimals,
    poolContractAddress,
  } = getPoolTogetherTokenContract(symbol);
  const valueToDeposit = utils.parseUnits(depositAmount.toString(), decimals);
  const data = encodeContractMethod(poolAbi, 'depositPool', [valueToDeposit]);

  return {
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
}

export function getWithdrawTicketTransaction(withdrawAmount: number, symbol: string) {
  const {
    poolAbi,
    unitType: decimals,
    poolContractAddress,
  } = getPoolTogetherTokenContract(symbol);
  const valueToWithdraw = utils.parseUnits(withdrawAmount.toString(), decimals);
  const data = encodeContractMethod(poolAbi, 'withdraw', [valueToWithdraw]);

  return {
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
}

export async function getPoolTogetherTransactions(symbol: string, address: string): Promise<Object> {
  const { unitType, poolContractAddress: contractAddress } = getPoolTogetherTokenContract(symbol);
  let deposits = [];
  let withdrawals = [];
  const rawHistory = await fetchPoolTogetherHistory(contractAddress, address)
    .catch(() => null);
  if (rawHistory) {
    const { deposits: rawDeposits, withdrawals: rawWithdraws } = rawHistory;
    deposits = rawDeposits.map(tx => {
      return {
        hash: tx.hash,
        amount: tx.amount,
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
      };
    });
    const allWithdrawals = rawWithdraws.map(tx => {
      return {
        hash: tx.hash,
        amount: tx.amount,
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
  }
  return {
    deposits,
    withdrawals,
  };
}
