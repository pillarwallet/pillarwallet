// @flow
import { ethToWei } from '@netgum/utils';
import { ETH } from 'constants/assetsConstants';
import type { Account } from 'models/Account';
import type { CollectibleTransactionPayload, TokenTransactionPayload } from 'models/Transaction';
import { transferERC20, transferERC721 } from 'services/assets';
import SmartWalletService from 'services/smartWallet';
import { catchTransactionError } from 'utils/wallet';
import { getAccountAddress } from 'utils/accounts';


export default class SmartWalletProvider {
  wallet: Object;
  smartWalletService: SmartWalletService;
  sdkInitialized: boolean = false;
  sdkInitPromise: Promise<any>;

  constructor(privateKey: string, account: Account) {
    this.smartWalletService = new SmartWalletService();
    this.sdkInitPromise = this.smartWalletService
      .init(privateKey)
      .then(() => this.smartWalletService.connectAccount(account.id))
      .then(() => { this.sdkInitialized = true; })
      .catch(() => null);
  }

  getInitStatus() {
    return this.sdkInitPromise;
  }

  async transferETH(account: Account, transaction: TokenTransactionPayload) {
    // TODO: connect transactionSpeed selector from the UI
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }
    const { to, amount } = transaction;
    const accountAddress = getAccountAddress(account);
    const value = ethToWei(amount);

    return this.smartWalletService
      .transferAsset({
        recipient: to,
        value,
        data: '',
        // transactionSpeed
      })
      .then(hash => ({
        from: accountAddress,
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
    const {
      to,
      amount,
      contractAddress,
      decimals,
    } = transaction;

    // TODO: replace this with the sdk transfer method
    return transferERC20({
      to,
      amount,
      contractAddress,
      decimals,
      wallet: this.wallet,
    })
      .catch((e) => catchTransactionError(e, 'ERC20', {
        decimals,
        contractAddress,
        to,
        amount,
      }));
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload) {
    const {
      to,
      contractAddress,
      tokenId,
    } = transaction;
    const from = getAccountAddress(account);

    // TODO: replace this with the sdk transfer method
    return transferERC721({
      from,
      to,
      contractAddress,
      tokenId,
      wallet: this.wallet,
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
}
