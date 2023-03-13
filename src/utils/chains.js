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

// Utils
import { isProdEnv } from 'utils/environment';

// Constants
import { ETH, MATIC, BNB, AVAX, XDAI, ADDRESS_ZERO } from 'constants/assetsConstants';
import { CHAIN, CHAIN_ID } from 'constants/chainConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Utils
import { isEtherspotAccount } from 'utils/accounts';
import { mapRecordValues } from 'utils/object';

// Types
import type { Account } from 'models/Account';
import type { Chain, ChainRecord } from 'models/Chain';

export const chainFromChainId: { [number]: Chain } = {
  [CHAIN_ID.ETHEREUM_MAINNET]: CHAIN.ETHEREUM,
  [CHAIN_ID.GOERLI]: CHAIN.ETHEREUM,
  [CHAIN_ID.BINANCE]: CHAIN.BINANCE,
  [CHAIN_ID.BINANCE_TESTNET]: CHAIN.BINANCE,
  [CHAIN_ID.XDAI]: CHAIN.XDAI,
  [CHAIN_ID.SOKOL]: CHAIN.XDAI,
  [CHAIN_ID.POLYGON]: CHAIN.POLYGON,
  [CHAIN_ID.MUMBAI]: CHAIN.POLYGON,
  [CHAIN_ID.AVALANCHE]: CHAIN.AVALANCHE,
  [CHAIN_ID.FUJI]: CHAIN.AVALANCHE,
  [CHAIN_ID.OPTIMISM]: CHAIN.OPTIMISM,
  [CHAIN_ID.OPTIMISM_GOERLI]: CHAIN.OPTIMISM,
  [CHAIN_ID.ARBITRUM]: CHAIN.ARBITRUM,
  [CHAIN_ID.ARBITRUM_NITRO]: CHAIN.ARBITRUM,
};

const TestNetsChainIds = [
  CHAIN_ID.GOERLI,
  CHAIN_ID.BINANCE_TESTNET,
  CHAIN_ID.SOKOL,
  CHAIN_ID.MUMBAI,
  CHAIN_ID.FUJI,
  CHAIN_ID.OPTIMISM_GOERLI,
  CHAIN_ID.ARBITRUM_NITRO,
];

const MainNetsChainIds = [
  CHAIN_ID.ETHEREUM_MAINNET,
  CHAIN_ID.BINANCE,
  CHAIN_ID.XDAI,
  CHAIN_ID.POLYGON,
  CHAIN_ID.AVALANCHE,
  CHAIN_ID.OPTIMISM,
  CHAIN_ID.ARBITRUM,
];

export const isTestNetsChainId = (chainId: number) => {
  const isAvilChainId = TestNetsChainIds.some((id) => chainId === id);
  if (isAvilChainId) return true;
  return false;
};

export const isMainNetsChainId = (chainId: number) => {
  const isAvilChainId = MainNetsChainIds.some((id) => chainId === id);
  if (isAvilChainId) return true;
  return false;
};

/**
 * Maps chain value to chain id, supporting testnet(s) for test env.
 */
export function mapChainToChainId(chain: Chain): number {
  if (chain === CHAIN.ETHEREUM) return isProdEnv() ? CHAIN_ID.ETHEREUM_MAINNET : CHAIN_ID.GOERLI;
  if (chain === CHAIN.POLYGON) return isProdEnv() ? CHAIN_ID.POLYGON : CHAIN_ID.MUMBAI;
  if (chain === CHAIN.BINANCE) return isProdEnv() ? CHAIN_ID.BINANCE : CHAIN_ID.BINANCE_TESTNET;
  if (chain === CHAIN.XDAI) return isProdEnv() ? CHAIN_ID.XDAI : CHAIN_ID.SOKOL;
  if (chain === CHAIN.AVALANCHE) return isProdEnv() ? CHAIN_ID.AVALANCHE : CHAIN_ID.FUJI;
  if (chain === CHAIN.OPTIMISM) return isProdEnv() ? CHAIN_ID.OPTIMISM : CHAIN_ID.OPTIMISM_GOERLI;
  if (chain === CHAIN.ARBITRUM) return isProdEnv() ? CHAIN_ID.ARBITRUM : CHAIN_ID.ARBITRUM_NITRO;

  // Default to Ethereum, should not happen as above check is exhaustive.
  return isProdEnv() ? CHAIN_ID.ETHEREUM_MAINNET : CHAIN_ID.GOERLI;
}

export function mapProdChainId(chain: Chain): number {
  if (chain === CHAIN.ETHEREUM) return CHAIN_ID.ETHEREUM_MAINNET;
  if (chain === CHAIN.POLYGON) return CHAIN_ID.POLYGON;
  if (chain === CHAIN.BINANCE) return CHAIN_ID.BINANCE;
  if (chain === CHAIN.XDAI) return CHAIN_ID.XDAI;
  if (chain === CHAIN.AVALANCHE) return CHAIN_ID.AVALANCHE;
  if (chain === CHAIN.OPTIMISM) return CHAIN_ID.OPTIMISM;
  if (chain === CHAIN.ARBITRUM) return CHAIN_ID.ARBITRUM;

  // Default to Ethereum, should not happen as above check is exhaustive.
  return CHAIN_ID.ETHEREUM_MAINNET;
}

export function getSupportedChains(account: ?Account): Chain[] {
  if (!isEtherspotAccount(account)) {
    return [CHAIN.ETHEREUM];
  }
  const visibleAvalanche = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_CHAIN_SWITCH_43114);

  if (!visibleAvalanche) {
    return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM, CHAIN.OPTIMISM, CHAIN.ARBITRUM];
  }

  return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM, CHAIN.AVALANCHE, CHAIN.OPTIMISM, CHAIN.ARBITRUM];
}

/* eslint-disable i18next/no-literal-string */
export const nativeAssetPerChain = {
  ethereum: {
    chain: CHAIN.ETHEREUM,
    address: ADDRESS_ZERO,
    name: 'Ethereum',
    symbol: ETH,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
  },
  polygon: {
    chain: CHAIN.POLYGON,
    address: ADDRESS_ZERO,
    name: 'Matic',
    symbol: MATIC,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
  },
  binance: {
    chain: CHAIN.BINANCE,
    address: ADDRESS_ZERO,
    name: 'BNB',
    symbol: BNB,
    decimals: 18,
    iconUrl:
      'https://images.prismic.io/pillar-app/d8e73973-82f1-4b20-a068-fe20e21816b0_0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c_1.png?auto=compress,format',
  },
  xdai: {
    chain: CHAIN.XDAI,
    address: ADDRESS_ZERO,
    name: 'xDAI',
    symbol: XDAI,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0x6b175474e89094c44da98b954eedeac495271d0f.png',
  },
  avalanche: {
    chain: CHAIN.AVALANCHE,
    address: ADDRESS_ZERO,
    name: 'Avalanche',
    symbol: AVAX,
    decimals: 18,
    iconUrl: 'https://image.pngaaa.com/19/5554019-middle.png',
  },
  optimism: {
    chain: CHAIN.OPTIMISM,
    address: ADDRESS_ZERO,
    name: 'Ethereum',
    symbol: ETH,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
  },
  arbitrum: {
    chain: CHAIN.ARBITRUM,
    address: ADDRESS_ZERO,
    name: 'Ether',
    symbol: ETH,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
  },
};

/**
 * Flow-supported version of mapRecordValues counterpart for ChainRecord.
 */
export function mapChainRecordValues<Value, Target>(
  record: ChainRecord<Value>,
  selector: (value: Value, chain: Chain) => Target,
): ChainRecord<Target> {
  // $FlowFixMe: exact vs inexact
  return mapRecordValues(record, selector);
}
