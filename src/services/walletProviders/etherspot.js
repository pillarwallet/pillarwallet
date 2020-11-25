// @flow
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { ethToWei } from '@netgum/utils';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { sdkConstants } from '@smartwallet/sdk';
import { getEnv } from 'configs/envConfig';

// services
import { buildERC721TransactionData, encodeContractMethod } from 'services/assets';
import smartWalletService from 'services/smartWallet';
import etherspot from 'services/etherspot';

// constants
import { ETH, SPEED_TYPES } from 'constants/assetsConstants';

// utils
import { getEthereumProvider } from 'utils/common';
import { getAccountAddress } from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { Account } from 'models/Account';
import type { CollectibleTransactionPayload, SyntheticTransaction, TokenTransactionPayload } from 'models/Transaction';


export default class EtherspotProvider {
  wallet: Object;
  sdkInitialized: boolean = false;
  sdkInitPromise: Promise<any>;

  constructor(privateKey: string) {
    this.sdkInitPromise = etherspot
      .init(privateKey)
      .then(() => { this.sdkInitialized = true; })
      .catch(() => null);
  }

  getInitStatus() {
    return this.sdkInitPromise;
  }

  async transferETH(transaction: TokenTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const {
      to,
      amount,
      data: transactionData,
      sequentialTransactions = [],
    } = transaction;

    const value = utils.parseEther(amount);

    const etherspotTransactions = [{
      to,
      value,
      data: transactionData,
    }];

    // extracted in sequence
    sequentialTransactions.forEach((sequential) => {
      etherspotTransactions.push({
        to: sequential.to,
        value: utils.parseEther(sequential.amount),
        data: sequential?.data,
      });
    });

    return etherspot
      .setTransactionsBatchAndSend(etherspotTransactions)
      .then(hash => ({
        hash,
        to,
        value,
      }))
      .catch((e) => catchTransactionError(e, ETH, {
        to,
        amount,
        value,
      }));
  }

  async transferERC20(transaction: TokenTransactionPayload) {
    const {
      amount,
      contractAddress,
      decimals = 18,
      sequentialTransactions,
    } = transaction;
    let { data, to } = transaction;

    const value = decimals > 0
      ? utils.parseUnits(amount.toString(), decimals)
      : EthersBigNumber.from(amount.toString());

    if (!data) {
      data = encodeContractMethod(ERC20_CONTRACT_ABI, 'transfer', [to, value]);
      to = contractAddress;
    }

    const etherspotTransactions = [{
      to,
      data,
      value: 0, // value is in encoded transfer method as data
    }];

    sequentialTransactions.forEach((sequential) => {
      etherspotTransactions.push({
        to: sequential.to,
        value: utils.parseEther(sequential.amount),
        data: sequential?.data,
      });
    });

    return etherspot
      .setTransactionsBatchAndSend(etherspotTransactions)
      .then(hash => ({
        hash,
        to,
        value,
      }))
      .catch((e) => catchTransactionError(e, 'ERC20', {
        decimals,
        contractAddress,
        to,
        amount,
        value,
        data,
      }));
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const {
      to,
      contractAddress,
      tokenId,
      gasToken,
    } = transaction;
    const from = getAccountAddress(account);
    const transactionSpeed = this.mapTransactionSpeed(transaction.txSpeed);

    const provider = getEthereumProvider(getEnv().COLLECTIBLES_NETWORK);
    const data = await buildERC721TransactionData({ ...transaction, from }, provider);

    return smartWalletService
      .transferAsset({
        // $FlowFixMe
        recipient: contractAddress,
        value: 0,
        data,
        transactionSpeed,
        gasToken,
      })
      .then(hash => ({
        from,
        hash,
        to,
        tokenId,
        value: 0,
      }))
      .catch((e) => catchTransactionError(e, 'ERC721', {
        contractAddress,
        from,
        to,
        tokenId,
      }));
  }
}
