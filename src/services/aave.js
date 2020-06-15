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
import { Contract } from 'ethers';
import isEmpty from 'lodash.isempty';
import { AAVE_LENDING_POOL_CORE_CONTRACT_ADDRESS, NETWORK_PROVIDER } from 'react-native-dotenv';
import AAVE_LENDING_POOL_CORE_CONTRACT_ABI from 'abi/aaveLendingPoolCore.json';
import AAVE_LENDING_POOL_CONTRACT_ABI from 'abi/aaveLendingPool.json';
import { getEthereumProvider } from 'utils/common';
import {
  getAssetDataByAddress,
} from 'utils/assets';
import type { Asset } from 'models/Asset';


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

const aaveService = ({
  getLendingPoolCoreContract: (provider?) => getContract(
    AAVE_LENDING_POOL_CORE_CONTRACT_ADDRESS,
    AAVE_LENDING_POOL_CORE_CONTRACT_ABI,
    provider,
  ),
  getLendingPoolContract: (address, provider?) => getContract(
    address,
    AAVE_LENDING_POOL_CONTRACT_ABI,
    provider,
  ),
  getAvailablePool: async (accountAssets: Asset[], supportedAssets: Asset[]) => {
    const lendingPoolCoreContract = aaveService.getLendingPoolCoreContract()
    if (!lendingPoolCoreContract) return [];

    const lendingPoolContractAddress = await lendingPoolCoreContract.lendingPoolAddress();
    const lendingPoolContract = aaveService.getLendingPoolContract(lendingPoolContractAddress);
    if (!lendingPoolContract) return [];

    const poolAddresses = await lendingPoolCoreContract.getReserves().catch(() => []);
    const poolWithData = poolAddresses.reduce(async (pool, reserveAddress) => {
      console.log('supportedAssets: ', supportedAssets)
      const assetData = getAssetDataByAddress(accountAssets, supportedAssets, reserveAddress);
      if (!isEmpty(assetData)) {
        const reserveData = await lendingPoolContract.getReserveData(reserveAddress).catch((e) => {
          console.log('err: ', e);
          return {};
        });
        console.log('reserveData: ', reserveData)
        const mappedReserveData = {
          address: reserveAddress,
        };
        return [...pool, mappedReserveData];
      }
      return pool;
    }, []);
    await Promise.all(poolWithData);
    console.log('poolWithData: ', poolWithData)
    return poolWithData;
  },
});

export default aaveService;
