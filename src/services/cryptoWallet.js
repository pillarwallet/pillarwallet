// @flow
import type { Account } from 'models/Account';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import KeyBasedWalletProvider from './walletProviders/keyBasedWallet';


export default class CryptoWallet {
  walletProvider: Object;

  constructor(privateKey: string, account: Account) {
    switch (account.type) {
      case ACCOUNT_TYPES.KEY_BASED:
        this.walletProvider = new KeyBasedWalletProvider(privateKey);
        break;
      default:
        throw new Error('Unsupported account type provided');
    }
  }

  getProvider(): KeyBasedWalletProvider {
    return this.walletProvider;
  }
}
