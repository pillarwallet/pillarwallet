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
import { utils } from 'ethers';
import isEmpty from 'lodash.isempty';
import { AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS, AAVE_THE_GRAPH_ID } from 'react-native-dotenv';
import axios from 'axios';

// utils
import { getAssetDataByAddress } from 'utils/assets';
import { formatAmount, reportLog } from 'utils/common';

// services
import { getContract } from 'services/assets';

// abis
import AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI from 'abi/aaveLendingPoolAddressesProvider.json';
import AAVE_LENDING_POOL_CORE_CONTRACT_ABI from 'abi/aaveLendingPoolCore.json';
import AAVE_LENDING_POOL_CONTRACT_ABI from 'abi/aaveLendingPool.json';
import AAVE_TOKEN_ABI from 'abi/aaveToken.json';

// types
import type { Asset, AssetToDeposit, DepositedAsset } from 'models/Asset';


const rayToNumeric = (rayNumberBN: any) => Number(utils.formatUnits(rayNumberBN, 27));

class AaveService {
  lendingPoolCoreAddress: ?string;
  lendingPoolAddress: ?string;
  aaveTokenAddresses: { [string]: string } = {};
  lendingPoolAddressesProvider: ?Object;

  constructor() {
    this.lendingPoolAddressesProvider = getContract(
      AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS,
      AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ABI,
    );
  }

  async getLendingPoolCoreAddress(): Promise<string> {
    if (!this.lendingPoolAddressesProvider) return '';

    if (!this.lendingPoolCoreAddress) {
      this.lendingPoolCoreAddress = await this.lendingPoolAddressesProvider.getLendingPoolCore();
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
    if (!this.lendingPoolAddressesProvider) return '';

    if (!this.lendingPoolAddress) {
      this.lendingPoolAddress = await this.lendingPoolAddressesProvider.getLendingPool();
    }

    return this.lendingPoolAddress;
  }

  async getLendingPoolContract(): Promise<Object> {
    const lendingPoolAddress = await this.getLendingPoolAddress();

    return Promise.resolve(getContract(
      lendingPoolAddress,
      AAVE_LENDING_POOL_CONTRACT_ABI,
    ));
  }

  async getAaveTokenAddress(assetAddress: string): Promise<?string> {
    if (!this.aaveTokenAddresses[assetAddress]) {
      const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
      if (!lendingPoolCoreContract) return null;
      this.aaveTokenAddresses[assetAddress] = await lendingPoolCoreContract.getReserveATokenAddress(assetAddress);
    }
    return Promise.resolve(this.aaveTokenAddresses[assetAddress]);
  }

  async getAaveTokenContractForAsset(assetAddress: string): Promise<?Object> {
    if (!this.lendingPoolAddressesProvider) return null;

    const aaveTokenAddress = await this.getAaveTokenAddress(assetAddress);
    if (!aaveTokenAddress) return null;

    return Promise.resolve(getContract(
      aaveTokenAddress,
      AAVE_TOKEN_ABI,
    ));
  }

  async getAaveTokenAddresses(): Promise<string[]> {
    const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
    if (!lendingPoolCoreContract) return [];

    const reserveAddresses = await lendingPoolCoreContract.getReserves().catch((e) => this.handleError(e, []));

    await Promise.all(reserveAddresses.map((address) => this.getAaveTokenAddress(address)));

    return Promise.resolve((Object.values(this.aaveTokenAddresses): any));
  }

  async getSupportedDeposits(accountAssets: Asset[], supportedAssets: Asset[]): Promise<AssetToDeposit[]> {
    const lendingPoolCoreContract = await this.getLendingPoolCoreContract();
    if (!lendingPoolCoreContract) return Promise.resolve([]);

    const poolAddresses = await lendingPoolCoreContract.getReserves().catch((e) => this.handleError(e, []));

    return poolAddresses.reduce((pool, reserveAddress) => {
      const assetData = getAssetDataByAddress(accountAssets, supportedAssets, reserveAddress);
      if (!isEmpty(assetData)) pool.push(assetData);
      return pool;
    }, []);
  }

  async getAssetsToDeposit(accountAssets: Asset[], supportedAssets: Asset[]): Promise<AssetToDeposit[]> {
    const supportedDeposits = await this.getSupportedDeposits(accountAssets, supportedAssets);

    const lendingPoolContract = await this.getLendingPoolContract();
    if (!lendingPoolContract) return Promise.resolve([]);

    return Promise.all(supportedDeposits.map(async (reserveAsset) => {
      const reserveData = await lendingPoolContract
        .getReserveData(reserveAsset.address)
        .catch((e) => this.handleError(e, []));
      const earnInterestRate = rayToNumeric(reserveData[4]) * 100; // %
      return {
        ...reserveAsset,
        earnInterestRate,
      };
    }));
  }

  async fetchAccountDepositedAsset(accountAddress: string, asset: Asset): Promise<$Shape<DepositedAsset>> {
    const lendingPoolContract = await this.getLendingPoolContract();
    if (!lendingPoolContract) return Promise.resolve({});

    const depositedAssetData = await lendingPoolContract
      .getUserReserveData(asset.address, accountAddress)
      .catch((e) => this.handleError(e, []));

    const earnInterestRateBN = depositedAssetData[5];
    const earnInterestRate = rayToNumeric(earnInterestRateBN) * 100; // %
    const currentBalanceBN = depositedAssetData[0];
    const currentBalance = Number(formatAmount(utils.formatUnits(currentBalanceBN, asset.decimals)));

    let earnedAmount = 0;
    let initialBalance = 0;
    const aaveTokenContract = await this.getAaveTokenContractForAsset(asset.address);
    if (aaveTokenContract) {
      const initialBalanceBN = await aaveTokenContract.principalBalanceOf(accountAddress);
      const earnedAmountBN = currentBalanceBN.sub(initialBalanceBN);
      initialBalance = Number(formatAmount(utils.formatUnits(initialBalanceBN, asset.decimals)));
      earnedAmount = Number(formatAmount(utils.formatUnits(earnedAmountBN, asset.decimals)));
    }

    // percentage gain formula
    const earningsPercentageGain = ((currentBalance - initialBalance) / initialBalance) * 100;

    return Promise.resolve({
      ...asset,
      earnInterestRate,
      currentBalance,
      earnedAmount,
      earningsPercentageGain,
      initialBalance,
      aaveTokenAddress: aaveTokenContract?.address,
    });
  }

  async getAccountDepositedAssets(
    accountAddress: string,
    accountAssets: Asset[],
    supportedAssets: Asset[],
  ): Promise<DepositedAsset[]> {
    const supportedDeposits = await this.getSupportedDeposits(accountAssets, supportedAssets);
    const depositedAssets = await Promise.all(supportedDeposits.map((asset) => {
      return this.fetchAccountDepositedAsset(accountAddress, asset);
    }));
    return Promise.resolve(depositedAssets.filter(({ initialBalance }) => !!initialBalance));
  }

  async fetchAccountDepositAndWithdrawTransactions(accountAddress: string): Promise<Object> {
    const url = `https://api.thegraph.com/subgraphs/id/${AAVE_THE_GRAPH_ID}`;
    return axios
      .post(url, {
        timeout: 5000,
        query: `
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
          withdraws: redeemUnderlyings (orderBy: timestamp, orderDirection: desc, where:{
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
      `,
      })
      .then(({ data: response }) => response.data)
      .catch((e) => this.handleError(e, {}));
  }

  handleError(error: any, result: any): any {
    reportLog('AAVE service failed', { error });
    return result;
  }
}

const aaveInstance = new AaveService();

export default aaveInstance;
