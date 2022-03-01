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

import { ethers } from 'ethers';
import { getEnv } from 'configs/envConfig';

// constants
import { ETH } from 'constants/assetsConstants';

// utils
import {
  getEthereumProvider,
  logBreadcrumb,
} from 'utils/common';
import { catchTransactionError } from 'utils/wallet';
import { getAccountAddress } from 'utils/accounts';
import { mapToEthereumTransactions } from 'utils/transactions';

// services
import {
  sendRawTransaction,
  transferERC20,
  transferERC721,
  transferETH,
} from 'services/assets';

// types
import type { Account } from 'models/Account';
import type {
  CollectibleTransactionPayload,
  TransactionFeeInfo,
  TransactionPayload,
  TransactionResult,
} from 'models/Transaction';


type CalculateNonceResult = {
  nonce?: number,
  transactionCount: number,
};

export default class KeyBasedWalletProvider {
  wallet: Object;

  constructor(privateKey: string) {
    const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload, state: Object) {
    const {
      to,
      contractAddress,
      tokenId,
      useLegacyTransferMethod,
      gasLimit,
      gasPrice,
      signOnly = false,
    } = transaction;
    const from = getAccountAddress(account);
    const { nonce, transactionCount } = await this.calculateNonce(from, state, signOnly);

    if (!tokenId) {
      return catchTransactionError({ message: 'Token ID not found!' }, 'ERC721', {
        contractAddress,
        from,
        to,
        tokenId,
      });
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
      useLegacyTransferMethod,
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
      .catch((e) => catchTransactionError(e, 'ERC721', {
        contractAddress,
        from,
        to,
        tokenId,
      }));
  }

  async transferETH(account: Account, transaction: TransactionPayload, state: Object) {
    const {
      to,
      amount,
      gasLimit,
      gasPrice,
      signOnly = false,
      data,
    } = transaction;
    const from = getAccountAddress(account);
    const { nonce, transactionCount } = await this.calculateNonce(from, state, signOnly);
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

  async transferERC20(account: Account, transaction: TransactionPayload, state: Object) {
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
    const from = getAccountAddress(account);
    const { nonce, transactionCount } = await this.calculateNonce(from, state, signOnly);

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

  async sendTransaction(
    transaction: TransactionPayload,
    fromAccountAddress: string,
    feeInfo: ?TransactionFeeInfo,
  ): Promise<?TransactionResult> {
    const mappedTransactions = await mapToEthereumTransactions(transaction, fromAccountAddress);

    const transactionCount = await this.getTransactionCount(fromAccountAddress);
    const nonce = transactionCount || 0;

    const { fee, gasPrice } = feeInfo ?? {};
    if (!fee || !gasPrice) {
      logBreadcrumb('sendTransaction', 'Exception in wallet transaction', {
        transaction,
        feeInfo,
        error: 'failed to parse feeInfo',
      });
      return null;
    }

    const gasPriceBN = ethers.BigNumber.from(gasPrice.toString());
    const gasLimitBN = ethers.BigNumber.from(fee.toString()).div(gasPriceBN);

    return sendRawTransaction(this.wallet, {
      ...mappedTransactions[0], // key based always sends single
      gasLimit: gasLimitBN,
      gasPrice: gasPriceBN,
      nonce,
    });
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

  getTransactionCount(walletAddress: string) {
    return this.wallet.provider.getTransactionCount(walletAddress, 'pending');
  }
}
