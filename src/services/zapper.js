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
import { getEnv } from 'configs/envConfig';

// utils
import httpRequest from 'utils/httpRequest';
import { reportErrorLog } from 'utils/common';

// constants
import { CHAIN } from 'models/Chain';
import { PROTOCOLS } from 'constants/zapperServiceConstants';

// for more detailed schema – https://api.zapper.fi/api/static/index.html
type ZapperAsset = {
  address: string,
  symbol: string,
  decimals: number,
  price: number,
  tokenAddress: string,
  label?: string,
  img?: string,
  reserve?: number,
  balance: number,
  balanceUSD: number,
};

type ZapperMeta = {
  label: string,
  value: string | number,
  type: string
};

type ZapperProduct = {
  label: string,
  assets: ZapperAsset[],
  meta: ZapperMeta[],
};

type ZapperProtocolBalances = {
  [address: string]: {
    products: ZapperProduct[],
    meta: ZapperMeta[],
  }
};

// does not change between envs
const ZAPPER_CONFIG = {
  API_URL: 'https://api.zapper.fi/v1',
  API_KEY: getEnv().ZAPPER_API_KEY,
};

const requestConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const buildAddressesQuery = (
  addresses: string[],
) => `addresses[]=${addresses.map((address) => `${address}`).join('&addresses[]=')}`;

const zapperNetworkIdToChain = {
  ethereum: CHAIN.ETHEREUM,
  polygon: CHAIN.POLYGON,
  'binance-smart-chain': CHAIN.BINANCE,
  xdai: CHAIN.XDAI,
};

const walletProtocols = [
  PROTOCOLS.TOKENS,
  PROTOCOLS.BITCOIN,
  PROTOCOLS.UNIT, // Generic?
  // PROTOCOLS.NFT, // we don't display NFT prices
];

const investmentProtocols = [
  PROTOCOLS.AUTO_FARM,
  PROTOCOLS.AAVE,
  PROTOCOLS.AAVE_AMM,
  PROTOCOLS.AAVE_V2,
  PROTOCOLS.ALCHEMIX,
  PROTOCOLS.ALPHA,
  PROTOCOLS.BADGER,
  PROTOCOLS.BARNBRIDGE,
  PROTOCOLS.BEEFY,
  PROTOCOLS.BZX,
  PROTOCOLS.COMPOUND,
  PROTOCOLS.CREAM,
  PROTOCOLS.CURVE,
  PROTOCOLS.DEFISAVER,
  PROTOCOLS.DEVERSIFI,
  PROTOCOLS.DHEDGE,
  PROTOCOLS.DFORCE,
  PROTOCOLS.ELLIPSIS,
  PROTOCOLS.IDLE,
  PROTOCOLS.HARVEST,
  PROTOCOLS.HEGIC,
  PROTOCOLS.KEEPER_DAO,
  PROTOCOLS.MUSHROOM,
  PROTOCOLS.PANCAKESWAP,
  PROTOCOLS.PICKLE,
  PROTOCOLS.RARI,
  PROTOCOLS.REALT,
  PROTOCOLS.RIBBON,
  PROTOCOLS.SADDLE,
  PROTOCOLS.SHELL,
  PROTOCOLS.SMOOTHY,
  PROTOCOLS.VALUE,
  PROTOCOLS.VENUS,
  PROTOCOLS.YAXIS,
  PROTOCOLS.YEARN,
];

const liquidityPoolProtocols = [
  PROTOCOLS.BALANCER,
  PROTOCOLS.BANCOR,
  PROTOCOLS.DODO,
  PROTOCOLS.DYDX,
  PROTOCOLS.FUTURESWAP,
  PROTOCOLS.LINKSWAP,
  PROTOCOLS.LOOPRING,
  PROTOCOLS.LIQUITY,
  PROTOCOLS.MOONISWAP,
  PROTOCOLS.ONEINCH,
  PROTOCOLS.QUICKSWAP,
  PROTOCOLS.SFINANCE,
  PROTOCOLS.SNOWSWAP,
  PROTOCOLS.SPOOKYSWAP,
  PROTOCOLS.SUSHISWAP,
  PROTOCOLS.SWERVE,
  PROTOCOLS.SYNTHETIX,
  PROTOCOLS.UNISWAP,
  PROTOCOLS.UNISWAP_V2,
  PROTOCOLS.UNISWAP_V3,
  PROTOCOLS.XSIGMA,
];

const depositProtocols = [
  PROTOCOLS.BELLA,
  PROTOCOLS.COVER, // Not sure about this one...
  PROTOCOLS.DEFIVADEX, // Not sure... insurance mining?
  PROTOCOLS.DSD, // Just a token
  PROTOCOLS.ESD, // Another token
  PROTOCOLS.MAKER, // DAI
  PROTOCOLS.OTHER, // Optional?
  PROTOCOLS.POOLTOGETHER,
  PROTOCOLS.REFLEXER,
  PROTOCOLS.TOKENSETS,
  PROTOCOLS.VESPER,
];

const rewardProtocols = [];

const supportedProtocols = [
  ...walletProtocols,
  ...investmentProtocols,
  ...depositProtocols,
  ...liquidityPoolProtocols,
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
): Promise<?ZapperProtocolBalances> => {
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

type ZapperNetworkWithProtocols = {
  chain: string,
  zapperNetworkId: string,
  zapperProtocolIds: string[],
};

export const getZapperAvailableChainProtocols = async (
  addresses: string[],
): Promise<?ZapperNetworkWithProtocols[]> => {
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
      const chain = zapperNetworkIdToChain[zapperNetworkId];
      return { chain, zapperNetworkId, zapperProtocolIds };
    });

    return mappedData.filter(({ chain }) => [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM].includes(chain));
  } catch (error) {
    reportErrorLog('getZapperAvailableData: API request error', { error });
    return null;
  }
};
