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
import { BigNumber as EthersBigNumber } from 'ethers';
import * as Sentry from '@sentry/react-native';
import { getEnv } from 'configs/envConfig';
import { ETH } from 'constants/assetsConstants';
import { reportLog, parseTokenBigNumberAmount } from 'utils/common';
import { getContract, buildERC20ApproveTransactionData, encodeContractMethod } from 'services/assets';
import UNIPOOL_CONTRACT from 'abi/unipoolPool.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import type { Asset } from 'models/Asset';


export const getStakedAmount = async (address: string): Promise<EthersBigNumber> => {
  const contract = getContract(getEnv().UNIPOOL_CONTRACT_ADDRESS, UNIPOOL_CONTRACT);
  if (!contract) return null;
  return contract.balanceOf(address).catch((e) => {
    reportLog('Error getting unipool balance', {
      message: e.message,
    }, Sentry.Severity.Error);
    return null;
  });
};

export const getEarnedAmount = async (address: string): Promise<EthersBigNumber> => {
  const contract = getContract(getEnv().UNIPOOL_CONTRACT_ADDRESS, UNIPOOL_CONTRACT);
  if (!contract) return null;
  return contract.earned(address).catch((e) => {
    reportLog('Error getting unipool earned amount', {
      message: e.message,
    }, Sentry.Severity.Error);
    return null;
  });
};

export const getStakeTransactions = async (
  sender: string,
  amount: number,
  token: Asset,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const tokenAmountBN = parseTokenBigNumberAmount(amount, token.decimals);

  const stakeTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'stake', [
    tokenAmountBN,
  ]);

  let stakeTransactions = [{
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: stakeTransactionData,
    amount: 0,
    symbol: ETH,
  }];

  const erc20Contract = getContract(token.address, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, getEnv().UNIPOOL_CONTRACT_ADDRESS)
    : null;

  if (!approvedAmountBN || tokenAmountBN.gt(approvedAmountBN)) {
    const approveTransactionData =
      buildERC20ApproveTransactionData(getEnv().UNIPOOL_CONTRACT_ADDRESS, amount, token.decimals);
    stakeTransactions = [
      {
        from: sender,
        to: token.address,
        data: approveTransactionData,
        amount: 0,
        symbol: ETH,
      },
      ...stakeTransactions,
    ];
  }
  stakeTransactions[0] = {
    ...stakeTransactions[0],
    txFeeInWei,
  };

  return stakeTransactions;
};

export const getUnstakeTransaction = (
  sender: string,
  amount: number,
  txFeeInWei?: BigNumber,
) => {
  const tokenAmountBN = parseTokenBigNumberAmount(amount, 18);
  const unstakeTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'withdraw', [
    tokenAmountBN,
  ]);

  return {
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: unstakeTransactionData,
    amount: 0,
    symbol: ETH,
    txFeeInWei,
  };
};

export const getClaimRewardsTransaction = (
  sender: string,
  txFeeInWei?: BigNumber,
) => {
  const getRewardTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'getReward', []);

  return {
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: getRewardTransactionData,
    amount: 0,
    symbol: ETH,
    txFeeInWei,
  };
};
