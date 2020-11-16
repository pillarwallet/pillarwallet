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
  Sdk as EtherspotSdk,
  NetworkNames,
  Env,
  Account as EtherspotAccount,
  Accounts as EtherspotAccounts,
} from 'etherspot';

// utils
import { reportErrorLog } from 'utils/common';
import type SDKWrapper from 'services/api';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';
import { addressesEqual } from 'utils/assets';


class EtherspotService {
  sdk: EtherspotSdk;

  async init(privateKey: string) {
    // TODO: replace with testnet/mainnet instead of local
    this.sdk = new EtherspotSdk({
      privateKey,
      networkName: NetworkNames.LocalA,
    }, {
      env: new Env({
        apiOptions: {
          host: '192.168.1.111', // dev: enter your machine's local IP
          port: '4000',
        },
        networkOptions: {
          supportedNetworkNames: [NetworkNames.LocalA],
        },
      }),
    });
    await this.sdk.computeContractAccount({ sync: true }).catch((error) => {
      reportErrorLog('EtherspotService.init computeContractAccount failed', { error });
    });
  }

  getAccounts(): ?EtherspotAccount[] {
    return this.sdk.getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items) // TODO: pagination
      .catch((error) => {
        reportErrorLog('EtherspotService.getAccounts getConnectedAccounts failed', { error });
        return null;
      });
  }

  connectAccount(): ?EtherspotAccount[] {
    return this.sdk.getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items) // TODO: pagination
      .catch((error) => {
        reportErrorLog('EtherspotService.getAccounts getConnectedAccounts failed', { error });
        return null;
      });
  }

  async logout() {
    if (!this.sdk) return; // not initialized, nothing to do

    await this.sdk.destroy();
    this.sdk = null;
  }
}

const etherspot = new EtherspotService();

export default etherspot;
