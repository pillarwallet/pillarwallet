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
  Token,
  ChainId,
  Pair,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  WETH,
} from '@uniswap/sdk';
import { toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';

import { reportOrWarn, convertToBaseUnits } from 'utils/common';

import type { Asset } from 'models/Asset';

const isMainnet = NETWORK_PROVIDER === 'homestead';
const chainId = isMainnet ? ChainId.MAINNET : ChainId.RINKEBY;
// const ALLOWED_SLIPPAGE = 0.97;
const ADDRESSES = isMainnet ?
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
  const { numerator } = prop;
  const { denominator } = prop;
  const numeratorBN = new BigNumber(numerator.toString());
  const denominatorBN = new BigNumber(denominator.toString());
  let scalarValue = new BigNumber(1);
  if (prop.scalar) {
    const scalarNumeratorBN = new BigNumber(prop.scalar.numerator.toString());
    const scalarDenominatorBN = new BigNumber(prop.scalar.denominator.toString());
    scalarValue = scalarNumeratorBN.dividedBy(scalarDenominatorBN);
  }

  return numeratorBN.dividedBy(denominatorBN).multipliedBy(scalarValue);
};

const mapOffer = (
  fromAsset: IExtendedAsset,
  toAsset: IExtendedAsset,
  allowanceSet: boolean,
  askRate: string,
): object => {
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

const getBackupRoute = async (
  fromAssetAddress: string,
  toAssetAddress: string,
): Promise<Route | undefined> => {
  let token1;
  let token2;
  let tokenMiddle;
  try {
    token1 = await Token.fetchData(chainId, fromAssetAddress);
    token2 = await Token.fetchData(chainId, toAssetAddress);
    tokenMiddle = await Token.fetchData(chainId, ADDRESSES.WETH);
  } catch (e) {
    reportOrWarn('Failed to fetch token data', e, 'error');
    return null;
  }

  let pair1;
  let pair2;
  try {
    pair1 = await Pair.fetchData(token1, tokenMiddle);
    pair2 = await Pair.fetchData(tokenMiddle, token2);
  } catch (e) {
    reportOrWarn('Pair unsupported', e, 'error');
    return null;
  }

  const route = new Route([pair1, pair2], token1);
  return route;
};

const getRoute = async (fromAsset: Asset, toAsset: Asset): Promise<Route | undefined> => {
  const {
    address: fromAddress, symbol: fromSymbol, name: fromName,
  } = fromAsset;
  const {
    address: toAddress, symbol: toSymbol, name: toName,
  } = toAsset;

  try {
    const token1 = await Token.fetchData(chainId, fromAddress, undefined, fromSymbol, fromName);
    const token2 = await Token.fetchData(chainId, toAddress, undefined, toSymbol, toName);
    const pair = await Pair.fetchData(token1, token2);

    const route = new Route([pair], token1);
    return route;
  } catch (e) {
    return getBackupRoute(fromAddress, toAddress);
  }
};

const getTrade = async (
  fromAssetAddress: string,
  fromQuantityInBaseUnits: string,
  route: Route,
): Promise<any> => {
  const fromToken = await Token.fetchData(chainId, toChecksumAddress(fromAssetAddress));
  const fromTokenAmount = new TokenAmount(fromToken, fromQuantityInBaseUnits);
  const trade = new Trade(route, fromTokenAmount, TradeType.EXACT_INPUT);
  return trade;
};

const getAskRate = (trade: Trade): string => {
  const excutionPriceBN = getBNFromNumeratorDenominator(trade.executionPrice);
  return excutionPriceBN.toFixed();
};

const parseAssets = (assets: Asset[]) => {
  assets.forEach(asset => {
    asset.address = toChecksumAddress(asset.symbol === 'ETH' ? WETH[chainId]?.address : asset.address);
    asset.code = asset.symbol;
  });
};

export const getOffer = async (
  allowances: Allowance[],
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
) => {
  parseAssets([fromAsset, toAsset]);
  const decimalsBN = new BigNumber(fromAsset.decimals);
  const quantityBN = new BigNumber(quantity);
  const fromAssetQuantityBaseUnits = convertToBaseUnits(decimalsBN, quantityBN);
  const route = await getRoute(fromAsset, toAsset);

  const trade = await getTrade(fromAsset.address, fromAssetQuantityBaseUnits.toFixed(), route);
  const askRate = getAskRate(trade);
  const allowanceSet = fromAsset.symbol === 'ETH' ? true : !!allowances.find(
    ({ fromAssetCode, toAssetCode }) => fromAssetCode === fromAsset.symbol && toAssetCode === toAsset.symbol,
  );
  const offer = mapOffer(fromAsset, toAsset, allowanceSet, askRate);
  return offer;
};

