// @flow
import type { Account } from 'models/Account';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import KeyBasedWalletProvider from './walletProviders/keyBasedWallet';
import SmartWalletProvider from './walletProviders/smartWallet';


export default class CryptoWallet {
  walletProvider: KeyBasedWalletProvider | SmartWalletProvider;
  walletProviderInitialized: boolean = false;
  initWalletProviderPromise: Promise<any>;

  constructor(privateKey: string, account: Account) {
    switch (account.type) {
      case ACCOUNT_TYPES.KEY_BASED:
        this.walletProvider = new KeyBasedWalletProvider(privateKey);
        this.walletProviderInitialized = true;
        break;
      case ACCOUNT_TYPES.SMART_WALLET:
        this.walletProvider = new SmartWalletProvider(privateKey, account);
        this.initWalletProviderPromise = this.walletProvider.getInitStatus();
        break;
      default:
        throw new Error('Unsupported account type provided'); // eslint-disable-line i18next/no-literal-string
    }
  }

  async getProvider(): Promise<KeyBasedWalletProvider | SmartWalletProvider> {
    return this.walletProviderInitialized
      ? Promise.resolve(this.walletProvider)
      : this.initWalletProviderPromise.then(this.finishProviderInitialization);
  }

  finishProviderInitialization = () => {
    this.walletProviderInitialized = true;
    return this.walletProvider;
  };
}
