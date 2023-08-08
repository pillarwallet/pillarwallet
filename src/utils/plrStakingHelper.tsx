/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import { ContractNames, getContractAbi } from '@etherspot/contracts';
import { ERC20TokenContract, Sdk, addressesEqual } from 'etherspot';
import { BigNumber, ethers } from 'ethers';

// Constants
import {
  BuildStakingError,
  MAX_PLR_STAKE_AMOUNT,
  MIN_PLR_STAKE_AMOUNT,
  STAKING_APY_ENDPOINT,
  WalletType,
} from 'constants/plrStakingConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Types
import type { AssetOption } from 'models/Asset';
import type { EthereumTransaction, TransactionPayload } from 'models/Transaction';

// Services
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';
import { firebaseRemoteConfig as remoteConfig } from 'services/firebase';

// Utils
import { mapChainToChainId } from 'utils/chains';
import { TRANSACTION_STATUS } from 'constants/transactionDispatcherConstants';
import { reportErrorLog } from 'utils/common';

// Abi
import plrStakingAbi from 'abi/plrStaking.json';

// Components
import Toast from 'components/Toast';

interface IPlrTransaction {
  to: string;
  data: string;
  value: any;
  chainId: number;
  createTimestamp: number;
  status: string;
}

interface IStakingContractAbi {
  encodeStake: (value: string) => Promise<any>;
  callGetContractState: () => Promise<number>;
  callMinStake: () => Promise<string>;
  callMaxStake: () => Promise<string>;
  callMaxTotalStake: () => Promise<string>;
  callTotalStaked: () => Promise<string>;
  callRewardToken: () => Promise<string>;
  callStakingToken: () => Promise<string>;
  callGetStakedAccounts: () => Promise<string[]>;
}

interface IStakingContractInfo {
  contractState: number;
  minStakeAmount: string;
  maxStakeAmount: string;
  maxStakeTotal: string;
  totalStaked: string;
  rewardToken: string;
  stakedToken: string;
  stakedAccounts: string[];
}

interface IStakingRemoteConfig {
  stakingContractAddress: string;
  stakedToken: string;
  featureStaking: boolean;
  stakingStartTime: number;
  stakingLockedStartTime: number;
}

interface IStakingApyResponse {
  staked_ether?: string;
  apr?: string;
}

let stakingContract: Partial<IStakingContractAbi> = null;
let stakingContractState: number = null;
let minStakingAmount: BigNumber = ethers.utils.parseUnits(MIN_PLR_STAKE_AMOUNT.toString());
let maxStakingAmount: BigNumber = ethers.utils.parseUnits(MAX_PLR_STAKE_AMOUNT.toString());
let stakedToken: string = null;
let rewardToken: string = null;
let storedContractInfo: IStakingContractInfo = null;
let stakingApy: string = null;

export const mapWalletTypeToIcon = (type: WalletType) => {
  switch (type) {
    case WalletType.ETHERSPOT:
      return 'etherspot16';
    case WalletType.KEYBASED:
      return 'wallet16';
    case WalletType.ARCHANOVA:
      return 'pillar16';
    default:
      return 'etherspot16';
  }
};

export const mapWalletTypeToName = (type: WalletType) => {
  switch (type) {
    case WalletType.ETHERSPOT:
      return 'Etherspot';
    case WalletType.KEYBASED:
      return 'Keybased';
    case WalletType.ARCHANOVA:
      return 'Pillar v1';
    default:
      return 'Etherspot';
  }
};

export const showBalancesReceivedToast = (symbol: string, amount: BigNumber) => {
  Toast.show({
    message: `Received ${ethers.utils.formatEther(amount)} ${symbol}! Staking PLR now...`,
    emoji: 'tada',
    autoClose: true,
  });
};

export const showStakedTokensReceivedToast = (symbol: string, amount: BigNumber) => {
  Toast.show({
    message: `${ethers.utils.formatEther(amount)} PLR has been staked! Received ${ethers.utils.formatEther(
      amount,
    )} ${symbol}!`,
    emoji: 'tada',
    autoClose: false,
  });
};

export const getStakingContractAddress = () => {
  const stakingContractAddress = remoteConfig.getString(REMOTE_CONFIG.PLR_STAKING_CONTRACT);
  return stakingContractAddress;
};

export const validatePlrStakeAmount = (plrAmount: BigNumber) => {
  if (!plrAmount) return false;

  const bnAmount = ethers.utils.parseUnits(plrAmount.toString());

  if (bnAmount.gte(minStakingAmount) && bnAmount.lte(maxStakingAmount)) return true;

  return false;
};

export const getStakingRemoteConfig = (): IStakingRemoteConfig => {
  const stakingContractAddress = remoteConfig.getString(REMOTE_CONFIG.PLR_STAKING_CONTRACT);
  const stakedToken = remoteConfig.getString(REMOTE_CONFIG.PLE_STAKING_TOKEN_ADDRESS);
  const featureStaking = remoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_PLR_STAKING);
  const stakingStartTime = remoteConfig.getNumber(REMOTE_CONFIG.PLR_STAKING_START_TIME);
  const stakingLockedStartTime = remoteConfig.getNumber(REMOTE_CONFIG.PLR_STAKING_LOCKED_START_TIME);

  return { stakingContractAddress, stakedToken, featureStaking, stakingStartTime, stakingLockedStartTime };
};

export const getStakingApy = async (): Promise<string> => {
  if (stakingApy) return stakingApy;

  const response = await fetch(STAKING_APY_ENDPOINT);
  console.log('stakingResponse', response);
  const data: IStakingApyResponse = await response.json();
  console.log('stakingData', data);
  if (data?.apr) {
    stakingApy = data?.apr;
    return stakingApy;
  }

  return null;
};

export const getStakingContract = () => {
  if (stakingContract) return stakingContract;

  const sdk: Sdk = etherspotService.getSdkForChain(CHAIN.ETHEREUM);

  if (!sdk) return null;

  const contractAddress = getStakingContractAddress();
  stakingContract = sdk.registerContract<IStakingContractAbi>('PStaking', plrStakingAbi, contractAddress);

  return stakingContract;
};

export const getStakingContractState = async () => {
  if (!stakingContractState) {
    const stakingContract = getStakingContract();
    if (!stakingContract) return null;

    stakingContractState = await stakingContract.callGetContractState();
  }

  return stakingContractState;
};

export const getStakedToken = async () => {
  if (!stakedToken) {
    const stakingContract = getStakingContract();
    if (!stakingContract) return null;

    stakedToken = await stakingContract.callStakingToken();
  }

  return stakedToken;
};

export const getStakingContractInfo = async (refresh?: boolean): Promise<IStakingContractInfo> => {
  if (!!storedContractInfo && !refresh) return storedContractInfo;

  const sdk: Sdk = etherspotService.getSdkForChain(CHAIN.ETHEREUM);

  if (!sdk) return null;

  if (!stakingContract) {
    stakingContract = getStakingContract();
  }

  try {
    const contractState = await stakingContract.callGetContractState();
    const minStakeAmount = await stakingContract.callMinStake();
    const maxStakeAmount = await stakingContract.callMaxStake();
    const maxStakeTotal = await stakingContract.callMaxTotalStake();
    const totalStaked = await stakingContract.callTotalStaked();
    const contractRewardToken = await stakingContract.callRewardToken();
    const contractStakingToken = await stakingContract.callStakingToken();
    const stakedAccounts = await stakingContract.callGetStakedAccounts();

    try {
      minStakingAmount = BigNumber.from(minStakeAmount);
      maxStakingAmount = BigNumber.from(maxStakeAmount);
    } catch {
      //
    }

    stakingContractState = contractState;
    stakedToken = contractStakingToken;
    rewardToken = contractRewardToken;

    storedContractInfo = {
      contractState,
      minStakeAmount,
      maxStakeAmount,
      maxStakeTotal,
      totalStaked,
      rewardToken,
      stakedToken,
      stakedAccounts,
    };

    return storedContractInfo;
  } catch (e) {
    return null;
  }
};

export const buildStakingTransactions = async (stkAmount: string, plrToken: AssetOption) => {
  const sdk: Sdk = etherspotService.getSdkForChain(CHAIN.ETHEREUM);

  if (!stkAmount || !plrToken?.address) return;

  const createTimestamp = +new Date();
  let transactions: IPlrTransaction[] = [];
  const contractAddress = getStakingContractAddress();
  const chainId = mapChainToChainId(plrToken.chain);

  const valueInWei = ethers.utils.parseUnits(stkAmount.toString());
  const valueInWeiString = valueInWei.toString();

  // approval
  try {
    const abi = getContractAbi(ContractNames.ERC20Token);
    const erc20Contract = sdk.registerContract<ERC20TokenContract>('erc20Contract', abi, plrToken?.address);
    const approvalTransactionRequest = erc20Contract?.encodeApprove?.(contractAddress, valueInWei);
    if (!approvalTransactionRequest || !approvalTransactionRequest.to) {
      return { errorMessage: BuildStakingError.DAO_APPROVAL_ERROR };
    }

    const approvalTransaction = {
      to: approvalTransactionRequest.to,
      data: approvalTransactionRequest.data,
      chainId,
      value: 0,
      createTimestamp,
      status: TRANSACTION_STATUS.UNSENT,
    };
    transactions = [approvalTransaction];
  } catch (e) {
    return { errorMessage: BuildStakingError.APPROVAL_ERROR };
  }

  // staking
  try {
    // sdk
    if (!stakingContract) {
      stakingContract = sdk.registerContract<IStakingContractAbi>('PStaking', plrStakingAbi, contractAddress);
    }

    const stakeTransactionRequest = await stakingContract.encodeStake?.(valueInWeiString);

    if (!stakeTransactionRequest) {
      return { errorMessage: BuildStakingError.STAKING_ERROR };
    }

    const stakingTransaction = {
      to: stakeTransactionRequest.to,
      data: stakeTransactionRequest.data,
      value: stakeTransactionRequest.value || 0,
      chainId,
      createTimestamp,
      status: TRANSACTION_STATUS.UNSENT,
    };

    transactions = [...transactions, stakingTransaction];
  } catch (e) {
    return { errorMessage: BuildStakingError.TRANSFER_ERROR };
  }

  return { transactions };
};

export const estimateTransactions = async (transactions: EthereumTransaction[], feeToken: AssetOption) => {
  etherspotService.clearTransactionsBatch(CHAIN.ETHEREUM);
  await etherspotService.setTransactionsBatch(CHAIN.ETHEREUM, transactions);

  try {
    const estimation = await etherspotService.estimateTransactionsBatch(CHAIN.ETHEREUM, feeToken?.address);
    return { estimation };
  } catch (e) {
    return { errorMessage: BuildStakingError.ESTIMATION_ERROR };
  }
};

export const sendTransactions = async (chain: string, transactionPayload: TransactionPayload) => {
  const accountAddress = etherspotService.getAccountAddress(chain);

  if (!accountAddress || !transactionPayload) return null;

  try {
    const tx = await etherspotService.sendTransaction(transactionPayload, accountAddress, chain, false);
    return tx;
  } catch (e) {
    reportErrorLog('plrStakingHelper sendTransaction', e);
  }

  return null;
};

export const getBalanceForAddress = async (chain: string, address: string, account?: string) => {
  const sdk: Sdk = etherspotService.getSdkForChain(chain);

  if (!sdk) return null;

  try {
    const { items } = await sdk.getAccountBalances({
      account,
      tokens: [address],
    });

    const tokenBalance = items.find((bal) => addressesEqual(bal?.token, address));

    if (!tokenBalance) return null;

    return tokenBalance.balance;
  } catch {
    //
  }

  return null;
};

export const sendArchanovaTransaction = async (transaction: TransactionPayload, address: string) => {
  try {
    const tx = await archanovaService.sendTransaction(transaction, address);
    if (tx) return tx;
  } catch (e) {
    reportErrorLog('sendArchanovaTransaction error', e);
  }

  return null;
};

export const bridgeServiceIdToDetails: { [id: string]: { title: string; iconUrl: string } } = {
  lifi: { title: 'LiFi', iconUrl: 'https://li.fi/logo192.png' },
};
