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
import { getEnv } from 'configs/envConfig';

// utils
import { reportErrorLog } from 'utils/common';

// services
import { getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';

// abis
import AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI from 'abi/aaveLendingPoolAddressesProvider.json';
import AAVE_LENDING_POOL_CORE_CONTRACT_ABI from 'abi/aaveLendingPoolCore.json';

class AaveService {
  lendingPoolCoreAddress: ?string;
  lendingPoolAddress: ?string;
  aaveTokenAddresses: { [string]: string } = {};
  lendingPoolAddressesProvider: ?Object;

  getLendingPoolAddressesProvider(): ?Object {
    if (!this.lendingPoolAddressesProvider) {
      this.lendingPoolAddressesProvider = getContract(
        getEnv().AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS,
        AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI,
      );
    }

    return this.lendingPoolAddressesProvider;
  }

  async getLendingPoolCoreAddress(): Promise<string> {
    const lendingPoolAddressesProvider = this.getLendingPoolAddressesProvider();

    if (!lendingPoolAddressesProvider) {
      return this.handleError('getLendingPoolAddressesProvider failed', '');
    }

    if (!this.lendingPoolCoreAddress) {
      this.lendingPoolCoreAddress = await lendingPoolAddressesProvider.getLendingPoolCore();
    }

    return this.lendingPoolCoreAddress;
  }

  async getLendingPoolCoreContract(): Promise<Object> {
    const lendingPoolCoreAddress = await this.getLendingPoolCoreAddress();

    return Promise.resolve(getContract(
      lendingPoolCoreAddress,
      AAVE_LENDING_POOL_CORE_CONTRACT_ABI,
    ));
  }

  async getLendingPoolAddress(): Promise<string> {
    const lendingPoolAddressesProvider = this.getLendingPoolAddressesProvider();

    if (!lendingPoolAddressesProvider) {
      return this.handleError('getLendingPoolAddressesProvider failed', '');
    }

    if (!this.lendingPoolAddress) {
      this.lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    }

    return this.lendingPoolAddress;
  }

  async getAaveTokenAddress(assetAddress: string): Promise<?string> {
    if (!this.aaveTokenAddresses[assetAddress]) {
      const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
      if (!lendingPoolCoreContract) return null;
      this.aaveTokenAddresses[assetAddress] = await lendingPoolCoreContract.getReserveATokenAddress(assetAddress);
    }
    return Promise.resolve(this.aaveTokenAddresses[assetAddress]);
  }

  async getAaveTokenAddresses(): Promise<string[]> {
    const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
    if (!lendingPoolCoreContract) return [];

    const reserveAddresses = await lendingPoolCoreContract.getReserves().catch((e) => this.handleError(e, []));

    await Promise.all(reserveAddresses.map((address) => this.getAaveTokenAddress(address)));

    return Promise.resolve((Object.values(this.aaveTokenAddresses): any));
  }

  fetchAccountDepositAndWithdrawTransactions(accountAddress: string): Promise<Object> {
    /* eslint-disable i18next/no-literal-string */
    const query = `
      {
        deposits (orderBy: timestamp, orderDirection: desc, where: {
          user: "${accountAddress.toLowerCase()}"
        }) {
          id
          amount
          reserve {
            symbol
            decimals
          }
        }
        withdraws: redeemUnderlyings (orderBy: timestamp, orderDirection: desc, where: {
          user: "${accountAddress.toLowerCase()}"
        }) {
          id
          amount
          reserve {
            symbol
            decimals
          }
        }
      }
    `;
    /* eslint-enable i18next/no-literal-string */

    return callSubgraph(getEnv().AAVE_SUBGRAPH_NAME, query)
      .catch(() => null);
  }

  handleError(error: any, result: any): any {
    reportErrorLog('AAVE service failed', { error });
    return result;
  }
}

const aaveInstance = new AaveService();

export default aaveInstance;
