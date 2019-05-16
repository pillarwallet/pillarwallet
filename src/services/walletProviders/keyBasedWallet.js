// @flow

import ethers from 'ethers';
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
    this.wallet = new ethers.Wallet(privateKey);
    this.wallet.provider = getEthereumProvider(NETWORK_PROVIDER);
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload, state: Object) {
    const {
      to,
      contractAddress,
      tokenId,
    } = transaction;
    const from = getAccountAddress(account);
    const { nonce, transactionCount } = await this.calculateNonce(from, state);

    return transferERC721({
      from,
      to,
      contractAddress,
      tokenId,
      wallet: this.wallet,
      nonce,
    })
      .then(result => ({ ...result, transactionCount }))
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
    })
      .then(result => signOnly
        ? { nonce, transactionCount, signed: result }
        : { ...result, transactionCount },
      )
      .catch((e) => catchTransactionError(e, ETH, {
        gasLimit,
        gasPrice,
        to,
        amount,
      }));
  }

  async transferERC20(account: Account, transaction: TokenTransactionPayload, state: Object) {
    const {
      to,
      amount,
      contractAddress,
      decimals,
      signOnly,
    } = transaction;
    const from = getAccountAddress(account);
    const { nonce, transactionCount } = await this.calculateNonce(from, state, signOnly);

    return transferERC20({
      to,
      amount,
      contractAddress,
      decimals,
      wallet: this.wallet,
      nonce,
      signOnly,
    })
      .then(result => signOnly
        ? { nonce, transactionCount, signed: result }
        : { ...result, transactionCount },
      )
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
    const transactionCount = await this.wallet.provider.getTransactionCount(walletAddress, 'pending');
    const { txCount: { data: { lastNonce } } } = state;
    if (signedTransaction) {
      const _transactionCount = (transactionCount > 0 ? transactionCount + 1 : 0);
      // set nonce either to 0 or transaction count or increase
      nonce = (!lastNonce || lastNonce < transactionCount) && lastNonce !== 0
        ? _transactionCount
        : lastNonce + 1;
    } else if (lastNonce === transactionCount && lastNonce > 0) {
      nonce = lastNonce + 1;
    }

    return Promise.resolve({ nonce, transactionCount });
  }
}
