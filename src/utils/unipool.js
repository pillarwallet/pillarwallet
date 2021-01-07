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
import * as Sentry from '@sentry/react-native';
import { ETH } from 'constants/assetsConstants';
import { reportLog, parseTokenBigNumberAmount, formatUnits } from 'utils/common';
import { getContract, buildERC20ApproveTransactionData, encodeContractMethod } from 'services/assets';
import UNIPOOL_CONTRACT from 'abi/unipoolPool.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import type { Asset } from 'models/Asset';


export const getStakedAmount = async (unipoolAddress: string, userAddress: string): Promise<?number> => {
  const contract = getContract(unipoolAddress, UNIPOOL_CONTRACT);
  if (!contract) return null;
  return contract.balanceOf(userAddress)
    .then(balance => formatUnits(balance, 18))
    .catch((e) => {
      reportLog('Error getting unipool balance', {
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    });
};

export const getEarnedAmount = async (unipoolAddress: string, userAddress: string): Promise<?number> => {
  const contract = getContract(unipoolAddress, UNIPOOL_CONTRACT);
  if (!contract) return null;
  return contract.earned(userAddress)
    .then(balance => formatUnits(balance, 18))
    .catch((e) => {
      reportLog('Error getting unipool earned amount', {
        message: e.message,
      }, Sentry.Severity.Error);
      return null;
    });
};

export const getStakeTransactions = async (
  unipoolAddress: string,
  sender: string,
  amount: number,
  token: Asset,
): Promise<Object[]> => {
  const tokenAmountBN = parseTokenBigNumberAmount(amount, token.decimals);

  const stakeTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'stake', [
    tokenAmountBN,
  ]);

  let stakeTransactions = [{
    from: sender,
    to: unipoolAddress,
    data: stakeTransactionData,
    amount: 0,
    symbol: ETH,
  }];

  const erc20Contract = getContract(token.address, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, unipoolAddress)
    : null;

  if (!approvedAmountBN || tokenAmountBN.gt(approvedAmountBN)) {
    const approveTransactionData =
      buildERC20ApproveTransactionData(unipoolAddress, amount, token.decimals);
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
  return stakeTransactions;
};

export const getUnstakeTransaction = (
  unipoolAddress: string,
  sender: string,
  amount: number,
) => {
  const tokenAmountBN = parseTokenBigNumberAmount(amount, 18);
  const unstakeTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'withdraw', [
    tokenAmountBN,
  ]);

  return {
    from: sender,
    to: unipoolAddress,
    data: unstakeTransactionData,
    amount: 0,
    symbol: ETH,
  };
};

export const getClaimRewardsTransaction = (
  unipoolAddress: string,
  sender: string,
) => {
  const getRewardTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'getReward', []);

  return {
    from: sender,
    to: unipoolAddress,
    data: getRewardTransactionData,
    amount: 0,
    symbol: ETH,
  };
};
