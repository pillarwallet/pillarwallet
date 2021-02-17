/* eslint-disable i18next/no-literal-string */
// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import Web3 from 'web3';
import Rari from '@rari-capital/rari-sdk';
import { BigNumber } from 'bignumber.js';
import { useQuery } from 'react-query';

// Config
import { getEnv } from 'configs/envConfig';

// Utils
import { isProdEnv } from 'utils/environment';

// Constants
import { RARI_POOLS } from 'constants/rariConstants';

// Types
import type { RariPool } from 'models/RariPool';

const INFURA_MAINNET_URL = `https://mainnet.infura.io/v3/${getEnv().INFURA_PROJECT_ID}`;
const INFURA_KOVAN_URL = `https://kovan.infura.io/v3/${getEnv().INFURA_PROJECT_ID}`;

const getWeb3Provider = () => {
  const url = isProdEnv() ? INFURA_MAINNET_URL : INFURA_KOVAN_URL;
  return new Web3.providers.HttpProvider(url);
};

const getRariClient = () => {
  return new Rari(getWeb3Provider());
};

const toBigNumber = (bn: any): BigNumber => {
  return new BigNumber(bn.toString());
};

const getPool = (type: RariPool) => {
  switch (type) {
    case RARI_POOLS.STABLE_POOL:
      return getRariClient().pools.stable;
    case RARI_POOLS.YIELD_POOL:
      return getRariClient().pools.yield;
    case RARI_POOLS.ETH_POOL:
      return getRariClient().pools.ethereum;
    default:
      return undefined;
  }
};

export const fetchPoolCurrentApy = async (type: RariPool): Promise<BigNumber> => {
  const pool = getPool(type);
  const apy = await pool?.apy.getCurrentRawApy();
  return toBigNumber(apy).dividedBy(1e18);
};

export const usePoolCurrentApy = (type: RariPool) => {
  return useQuery(['Rari', type, 'CurrentApy'], () => fetchPoolCurrentApy(type));
};
