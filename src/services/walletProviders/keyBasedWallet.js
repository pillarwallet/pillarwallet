// @flow

import { ethers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';

import { ETH } from 'constants/assetsConstants';
import type { Account } from 'models/Account';
import type { CollectibleTransactionPayload, TokenTransactionPayload } from 'models/Transaction';
import {
  transferERC20,
  transferERC721,
  transferETH,
} from 'services/assets';
import { getEthereumProvider } from 'utils/common';
import { catchTransactionError } from 'utils/wallet';
import { getAccountAddress } from 'utils/accounts';

type CalculateNonceResult = {
  nonce?: number,
  transactionCount: number,
};

export default class KeyBasedWalletProvider {
  wallet: Object;

  constructor(privateKey: string) {
    const provider = getEthereumProvider(NETWORK_PROVIDER);
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload, state: Object) {
    const {
      to,
      contractAddress,
      tokenId,
      gasLimit,
      gasPrice,
      signOnly = false,
    } = transaction;

    let transactionCount;
    let { nonce } = transaction;
    const from = getAccountAddress(account);
    if (!nonce) {
      ({ nonce, transactionCount } = await this.calculateNonce(from, state, signOnly));
    } else {
      transactionCount = await this.getTransactionCount(from);
    }
    return transferERC721({
      from,
      to,
      contractAddress,
      tokenId,
      wallet: this.wallet,
      nonce,
      gasLimit,
      gasPrice,
      signOnly,
    })
      .then(result => {
        if (!signOnly) return { ...result, transactionCount };
        // result is signed hash
        return {
          signedHash: result,
          nonce,
          transactionCount,
          from,
          to,
        };
      })
      .catch((e) => {
        catchTransactionError(e, 'ERC721', {
          contractAddress,
          from,
          to,
          tokenId,
        });
      });
  }

  async transferETH(account: Account, transaction: TokenTransactionPayload, state: Object) {
    const {
      to,
      amount,
      gasLimit,
      gasPrice,
      signOnly = false,
      data,
    } = transaction;
    let transactionCount;
    let { nonce } = transaction;
    const from = getAccountAddress(account);
    if (!nonce) {
      ({ nonce, transactionCount } = await this.calculateNonce(from, state, signOnly));
    } else {
      transactionCount = await this.getTransactionCount(from);
    }
    return transferETH({
      gasLimit,
      gasPrice,
      to,
      amount,
      wallet: this.wallet,
      nonce,
      signOnly,
      data,
    })
      .then(result => {
        if (!signOnly) return { ...result, transactionCount };
        return {
          ...result,
          nonce,
          transactionCount,
          from,
          to,
        };
      })
      .catch((e) => catchTransactionError(e, ETH, {
        gasLimit,
        gasPrice,
        to,
        amount,
      }));
  }

  async transferERC20(account: Account, transaction: TokenTransactionPayload, state: Object) {
    const {
      gasLimit,
      gasPrice,
      to,
      amount,
      contractAddress,
      decimals,
      signOnly,
      data,
    } = transaction;
    let transactionCount;
    let { nonce } = transaction;
    const from = getAccountAddress(account);
    if (!nonce) {
      ({ nonce, transactionCount } = await this.calculateNonce(from, state, signOnly));
    } else {
      transactionCount = await this.getTransactionCount(from);
    }
    return transferERC20({
      gasLimit,
      gasPrice,
      to,
      amount,
      contractAddress,
      decimals,
      wallet: this.wallet,
      nonce,
      signOnly,
      data,
    })
      .then(result => {
        if (!signOnly) return { ...result, transactionCount };
        return {
          ...result,
          nonce,
          transactionCount,
          from,
          to,
        };
      })
      .catch((e) => catchTransactionError(e, 'ERC20', {
        decimals,
        contractAddress,
        to,
        amount,
      }));
  }

  async calculateNonce(
    walletAddress: string,
    state: Object,
    signedTransaction?: ?boolean = false,
  ): Promise<CalculateNonceResult> {
    let nonce;
    const { txCount: { data: { lastNonce } } } = state;
    const transactionCount = await this.getTransactionCount(walletAddress);
    if (signedTransaction) {
      // set nonce either to 0 or transaction count or increase
      nonce = (!lastNonce || lastNonce < transactionCount) && lastNonce !== 0
        ? transactionCount
        : lastNonce + 1;
    } else if (lastNonce === transactionCount && lastNonce > 0) {
      nonce = lastNonce + 1;
    }

    return Promise.resolve({ nonce, transactionCount });
  }

  async getTransactionCount(walletAddress: string) {
    return this.wallet.provider.getTransactionCount(walletAddress, 'pending');
  }
}
