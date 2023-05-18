import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';

import { ContractNames, getContractAbi } from '@etherspot/contracts';
import { ERC20TokenContract } from 'etherspot';

// Constants
import {
  MAX_PLR_STAKE_AMOUNT,
  MIN_PLR_STAKE_AMOUNT,
  STAKING_CONTRACT_ADDRESS,
  STAKING_CONTRACT_ADDRESS_TESTNET,
  WalletType,
} from 'constants/plrStakingConstants';
import { CHAIN } from 'constants/chainConstantsTs';

// Types
import type { Asset, AssetOption } from 'models/Asset';

// Services
import etherspotService from 'services/etherspot';

// Utils
import { isProdEnv } from 'utils/environment';
import { mapChainToChainId } from 'utils/chains';
import { TRANSACTION_STATUS } from 'constants/transactionDispatcherConstants';

interface IPillarDao {
  encodeDeposit(amount: BigNumber): {
    to: string;
    data: string;
  };
}

interface IPlrTransaction {
  to: string;
  data: string;
  chainId: number;
  value: number;
  createTimestamp: number;
  status: string;
}

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

export const getStakingContractAddress = () => {
  if (isProdEnv()) return STAKING_CONTRACT_ADDRESS;
  return STAKING_CONTRACT_ADDRESS_TESTNET;
};

export const validatePlrStakeAmount = (plrAmount: BigNumber) => {
  if (plrAmount >= new BigNumber(MIN_PLR_STAKE_AMOUNT) && plrAmount < new BigNumber(MAX_PLR_STAKE_AMOUNT)) return true;

  return false;
};

export const buildStakingTransactions = (stkAmount: BigNumber, plrToken: AssetOption) => {
  const sdk = etherspotService.getSdkForChain(CHAIN.ETHEREUM);

  if (!stkAmount || !plrToken?.address) return;

  const createTimestamp = +new Date();
  let transactions: IPlrTransaction[] = [];
  const contractAddress = getStakingContractAddress();
  const chainId = mapChainToChainId(plrToken.chain);

  try {
    const abi = getContractAbi(ContractNames.ERC20Token);
    const erc20Contract = sdk.registerContract<ERC20TokenContract>('erc20Contract', abi, plrToken.address);
    const approvalTransactionRequest = erc20Contract?.encodeApprove?.(contractAddress, stkAmount);

    if (!approvalTransactionRequest || !approvalTransactionRequest.to) {
      return { errorMessage: 'Failed to build PLR DAO stake approval transaction!' };
    }

    const approvalTransaction = {
      to: approvalTransactionRequest.to,
      data: approvalTransactionRequest.data,
      chainId: chainId,
      value: 0,
      createTimestamp,
      status: TRANSACTION_STATUS.UNSENT,
    };
    transactions = [approvalTransaction];
  } catch (e) {
    return { errorMessage: 'Failed to build approval transaction!' };
  }

  try {
    const plrDaoStakingContract = sdk.registerContract<IPillarDao>(
      'plrDaoStakingContract',
      ['function deposit(uint256)'],
      contractAddress,
    );
    const stakeTransactionRequest = plrDaoStakingContract?.encodeDeposit?.(stkAmount);

    if (!stakeTransactionRequest || !stakeTransactionRequest.to) {
      return { errorMessage: 'Failed build transfer transaction!' };
    }

    const approvalTransaction = {
      to: stakeTransactionRequest.to,
      data: stakeTransactionRequest.data,
      chainId: chainId,
      value: 0,
      createTimestamp,
      status: TRANSACTION_STATUS.UNSENT,
    };

    transactions = [...transactions, approvalTransaction];
  } catch (e) {
    return { errorMessage: 'Failed build transfer transaction!' };
  }

  return { transactions };
};
