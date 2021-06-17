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

import { BigNumber } from 'bignumber.js';

// Constants
import { COLLECTIBLES, TOKENS, ETH, USD, EUR, GBP } from 'constants/assetsConstants';

// Types
import type { Chain, ChainRecord } from 'models/Chain';

export type Currency = typeof USD | typeof EUR | typeof GBP;

export type TokenType = typeof TOKENS | typeof COLLECTIBLES;

export type AssetCore = {
  address: string,
  symbol: string,
  decimals: number,
};

export type AssetData = {|
  token: string,
  contractAddress: string,
  tokenType?: TokenType,
  name?: string,
  decimals: number,
  icon?: string,
  iconColor?: string,
  id?: string,
|};

export type Asset = {
  symbol: string,
  name: string,
  address: string,
  iconUrl: string,
  decimals: number,
};

export type Assets = {
  [symbol: string]: Asset,
};

export type AssetsStore = {
  [accountId: string]: Asset[],
};

export type RateKey = Currency | typeof ETH;

// TODO: migrate to stronly typed keys: USD, EUR, GBP, ETH.
export type RateEntry = { [key: string]: number };

export type Rates = {
  [symbol: string]: RateEntry,
};

export type SyntheticAsset = Asset & {
  availableBalance: number,
  exchangeRate?: number,
};

export type AssetToDeposit = Asset & {
  earnInterestRate: number,
};

export type DepositedAsset = Asset & {
  earnInterestRate: number,
  earnedAmount: number,
  earningsPercentageGain: number,
  currentBalance: number,
  initialBalance: number,
  aaveTokenAddress: string,
};

export type KeyBasedAssetTransfer = {|
  transactionHash?: string,
  assetData: AssetData,
  draftAmount?: BigNumber,
  amount?: string,
  calculatedGasLimit?: number,
  gasPrice?: number,
  signedTransaction?: Object,
  status?: string,
|};

export type AssetOption = {
  // Core props
  address: string,
  balance?: ?AssetOptionBalance,
  decimals: number,
  imageUrl: string,
  name: string,
  symbol: string,
  tokenType?: TokenType,
  chain: Chain,

  // Additional props
  assetBalance?: string,
  contractAddress?: string,
  ethAddress?: string,
  formattedBalanceInFiat?: string,
  icon?: string,
  iconUrl?: string,
  id?: string,
  imageSource?: string,
  imageUrl?: string,
  lastUpdateTime?: string,
  token?: string,
  tokenId?: string,
};

export type AssetOptionBalance = {|
  balance?: number,
  balanceInFiat?: number,
  token?: string,
  value?: string,
  syntheticBalance?: string,
|};

export type AssetDataNavigationParam = {
  id: string,
  name: string,
  token: string,
  contractAddress: string,
  icon: string,
  iconColor: string,
  imageUrl: string,
  patternIcon: string,
  decimals: number,
  chain: Chain,
}

export type SupportedAssetsPerChain = ChainRecord<Asset[]>
