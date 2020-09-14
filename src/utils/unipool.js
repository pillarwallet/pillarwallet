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
import { BigNumber as EthersBigNumber, Contract } from 'ethers';
import * as Sentry from '@sentry/react-native';
import { getEnv } from 'configs/envConfig';
import { ETH } from 'constants/assetsConstants';
import { encodeContractMethod } from 'services/assets';
import { getTxFeeAndTransactionPayload, addAllowanceTransaction } from 'utils/smartWallet';
import { reportLog, getEthereumProvider } from 'utils/common';
import type { Asset } from 'models/Asset';
import UNIPOOL_CONTRACT from 'abi/unipoolPool.json';


export const getStakeFeeAndTransaction = async (
  sender: string,
  amount: EthersBigNumber,
  liquidityAsset: Asset,
  useGasToken: boolean,
) => {
  const stakeTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'stake', [
    amount,
  ]);

  let stakeTransaction = {
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: stakeTransactionData,
    amount: 0,
    symbol: ETH,
  };

  stakeTransaction = await addAllowanceTransaction(
    stakeTransaction, sender, getEnv().UNIPOOL_CONTRACT_ADDRESS, liquidityAsset, amount);

  return getTxFeeAndTransactionPayload(stakeTransaction, useGasToken);
};

export const getWithdrawFeeAndTransaction = async (
  sender: string,
  amount: EthersBigNumber,
  useGasToken: boolean,
) => {
  const withdrawTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'withdraw', [
    amount,
  ]);

  const withdrawTransaction = {
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: withdrawTransactionData,
    amount: 0,
    symbol: ETH,
  };

  return getTxFeeAndTransactionPayload(withdrawTransaction, useGasToken);
};

export const getGetRewardFeeAndTransaction = async (
  sender: string,
  useGasToken: boolean,
) => {
  const getRewardTransactionData = encodeContractMethod(UNIPOOL_CONTRACT, 'getReward', []);

  const getRewardTransaction = {
    from: sender,
    to: getEnv().UNIPOOL_CONTRACT_ADDRESS,
    data: getRewardTransactionData,
    amount: 0,
    symbol: ETH,
  };

  return getTxFeeAndTransactionPayload(getRewardTransaction, useGasToken);
};

export const getStakedAmount = async (address: string): Promise<EthersBigNumber> => {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const contract = new Contract(getEnv().UNIPOOL_CONTRACT_ADDRESS, UNIPOOL_CONTRACT, provider);
  return contract.balanceOf(address).catch((e) => {
    reportLog('Error getting unipool balance', {
      message: e.message,
    }, Sentry.Severity.Error);
    return 0;
  });
};

export const getEarnedAmount = async (address: string): Promise<EthersBigNumber> => {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const contract = new Contract(getEnv().UNIPOOL_CONTRACT_ADDRESS, UNIPOOL_CONTRACT, provider);
  return contract.earned(address).catch((e) => {
    reportLog('Error getting unipool earned amount', {
      message: e.message,
    }, Sentry.Severity.Error);
    return 0;
  });
};
