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
import { BigNumber } from 'bignumber.js';

// Types
import type { ExchangeProviders, TransactionData } from 'utils/types/etherspot';
import type { AssetCore, AssetOption, Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { TransactionFeeInfo } from 'models/Transaction';

export type ExchangeProvider = ExchangeProviders;

export type ExchangeOffer = {
  provider: ?ExchangeProvider,
  fromAsset: AssetCore,
  toAsset: AssetCore,
  fromAmount: BigNumber,
  toAmount: BigNumber,
  exchangeRate: number,
  transactions: TransactionData[],
  chain: Chain,
  captureFee: BigNumber,
  toChain?: Chain,
  gasFeeAsset?: AssetOption | Asset,
  sortingValue?: number,
  feeInfo?: ?TransactionFeeInfo,
  gasCost?: string,
};

export type ExchangeFeeInfo = {
  provider: string,
  chain: Chain,
  fromAddress: string,
  toAddress: string,
  isEstimating: boolean,
  gasFeeAsset: AssetOption | Asset,
  feeInfo: TransactionFeeInfo,
  errorMessage: string | null,
};

export type TradingActivityData = {
  amm: string,
  amountUSD: number,
  timestamp: number,
  tokensIn: ActivityTokensInOut[],
  tokensOut: ActivityTokensInOut[],
  transactionAddress: string,
  transactionType: string,
};

export type ActivityTokensInOut = {
  amm: string,
  amount: number,
  network: string,
  priceETH: number,
  priceUSD: number,
  symbol: string,
};

export type PoolActivityData = {
  amm: string,
  amountUSD: number,
  timestamp: number,
  tokensIn: ActivityTokensInOut[],
  tokensOut: ActivityTokensInOut[],
  transactionAddress: string,
  transactionType: string,
};

export interface Route {
  id: string;
  fromChainId: number;
  fromAmountUSD: string;
  fromAmount: string;
  fromToken: Token;
  fromAddress?: string;
  toChainId: number;
  toAmountUSD: string;
  toAmount: string;
  toAmountMin: string;
  toToken: Token;
  toAddress?: string;
  gasCostUSD?: string;
  containsSwitchChain?: boolean;
  infiniteApproval?: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  priceUSD?: string;
  logoURI?: string;
}
