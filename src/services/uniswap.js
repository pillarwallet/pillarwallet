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
  Token,
  Pair,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  WETH,
} from '@uniswap/sdk';
import { toChecksumAddress } from '@netgum/utils';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';

import { reportOrWarn, convertToBaseUnits, getEthereumProvider } from 'utils/common';
import {
  chainId,
  ADDRESSES,
  mapOffer,
  getAskRate,
  parseAssets,
  getExpectedOutput,
  applyAllowedSlippage,
  getDeadline,
  swapExactTokensToTokens,
  swapExactTokensToEth,
  swapExactEthToTokens,
  generateTxObject,
} from 'utils/uniswap';

import type { Asset } from 'models/Asset';
import type { Allowance } from 'models/Offer';

const ethProvider = getEthereumProvider(NETWORK_PROVIDER);

const getBackupRoute = async (
  fromAssetAddress: string,
  toAssetAddress: string,
): Promise<Route> => {
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

const getRoute = async (fromAsset: Asset, toAsset: Asset): Promise<Route> => {
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

export const getUniswapOffer = async (
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

async function getUniswapOrderData(
  fromAsset: Asset,
  toAsset: Asset,
  fromAssetQuantityBaseUnits: string,
  toAssetDecimals: string,
): Promise<{ path: string[], expectedOutputBaseUnits: BigNumber }> {
  let route = await getRoute(fromAsset, toAsset);
  if (!route && (
    fromAsset.address.toLowerCase() === ADDRESSES.WETH.toLowerCase()
      || toAsset.address.toLowerCase() === ADDRESSES.WETH.toLowerCase()
  )) {
    reportOrWarn('Unable to find a possible route', null, 'error');
  }
  if (!route) {
    route = await getBackupRoute(fromAsset.address, toAsset.address);
    if (!route) {
      reportOrWarn('Unable to find a possible route', null, 'error');
    }
  }
  const trade = await getTrade(fromAsset.address, fromAssetQuantityBaseUnits, route);
  const expectedOutput: BigNumber = getExpectedOutput(trade);
  const toAssetDecimalsBN = new BigNumber(toAssetDecimals);
  const expectedOutputWithSlippage = applyAllowedSlippage(expectedOutput, toAssetDecimalsBN);
  const expectedOutputWithSlippageBaseUnits = convertToBaseUnits(toAssetDecimalsBN, expectedOutputWithSlippage);
  const mappedPath: string[] = route.path.map(p => p.address);

  return {
    path: mappedPath,
    expectedOutputBaseUnits: expectedOutputWithSlippageBaseUnits,
  };
}

export const createUniswapOrder = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientSendAddress: string,
): Promise<Object> => {
  if (!fromAsset || !toAsset) {
    reportOrWarn('Invalid assets', null, 'error');
  }

  const decimalsBN = new BigNumber(fromAsset.decimals);
  const quantityBN = new BigNumber(quantity);
  const quantityBaseUnits = convertToBaseUnits(decimalsBN, quantityBN);

  let txData = '';
  let txValue = '0';
  if (fromAsset.code !== 'ETH' && toAsset.code !== 'ETH') {
    const { path, expectedOutputBaseUnits } = await getUniswapOrderData(
      fromAsset,
      toAsset,
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );
    const deadline = getDeadline();

    txData = swapExactTokensToTokens(
      quantityBaseUnits.toFixed(),
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  } else if (fromAsset.code === 'ETH' && toAsset.code !== 'ETH') {
    txValue = quantityBaseUnits.toFixed();
    const { path, expectedOutputBaseUnits } = await getUniswapOrderData(
      WETH[chainId],
      toAsset,
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );

    const deadline = getDeadline();

    txData = swapExactEthToTokens(
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  } else if (fromAsset.code !== 'ETH' && toAsset.code === 'ETH') {
    const { path, expectedOutputBaseUnits } = await getUniswapOrderData(
      fromAsset,
      WETH[chainId],
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );

    const deadline = getDeadline();

    txData = swapExactTokensToEth(
      quantityBaseUnits.toFixed(),
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  }

  if (!txData) {
    reportOrWarn('Unable to create order', null, 'error');
  }

  const txCount = await ethProvider.getTransactionCount(clientSendAddress);
  const txObject = generateTxObject(
    txCount.toString(),
    ADDRESSES.router,
    txValue,
    txData,
  );

  return {
    orderId: '-',
    sendToAddress: txObject.to,
    transactionObj: txObject,
  };
};
