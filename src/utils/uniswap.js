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
import {
  ChainId,
  Trade,
  WETH,
} from '@uniswap/sdk';
import { toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';

import ROUTER_ABI from 'abi/uniswapRouter.json';
import { encodeContractMethod } from 'services/assets';
import { ETH } from 'constants/assetsConstants';
import { ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';
import { isProdEnv } from 'utils/environment';

import type { Asset } from 'models/Asset';

type UniswapChainId = ChainId.MAINNET | ChainId.KOVAN;

export const getUniswapChainId = (): UniswapChainId => isProdEnv() ? ChainId.MAINNET : ChainId.KOVAN;

const UNISWAP_ALLOWED_SLIPPAGE = 1 - (ALLOWED_SLIPPAGE / 100);
const DEADLINE_FROM_NOW = 60 * 15; // seconds

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

export const parseAssets = (assets: Asset[]): Asset[] => assets.map((asset) => ({
  ...asset,
  address: toChecksumAddress(asset.symbol === ETH ? WETH[getUniswapChainId()]?.address : asset.address),
  code: asset.symbol,
}));

export const getExpectedOutput = (
  trade: Trade,
): BigNumber => {
  return getBNFromNumeratorDenominator(trade.outputAmount);
};

export const applyAllowedSlippage = (output: BigNumber, outputDecimals: BigNumber): BigNumber => {
  return new BigNumber(output.multipliedBy(UNISWAP_ALLOWED_SLIPPAGE).toFixed(outputDecimals.toNumber()));
};

export const getDeadline = (): number => {
  return Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW;
};

export const swapExactTokensToTokens = (
  quantityIn: string,
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string => {
  const FUNCTION_NAME = 'swapExactTokensForTokensSupportingFeeOnTransferTokens';
  const encodedContractFunction = encodeContractMethod(
    ROUTER_ABI,
    FUNCTION_NAME,
    [
      quantityIn,
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
};

export const swapExactTokensToEth = (
  quantityIn: string,
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string => {
  const FUNCTION_NAME = 'swapExactTokensForETHSupportingFeeOnTransferTokens';
  const encodedContractFunction = encodeContractMethod(
    ROUTER_ABI,
    FUNCTION_NAME,
    [
      quantityIn,
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
};

export const swapExactEthToTokens = (
  outputMin: string,
  exchangePath: any,
  toAssetAddress: string,
  deadline: string,
): string => {
  const FUNCTION_NAME = 'swapExactETHForTokensSupportingFeeOnTransferTokens';
  const encodedContractFunction = encodeContractMethod(
    ROUTER_ABI,
    FUNCTION_NAME,
    [
      outputMin,
      exchangePath,
      toAssetAddress,
      deadline,
    ],
  );
  return encodedContractFunction;
};

export const generateTxObject = (
  to: string,
  value: string,
  txData: string,
): Object => ({
  to,
  value,
  data: txData,
});

export const isWethConvertedTx = (fromAssetSymbol: string, contractAddress: string): boolean => {
  return fromAssetSymbol === ETH && contractAddress === WETH[getUniswapChainId()].address;
};
