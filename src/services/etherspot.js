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

import { constants as EthersConstants, utils as EthersUtils } from 'ethers';
import {
  Sdk as EtherspotSdk,
  NetworkNames,
  Account as EtherspotAccount,
  Accounts as EtherspotAccounts,
  EnvNames,
  ENSNode,
} from 'etherspot';

// utils
import { getFullEnsName, isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';
import { isProdEnv } from 'utils/environment';

// constants
import { ETH } from 'constants/assetsConstants';

// types
import type { Asset, Balance } from 'models/Asset';


class EtherspotService {
  sdk: EtherspotSdk;

  async init(privateKey: string): Promise<void> {
    const isMainnet = isProdEnv();

    const networkName = isMainnet
      ? NetworkNames.Mainnet
      : NetworkNames.Kovan;

    const envName = isMainnet
      ? EnvNames.MainNets
      : EnvNames.TestNets;

    this.sdk = new EtherspotSdk(privateKey, { env: envName, networkName });

    await this.sdk.computeContractAccount({ sync: true }).catch((error) => {
      reportErrorLog('EtherspotService init computeContractAccount failed', { error });
    });
  }

  getAccounts(): Promise<?EtherspotAccount[]> {
    return this.sdk.getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items)
      .catch((error) => {
        reportErrorLog('EtherspotService getAccounts -> getConnectedAccounts failed', { error });
        return null;
      });
  }

  async getBalances(accountAddress: string, assets: Asset[]): Promise<Balance[]> {
    const assetAddresses = assets
      // 0x0...0 is default ETH address in our assets, but it's not a token
      .filter(({ address }) => !isCaseInsensitiveMatch(address, EthersConstants.AddressZero))
      .map(({ address }) => address);

    let balancesRequestPayload = {
      account: accountAddress,
    };

    if (assetAddresses.length) {
      balancesRequestPayload = {
        ...balancesRequestPayload,
        tokens: assetAddresses,
      };
    }

    // gets balances by provided token (asset) address and ETH balance regardless
    const accountBalances = await this.sdk
      .getAccountBalances(balancesRequestPayload)
      .catch((error) => {
        reportErrorLog('EtherspotService getBalances -> getAccountBalances failed', { error, accountAddress });
        return null;
      });

    if (!accountBalances) {
      return []; // logged above, no balances
    }

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
          balance: EthersUtils.formatUnits(balance, asset.decimals),
        },
      ];
    }, []);
  }

  reserveEnsName(username: string): Promise<?ENSNode> {
    const fullEnsName = getFullEnsName(username);
    return this.sdk.reserveENSName({ name: fullEnsName }).catch((error) => {
      reportErrorLog('EtherspotService reserveENSName failed', { error, username, fullEnsName });
      return null;
    });
  }

  getEnsNode(nameOrHashOrAddress: string): Promise<?ENSNode> {
    return this.sdk.getENSNode({ nameOrHashOrAddress }).catch((error) => {
      reportErrorLog('getENSNode failed', { nameOrHashOrAddress, error });
      return null;
    });
  }

  async logout(): Promise<void> {
    if (!this.sdk) return; // not initialized, nothing to do

    await this.sdk.destroy();
    this.sdk = null;
  }
}

const etherspot = new EtherspotService();

export default etherspot;
