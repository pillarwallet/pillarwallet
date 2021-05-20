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
/* eslint-disable i18next/no-literal-string */

// utils
import httpRequest from 'utils/httpRequest';
import { reportErrorLog } from 'utils/common';

// constants
import { CHAIN } from 'models/Chain';

// types
import type { Chain } from 'models/Chain';

// does not change between envs
const ZAPPER_CONFIG = {
  API_URL: 'https://api.zapper.fi/v1',
  API_KEY: '96e0cc51-a62e-42ca-acee-910ea7d2a241', // public
};

const requestConfig = {
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const buildAddressesQuery = (
  addresses: string[],
) => `addresses[]=${addresses.map((address) => `${address}`).join('&addresses[]=')}`;

const mapZapperNetworkIdToChain = (network: string): ?Chain => {
  switch (network) {
    case 'ethereum': return CHAIN.ETHEREUM;
    case 'polygon': return CHAIN.POLYGON;
    case 'binance-smart-chain': return CHAIN.BINANCE;
    case 'xdai': return CHAIN.XDAI;
    default: return null;
  }
};

const walletProtocols = ['tokens'];
const investmentProtocols = [];
const liquidityPoolProtocols = ['uniswap', 'uniswap-v2', 'uniswap-v3'];
const depositProtocols = ['aave', 'aave-v2'];
const rewardProtocols = [];

const supportedProtocols = [
  ...walletProtocols,
  ...investmentProtocols,
  ...depositProtocols,
  ...rewardProtocols,
];

export const mapZapperProtocolIdToBalanceCategory = (protocol: string): ?string => {
  if (walletProtocols.includes(protocol)) return 'wallet';
  if (investmentProtocols.includes(protocol)) return 'investments';
  if (liquidityPoolProtocols.includes(protocol)) return 'liquidityPools';
  if (depositProtocols.includes(protocol)) return 'deposits';
  if (rewardProtocols.includes(protocol)) return 'rewards';

  return null;
};

export const getZapperProtocolBalanceOnNetwork = async (
  addresses: string[],
  protocol: string,
  network: string,
) => {
  if (!supportedProtocols.includes(protocol)) return null;

  try {
    const result = await httpRequest.get(
      `${ZAPPER_CONFIG.API_URL}/protocols/${protocol}/balances`
      + `?api_key=${ZAPPER_CONFIG.API_KEY}`
      + `&network=${network}`
      + `&${buildAddressesQuery(addresses)}`,
      requestConfig,
    );

    if (!result?.data) {
      reportErrorLog('getZapperProtocolBalanceOnNetwork failed: unexpected response', { response: result });
      return null;
    }

    return result.data;
  } catch (error) {
    reportErrorLog('getZapperProtocolBalanceOnNetwork: API request error', { error });
    return null;
  }
};

type AvailableChainProtocol = {
  chain: string,
  zapperNetworkId: string,
  zapperProtocolIds: string[],
};

export const getZapperAvailableChainProtocols = async (
  addresses: string[],
): Promise<?AvailableChainProtocol[]> => {
  try {
    const result = await httpRequest.get(
      `${ZAPPER_CONFIG.API_URL}/balances/supported`
      + `?api_key=${ZAPPER_CONFIG.API_KEY}`
      + `&${buildAddressesQuery(addresses)}`,
      requestConfig,
    );

    if (!result?.data) {
      reportErrorLog('getZapperAvailableData failed: unexpected response', { response: result });
      return null;
    }

    const { data } = result;

    const mappedData = data.map((supported) => {
      const { network: zapperNetworkId, protocols: zapperProtocolIds } = supported;
      const chain = mapZapperNetworkIdToChain(zapperNetworkId);
      return { chain, zapperNetworkId, zapperProtocolIds };
    });

    return mappedData.filter(({ chain }) => [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM].includes(chain));
  } catch (error) {
    reportErrorLog('getZapperAvailableData: API request error', { error });
    return null;
  }
};
