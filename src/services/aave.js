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
import { getEnv } from 'configs/envConfig';

// constants
import { ETH } from 'constants/assetsConstants';

// utils
import { addressesEqual, getAssetData, getAssetDataByAddress } from 'utils/assets';
import { formatAmount, reportErrorLog } from 'utils/common';
import { AAVE_ETH_ADDRESS, parseReserveAssetAddress } from 'utils/aave';

// services
import { getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';

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
    if (isEmpty(this.getLendingPoolAddressesProvider())) return null;

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
      // check if it's AAVE's ETH which contains different address than our implementation
      const assetData = addressesEqual(AAVE_ETH_ADDRESS, reserveAddress)
        ? getAssetData(accountAssets, supportedAssets, ETH)
        : getAssetDataByAddress(accountAssets, supportedAssets, reserveAddress);

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
        .getReserveData(parseReserveAssetAddress(reserveAsset))
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

    const reserveAssetAddress = parseReserveAssetAddress(asset);

    const depositedAssetData = await lendingPoolContract
      .getUserReserveData(reserveAssetAddress, accountAddress)
      .catch((e) => this.handleError(e, []));

    const earnInterestRateBN = depositedAssetData[5];
    const earnInterestRate = rayToNumeric(earnInterestRateBN) * 100; // %
    const currentBalanceBN = depositedAssetData[0];
    const currentBalance = Number(formatAmount(utils.formatUnits(currentBalanceBN, asset.decimals)));

    let earnedAmount = 0;
    let initialBalance = 0;
    const aaveTokenContract = await this.getAaveTokenContractForAsset(reserveAssetAddress);
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
