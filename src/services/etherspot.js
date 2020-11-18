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
import {
  isCaseInsensitiveMatch,
  reportErrorLog,
} from 'utils/common';
import type {
  Asset,
  Balance,
} from 'models/Asset';
import {
  constants,
  utils,
} from 'ethers';
import { ETH } from 'constants/assetsConstants';


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
      reportErrorLog('EtherspotService init computeContractAccount failed', { error });
    });
  }

  subscribe() {
    // return this.sdk.api.subscribe()
  }

  unsubscribe() {
    // return this.sdk.api.subscribe()
  }

  getAccounts(): ?EtherspotAccount[] {
    return this.sdk.getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items) // TODO: pagination
      .catch((error) => {
        reportErrorLog('EtherspotService getAccounts -> getConnectedAccounts failed', { error });
        return null;
      });
  }

  reserveENSName(name: string): ?EtherspotAccount[] {
    return this.sdk.reserveENSName(name).catch((error) => {
      reportErrorLog('EtherspotService reserveENSName failed', { error });
      return null;
    });
  }

  async getBalances(accountAddress: string, assets: Asset[]): Promise<Balance[]> {
    const assetAddresses = assets
      // 0x0...0 is default ETH address in our assets, but it's not a token
      .filter(({ address }) => isCaseInsensitiveMatch(address, constants.AddressZero))
      .map(({ address }) => address);

    // gets balances by provided token (asset) address and ETH balance regardless
    const accountBalances = await this.sdk
      .getAccountBalances(accountAddress, assetAddresses)
      .catch((error) => {
        reportErrorLog('EtherspotService getBalances -> getAccountBalances failed', { error, accountAddress });
        return null;
      });

    // map to our Balance type
    return accountBalances.items.reduce((balances, { balance, token }) => {
      // if SDK returned token value is null then it's ETH
      const asset = assets.find(({
        address,
        symbol,
      }) => token === null ? symbol === ETH : isCaseInsensitiveMatch(address, token));

      if (!asset) {
        reportErrorLog('EtherspotService getBalances asset mapping failed', { token });
        return balances;
      }

      return [
        ...balances,
        {
          symbol: asset.symbol,
          balance: utils.formatUnits(balance, asset.decimals),
        },
      ];
    }, []);
  }

  async logout() {
    if (!this.sdk) return; // not initialized, nothing to do

    await this.sdk.destroy();
    this.sdk = null;
  }
}

const etherspot = new EtherspotService();

export default etherspot;
