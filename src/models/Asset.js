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
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';


export type TokenType = typeof TOKENS | typeof COLLECTIBLES;

export type AssetData = {|
  token: string,
  contractAddress?: string,
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
  description: string,
  iconUrl: string,
  iconMonoUrl: string,
  wallpaperUrl: string,
  patternUrl?: string,
  decimals: number,
  amount?: number,
  code?: string,
  isSynthetixAsset?: boolean,
};

export type Assets = {
  [symbol: string]: Asset,
};

export type AssetsByAccount = {
  [accountId: string]: Assets,
};

export type AssetsStore = {
  [accountId: string]: Asset[],
};

export type Balance = {
  balance: string,
  symbol: string,
};

export type Balances = {
  [symbol: string]: Balance,
};

export type MixedBalance = {
  balance: number | string,
  symbol: string,
};


export type MixedBalances = {
  [symbol: string]: MixedBalance,
};


export type BalancesStore = {
  [accountId: string]: Balances,
};

export type Rates = {
  [string]: {
    [string]: number,
  },
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
  address?: string,
  balance?: ?AssetBalance,
  decimals?: number,
  imageUrl: string,
  name: string,
  symbol: string,
  tokenType?: TokenType,

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

export type AssetBalance = {|
  balance?: number,
  balanceInFiat?: number,
  token?: string,
  value?: string,
  syntheticBalance?: string,
|};
