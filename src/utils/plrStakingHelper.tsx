import { ContractNames, getContractAbi } from '@etherspot/contracts';
import { ERC20TokenContract, Sdk, addressesEqual } from 'etherspot';
import { BigNumber, ethers } from 'ethers';

// Constants
import { MAX_PLR_STAKE_AMOUNT, MIN_PLR_STAKE_AMOUNT, WalletType } from 'constants/plrStakingConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Types
import type { AssetOption } from 'models/Asset';
import type { EthereumTransaction, TransactionPayload } from 'models/Transaction';

// Services
import etherspotService from 'services/etherspot';
import { firebaseRemoteConfig as remoteConfig } from 'services/firebase';

// Utils
import { isProdEnv } from 'utils/environment';
import { mapChainToChainId, chainFromChainId } from 'utils/chains';
import { TRANSACTION_STATUS } from 'constants/transactionDispatcherConstants';

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
  stakingContract: string;
  stakedToken: string;
  featureStaking: boolean;
  stakingStartTime: number;
  stakingLockedStartTime: number;
}

let stakingContract: Partial<IStakingContractAbi> = null;
let stakingContractState: number = null;
let minStakingAmount: BigNumber = ethers.utils.parseUnits(MIN_PLR_STAKE_AMOUNT.toString());
let maxStakingAmount: BigNumber = ethers.utils.parseUnits(MAX_PLR_STAKE_AMOUNT.toString());
let stakedToken: string = null;
let rewardToken: string = null;
let storedContractInfo: IStakingContractInfo = null;

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
  const stakingContract = remoteConfig.getString(REMOTE_CONFIG.PLR_STAKING_CONTRACT);
  return stakingContract;
};

export const validatePlrStakeAmount = (plrAmount: BigNumber) => {
  if (!plrAmount) return false;

  const bnAmount = ethers.utils.parseUnits(plrAmount.toString());

  if (bnAmount.gte(minStakingAmount) && bnAmount.lte(maxStakingAmount)) return true;

  return false;
};

export const getStakingRemoteConfig = (): IStakingRemoteConfig => {
  const stakingContract = remoteConfig.getString(REMOTE_CONFIG.PLR_STAKING_CONTRACT);
  const stakedToken = remoteConfig.getString(REMOTE_CONFIG.PLE_STAKING_TOKEN_ADDRESS);
  const featureStaking = remoteConfig.getBoolean(REMOTE_CONFIG.FEATURE_PLR_STAKING);
  const stakingStartTime = remoteConfig.getNumber(REMOTE_CONFIG.PLR_STAKING_START_TIME);
  const stakingLockedStartTime = remoteConfig.getNumber(REMOTE_CONFIG.PLR_STAKING_LOCKED_START_TIME);

  return { stakingContract, stakedToken, featureStaking, stakingStartTime, stakingLockedStartTime };
};

export const getStakingContract = () => {
  const sdk: Sdk = etherspotService.getSdkForChain(CHAIN.ETHEREUM);

  if (!sdk) return null;

  if (!stakingContract) {
    const contractAddress = getStakingContractAddress();
    stakingContract = sdk.registerContract<IStakingContractAbi>('PStaking', plrStakingAbi, contractAddress);
  }

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
    const contractAddress = getStakingContractAddress();
    stakingContract = sdk.registerContract<IStakingContractAbi>('PStaking', plrStakingAbi, contractAddress);
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
      return { errorMessage: 'Failed to build PLR DAO stake approval transaction!' };
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
    return { errorMessage: 'Failed to build approval transaction!' };
  }

  // staking
  try {
    // sdk
    if (!stakingContract) {
      stakingContract = sdk.registerContract<IStakingContractAbi>('PStaking', plrStakingAbi, contractAddress);
    }

    const stakeTransactionRequest = await stakingContract.encodeStake?.(valueInWeiString);

    if (!stakeTransactionRequest) {
      return { errorMessage: 'Failed build staking transaction!' };
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
    console.log('staking error', e);

    return { errorMessage: 'Failed build transfer transaction!' };
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
    return { errorMessage: 'Could not estimate transaction fees.' };
  }
};

export const sendTransactions = async (chain: string, transactionPayload: TransactionPayload) => {
  const accountAddress = etherspotService.getAccountAddress(chain);

  if (!accountAddress || !transactionPayload) return null;

  try {
    const tx = await etherspotService.sendTransaction(transactionPayload, accountAddress, chain, false);
    return tx;
  } catch (e) {
    console.log('sendTransactionsError', e);
  }

  return null;
};

export const getBalanceForAddress = async (chain: string, address: string) => {
  const sdk: Sdk = etherspotService.getSdkForChain(chain);

  if (!sdk) return null;

  try {
    const { items } = await sdk.getAccountBalances({
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
