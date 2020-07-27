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
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import {
  ChainId,
  Trade,
  WETH,
} from '@uniswap/sdk';
import { toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';

import ROUTER_ABI from 'abi/uniswapRouter.json';

import type { Asset } from 'models/Asset';

// tslint:disable-next-line: no-var-requires
const abiCoder = require('web3-eth-abi');

const isMainnet = NETWORK_PROVIDER === 'homestead';
export const chainId = isMainnet ? ChainId.MAINNET : ChainId.RINKEBY;
const ALLOWED_SLIPPAGE = 0.97;
const DEADLINE_FROM_NOW = 60 * 15; // seconds
export const ADDRESSES = isMainnet ?
  {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  } :
  {
    WETH: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  };

const getBNFromNumeratorDenominator = (prop: { numerator: any, denominator: any, scalar?: any }): BigNumber => {
  const { numerator, denominator, scalar } = prop;
  const numeratorBN = new BigNumber(numerator.toString());
  const denominatorBN = new BigNumber(denominator.toString());
  let scalarValue = new BigNumber(1);
  if (scalar) {
    const scalarNumeratorBN = new BigNumber(scalar.numerator.toString());
    const scalarDenominatorBN = new BigNumber(scalar.denominator.toString());
    scalarValue = scalarNumeratorBN.dividedBy(scalarDenominatorBN);
  }

  return numeratorBN.dividedBy(denominatorBN).multipliedBy(scalarValue);
};

export const mapOffer = (
  fromAsset: Asset,
  toAsset: Asset,
  allowanceSet: boolean,
  askRate: string,
): Object => {
  return {
    fromAsset,
    toAsset,
    allowanceSet,
    askRate,
    maxQuantity: '0',
    minQuantity: '0',
    extra: undefined,
    // _id: localConfig.get('shim_name'),
    description: '',
    provider: 'UNISWAPV2-SHIM',
  };
};

export const getAskRate = (trade: Trade): string => {
  const excutionPriceBN = getBNFromNumeratorDenominator(trade.executionPrice);
  return excutionPriceBN.toFixed();
};

export const parseAssets = (assets: Asset[]) => {
  assets.forEach(asset => {
    asset.address = toChecksumAddress(asset.symbol === 'ETH' ? WETH[chainId]?.address : asset.address);
    asset.code = asset.symbol;
  });
};

export const getExpectedOutput = (
  trade: Trade,
): BigNumber => {
  return getBNFromNumeratorDenominator(trade.outputAmount);
};

export function applyAllowedSlippage(output: BigNumber, outputDecimals: BigNumber): BigNumber {
  return new BigNumber(output.multipliedBy(ALLOWED_SLIPPAGE).toFixed(outputDecimals.toNumber()));
}

export const getDeadline = (): number => {
  return Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW;
};

export function swapExactTokensToTokens(
  quantityIn: string,
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string {
  const abiFunction = ROUTER_ABI.filter(m => m.name === 'swapExactTokensForTokensSupportingFeeOnTransferTokens')[0];
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    abiFunction,
    [
      quantityIn,
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
}

export function swapExactTokensToEth(
  quantityIn: string,
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string {
  const abiFunction = ROUTER_ABI.filter(m => m.name === 'swapExactTokensForETHSupportingFeeOnTransferTokens')[0];
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    abiFunction,
    [
      quantityIn,
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
}

export function swapExactEthToTokens(
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string {
  const abiFunction = ROUTER_ABI.filter(m => m.name === 'swapExactETHForTokensSupportingFeeOnTransferTokens')[0];
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    abiFunction,
    [
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
}

export const generateTxObject = (
  txCount: string,
  to: string,
  value: string,
  txData: string,
): Object => {
  return {
    to,
    value,
    nonce: txCount,
    gasLimit: '0',
    gasPrice: '0',
    chainId,
    data: txData,
  };
};
