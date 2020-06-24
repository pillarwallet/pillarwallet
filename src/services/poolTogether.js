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

import { DAI, ETH } from 'constants/assetsConstants';

import type { PoolInfo } from 'models/PoolTogether';

import { getEthereumProvider, formatMoney } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

import POOL_DAI_ABI from 'abi/poolDAI.json';
import POOL_USDC_ABI from 'abi/poolUSDC.json';
import DAI_ABI from 'abi/DAI.json';
import USDC_ABI from 'abi/USDC.json';

import smartWalletService from './smartWallet';

const POOL_TOGETHER_NETWORK = NETWORK_PROVIDER === 'ropsten' ? 'kovan' : NETWORK_PROVIDER;

export async function getPoolTogetherInfo(symbol: string): Promise<PoolInfo> {
  const contractAddress = symbol === DAI ? POOL_DAI_CONTRACT_ADDRESS : POOL_USDC_CONTRACT_ADDRESS;
  const poolAbi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const unitType = symbol === DAI ? 18 : 6; // DAI 18 decimals, USDC 6 decimals
  const provider = getEthereumProvider(POOL_TOGETHER_NETWORK);
  const contract = new Contract(contractAddress, poolAbi, provider);
  const accountedBalance = await contract.accountedBalance();
  const balanceCallData = contract.interface.functions.balance.encode([]);
  const result = await provider.call({ to: contract.address, data: balanceCallData });
  const balance = contract.interface.functions.balance.decode(result);
  const balanceTakenAt = new Date();
  const currentOpenDrawId = await contract.currentOpenDrawId();
  const currentDraw = await contract.getDraw(currentOpenDrawId);
  const committedSupply = await contract.committedSupply();
  const openSupply = await contract.openSupply();

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

  return Promise.resolve({
    currentPrize: formatMoney(utils.formatUnits(currentPrize.toString(), unitType)),
    prizeEstimate: formatMoney(utils.formatUnits(prizeEstimate.toString(), unitType)),
    drawDate,
    remainingTimeMs,
    totalPoolTicketsCount,
  });
}

export const getSmartWalletTxFee = async (transaction, useGasToken): Promise<TransactionFeeInfo> => {
  const defaultResponse = { fee: new BigNumber(0) };
  const estimateTransaction = {
    data: transaction.data,
    recipient: transaction.to,
    value: transaction.amount,
  };

  const estimated = await smartWalletService
    .estimateAccountTransaction(estimateTransaction)
    .then(result => buildTxFeeInfo(result, useGasToken))
    .catch(() => null);

  if (!estimated) {
    return defaultResponse;
  }

  return estimated;
};

export async function getApproveFeeAndTransaction(symbol: string, useGasToken: boolean) {
  const poolContractAddress = symbol === DAI ? POOL_DAI_CONTRACT_ADDRESS : POOL_USDC_CONTRACT_ADDRESS;
  const contractAddress = symbol === DAI ? DAI_ADDRESS : USDC_ADDRESS;
  const decimals = symbol === DAI ? 18 : 6; // DAI 18 decimals, USDC 6 decimals
  const tokenABI = symbol === DAI ? DAI_ABI : USDC_ABI;
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

  const { fee: txFeeInWei, gasToken } = await getSmartWalletTxFee(transactionPayload, useGasToken);
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
}
