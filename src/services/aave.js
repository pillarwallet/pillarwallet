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
import { Contract, utils } from 'ethers';
import isEmpty from 'lodash.isempty';
import BigNumber from 'bignumber.js';
import { AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS, NETWORK_PROVIDER } from 'react-native-dotenv';
import AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI from 'abi/aaveLendingPoolAddressesProvider.json';
import AAVE_LENDING_POOL_CORE_CONTRACT_ABI from 'abi/aaveLendingPoolCore.json';
import AAVE_LENDING_POOL_CONTRACT_ABI from 'abi/aaveLendingPool.json';
import {
  formatUnits,
  getEthereumProvider,
  parseTokenAmount,
} from 'utils/common';
import {
  getAssetDataByAddress,
} from 'utils/assets';
import type {
  Asset,
  DepositableAsset,
} from 'models/Asset';


const getContract = (
  address,
  abi,
  // for wallet calls set wallet provider, for general purpose use default
  provider = getEthereumProvider(NETWORK_PROVIDER),
) => {
  try {
    return new Contract(address, abi, provider);
  } catch {
    return null;
  }
};

class AaveService {
  lendingPoolCoreAddress: ?string;
  lendingPoolAddress: ?string;
  lendingPoolAddressesProvider: ?Object;

  constructor() {
    this.lendingPoolAddressesProvider = getContract(
      AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS,
      AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI,
    );
  }

  async getLendingPoolCoreContract(provider?) {
    if (!this.lendingPoolAddressesProvider) return null;

    if (!this.lendingPoolCoreAddress) {
      this.lendingPoolCoreAddress = await this.lendingPoolAddressesProvider.getLendingPoolCore();
    }

    return getContract(
      this.lendingPoolCoreAddress,
      AAVE_LENDING_POOL_CORE_CONTRACT_ABI,
      provider,
    );
  }

  async getLendingPoolContract(provider?) {
    if (!this.lendingPoolAddressesProvider) return null;

    if (!this.lendingPoolAddress) {
      this.lendingPoolAddress = await this.lendingPoolAddressesProvider.getLendingPool();
    }

    return getContract(
      this.lendingPoolAddress,
      AAVE_LENDING_POOL_CONTRACT_ABI,
      provider,
    );
  }

  async getAssetsToDeposit(accountAssets: Asset[], supportedAssets: Asset[]): DepositableAsset[] {
    const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
    if (!lendingPoolCoreContract) return [];

    const lendingPoolContract = await this.getLendingPoolContract();
    if (!lendingPoolContract) return [];

    const poolAddresses = await lendingPoolCoreContract.getReserves().catch(() => []);

    return Promise.all(poolAddresses
      .reduce((pool, reserveAddress) => {
        const assetData = getAssetDataByAddress(accountAssets, supportedAssets, reserveAddress);
        if (!isEmpty(assetData)) pool.push(assetData);
        return pool;
      }, [])
      .map(async (reserveAsset) => {
        const reserveData = await lendingPoolContract.getReserveData(reserveAsset.address).catch(() => ([]));
        // RAY has 27 decimals
        const earnInterestRate = Number(formatUnits(reserveData[5].toString(), 27));
        return {
          ...reserveAsset,
          earnInterestRate,
        };
      }),
    );
  }

  async getDepositedAssets(accountAssets: Asset[], supportedAssets: Asset[]): DepositableAsset[] {
    const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
    if (!lendingPoolCoreContract) return [];

    const lendingPoolContract = await this.getLendingPoolContract();
    if (!lendingPoolContract) return [];

    const poolAddresses = await lendingPoolCoreContract.getReserves().catch(() => []);

    return Promise.all(poolAddresses
      .reduce((pool, reserveAddress) => {
        const assetData = getAssetDataByAddress(accountAssets, supportedAssets, reserveAddress);
        if (!isEmpty(assetData)) pool.push(assetData);
        return pool;
      }, [])
      .map(async (reserveAsset) => {
        const reserveData = await lendingPoolContract.getReserveData(reserveAsset.address).catch(() => ([]));
        // RAY has 27 decimals
        const earnInterestRate = Number(formatUnits(reserveData[5].toString(), 27));
        return {
          ...reserveAsset,
          earnInterestRate,
        };
      }),
    );
  }
}

const aaveInstance = new AaveService();

export default aaveInstance;
