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
import { ETH, MATIC, BNB, XDAI, ADDRESS_ZERO } from 'constants/assetsConstants';
import { CHAIN, CHAIN_ID } from 'constants/chainConstants';

// Utils
import { isEtherspotAccount } from 'utils/accounts';
import { mapRecordValues } from 'utils/object';

// Types
import type { Account } from 'models/Account';
import type { Chain, ChainRecord } from 'models/Chain';

export const chainFromChainId: { [number]: Chain } = {
  [CHAIN_ID.ETHEREUM_MAINNET]: CHAIN.ETHEREUM,
  [CHAIN_ID.ETHEREUM_KOVAN]: CHAIN.ETHEREUM,
  [CHAIN_ID.BINANCE]: CHAIN.BINANCE,
  [CHAIN_ID.XDAI]: CHAIN.XDAI,
  [CHAIN_ID.POLYGON]: CHAIN.POLYGON,
};

/**
 * Maps chain value to chain id, supporting testnet(s) for test env.
 */
export function mapChainToChainId(chain: Chain): number {
  if (chain === CHAIN.ETHEREUM) return isProdEnv() ? CHAIN_ID.ETHEREUM_MAINNET : CHAIN_ID.ETHEREUM_KOVAN;
  if (chain === CHAIN.POLYGON) return CHAIN_ID.POLYGON;
  if (chain === CHAIN.BINANCE) return CHAIN_ID.BINANCE;
  if (chain === CHAIN.XDAI) return CHAIN_ID.XDAI;

  // Default to Ethereum, should not happen as above check is exhaustive.
  return isProdEnv() ? CHAIN_ID.ETHEREUM_MAINNET : CHAIN_ID.ETHEREUM_KOVAN;
}

export function getSupportedChains(account: ?Account): Chain[] {
  if (!isEtherspotAccount(account)) {
    return [CHAIN.ETHEREUM];
  }

  return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM];
}

/* eslint-disable i18next/no-literal-string */
export const nativeAssetPerChain = {
  ethereum: {
    address: ADDRESS_ZERO,
    name: 'Ethereum',
    symbol: ETH,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
  },
  polygon: {
    address: ADDRESS_ZERO,
    name: 'Matic',
    symbol: MATIC,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
  },
  binance: {
    address: ADDRESS_ZERO,
    name: 'BNB',
    symbol: BNB,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
  },
  xdai: {
    address: ADDRESS_ZERO,
    name: 'xDAI',
    symbol: XDAI,
    decimals: 18,
    iconUrl: 'https://tokens.1inch.exchange/0x6b175474e89094c44da98b954eedeac495271d0f.png',
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
