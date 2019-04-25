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
import {
  availableEnvironments,
  IEnvironment,
  ISdk,
  createSdk,
} from '@archanova/wallet-sdk';


export default class SmartWallet {
  sdk: ISdk;

  constructor() {
    const config: IEnvironment = availableEnvironments.staging;
    try {
      this.sdk = createSdk(config);
    } catch (err) {
      this.handleError(err);
    }
  }

  init() {
    return this.sdk
      .initialize()
      .catch(this.handleError);
  }

  createAccount() {
    return this.sdk
      .createAccount(null)
      .then(account => {
        console.log('SmartWallet account: ', account);
        return account;
      })
      .catch(this.handleError);
  }

  handleError(error: any) {
    console.log('SmartWallet handleError: ', error);
  }
}
