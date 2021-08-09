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

// Types
import type { Chain, ChainRecord } from 'models/Chain';


export type Collectible = {
  id: string,
  name: string,
  description: ?string,
  icon: ?string,
  iconUrl: ?string,
  image: ?string,
  imageUrl: ?string,
  contractAddress: string,
  tokenType: string,
  symbol?: void,
  decimals?: void,
  chain: Chain,

  /**
   * Legacy NFTs are minted pre ERC-721 (e.g. cryptokitties)
   * and require using `transfer` method instead of one inferred from ABI.
   */
  isLegacy: boolean,
};

export type CollectibleTransaction = {
  assetSymbol: string,
  assetAddress: string,
  assetData: Collectible,
  blockNumber: string,
  contractAddress: string,
  createdAt: number,
  from: string,
  gasPrice?: number,
  gasUsed?: number,
  hash?: string,
  batchHash: ?string,
  icon: string,
  nbConfirmations?: number,
  protocol: string,
  status: string,
  to: string,
  type: string,
  value: number,
  _id: string,
};

export type CollectiblesStore = {
  [accountId: string]: ChainRecord<Collectible[]>,
};

export type CollectiblesHistoryStore = {
  [accountId: string]: ChainRecord<CollectibleTransaction[]>,
};
