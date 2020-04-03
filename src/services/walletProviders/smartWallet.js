// @flow
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { ethToWei } from '@netgum/utils';
import { utils } from 'ethers';
import abi from 'ethjs-abi';
import { sdkConstants } from '@smartwallet/sdk';
import { COLLECTIBLES_NETWORK } from 'react-native-dotenv';

import ERC20_CONTRACT_ABI from 'abi/erc20.json';

import { ETH, SPEED_TYPES } from 'constants/assetsConstants';
import type { Account } from 'models/Account';
import type { CollectibleTransactionPayload, SyntheticTransaction, TokenTransactionPayload } from 'models/Transaction';
import { buildERC721TransactionData } from 'services/assets';
import smartWalletService from 'services/smartWallet';
import { getEthereumProvider } from 'utils/common';
import { getAccountAddress } from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';

const {
  GasPriceStrategies: {
    Avg: AVG,
    Fast: FAST,
  },
} = sdkConstants;

export default class SmartWalletProvider {
  wallet: Object;
  sdkInitialized: boolean = false;
  sdkInitPromise: Promise<any>;

  constructor(privateKey: string, account: Account) {
    this.sdkInitPromise = smartWalletService
      .init(privateKey)
      .then(() => smartWalletService.connectAccount(account.id))
      .then(() => { this.sdkInitialized = true; })
      .catch(() => null);
  }

  getInitStatus() {
    return this.sdkInitPromise;
  }

  async transferETH(account: Account, transaction: TokenTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const { to, amount, data: transactionData } = transaction;
    const transactionSpeed = this.mapTransactionSpeed(transaction.txSpeed);
    const from = getAccountAddress(account);
    const value = ethToWei(amount);

    return smartWalletService
      .transferAsset({
        recipient: to,
        value,
        data: transactionData || '',
        transactionSpeed,
      })
      .then(hash => ({
        from,
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

  async transferERC20(account: Account, transaction: TokenTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const {
      amount,
      contractAddress,
      decimals = 18,
      usePPN,
      extra,
    } = transaction;
    let { data, to: recipient } = transaction;
    const from = getAccountAddress(account);

    if (usePPN) {
      let paymentType;
      let reference;

      const syntheticTransactionInfo: SyntheticTransaction = get(extra, 'syntheticTransaction');
      if (!isEmpty(syntheticTransactionInfo)) {
        const { transactionId } = syntheticTransactionInfo;
        reference = transactionId;
        paymentType = sdkConstants.AccountPaymentTypes.SyntheticsExchange;
      }

      const sendValue = utils.parseUnits(amount.toString(), decimals);
      return smartWalletService
        .createAccountPayment(recipient, contractAddress, sendValue, paymentType, reference)
        .then(({ hash }) => ({
          from,
          hash,
          to: recipient,
          value: sendValue.toString(),
        }))
        .catch((e) => catchTransactionError(e, 'ERC20 PPN', {
          decimals,
          contractAddress,
          to: recipient,
          value: sendValue,
        }));
    }
    const value = decimals > 0
      ? utils.parseUnits(amount.toString(), decimals)
      : utils.bigNumberify(amount.toString());

    if (!data) {
      const transferMethod = ERC20_CONTRACT_ABI.find(item => item.name === 'transfer');
      data = abi.encodeMethod(transferMethod, [recipient, value]);
      recipient = contractAddress;
    }

    const transactionSpeed = this.mapTransactionSpeed(transaction.txSpeed);

    return smartWalletService
      .transferAsset({
        // $FlowFixMe
        recipient,
        value,
        data,
        transactionSpeed,
      })
      .then(hash => ({
        from,
        hash,
        to: recipient,
        value,
      }))
      .catch((e) => catchTransactionError(e, 'ERC20', {
        decimals,
        contractAddress,
        to: recipient,
        amount,
        value,
        data,
      }));
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const { to, contractAddress, tokenId } = transaction;
    const from = getAccountAddress(account);
    const transactionSpeed = this.mapTransactionSpeed(transaction.txSpeed);

    const provider = getEthereumProvider(COLLECTIBLES_NETWORK);
    const data = await buildERC721TransactionData({ ...transaction, from }, provider);

    return smartWalletService
      .transferAsset({
        // $FlowFixMe
        recipient: contractAddress,
        value: 0,
        data,
        transactionSpeed,
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

  getTransactionCount(walletAddress: string) { //eslint-disable-line
    // TODO: connect this to sdk
    return 0;
  }

  mapTransactionSpeed(txSpeed?: string) {
    switch (txSpeed) {
      case SPEED_TYPES.FAST: return FAST;
      case SPEED_TYPES.NORMAL: return AVG;
      case SPEED_TYPES.SLOW: return AVG;
      default: return AVG;
    }
  }
}
