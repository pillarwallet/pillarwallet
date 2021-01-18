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
  Route,
  Trade,
  TokenAmount,
  TradeType,
  WETH,
  Fetcher,
} from '@uniswap/sdk';
import { ethers } from 'ethers';
import { toChecksumAddress } from '@netgum/utils';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';
import axios, { AxiosResponse } from 'axios';

// utils
import {
  reportOrWarn,
  reportLog,
  convertToBaseUnits,
  getEthereumProvider,
  reportErrorLog,
} from 'utils/common';
import {
  chainId,
  ADDRESSES,
  parseAssets,
  getExpectedOutput,
  applyAllowedSlippage,
  getDeadline,
  swapExactTokensToTokens,
  swapExactTokensToEth,
  swapExactEthToTokens,
  generateTxObject,
} from 'utils/uniswap';
import { parseOffer, createAllowanceTx } from 'utils/exchange';

// services
import { defaultAxiosRequestConfig } from 'services/api';

// models
import type { Asset } from 'models/Asset';
import type { Offer } from 'models/Offer';
import type { AllowanceTransaction } from 'models/Transaction';

// constants
import { PROVIDER_UNISWAP } from 'constants/exchangeConstants';
import { ETH } from 'constants/assetsConstants';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

const ethProvider = getEthereumProvider(getEnv().NETWORK_PROVIDER);

const getBackupRoute = async (
  fromAssetAddress: string,
  toAssetAddress: string,
): Promise<Route> => {
  let token1;
  let token2;
  let tokenMiddle;
  try {
    token1 = await Fetcher.fetchTokenData(chainId, fromAssetAddress, ethProvider);
    token2 = await Fetcher.fetchTokenData(chainId, toAssetAddress, ethProvider);
    tokenMiddle = await Fetcher.fetchTokenData(chainId, ADDRESSES.WETH, ethProvider);
  } catch (e) {
    reportLog('Uniswap: failed to fetch token data', e, 'warning');
    return null;
  }

  let pair1;
  let pair2;
  try {
    pair1 = await Fetcher.fetchPairData(token1, tokenMiddle, ethProvider);
    pair2 = await Fetcher.fetchPairData(tokenMiddle, token2, ethProvider);
  } catch (e) {
    reportLog('Pair unsupported by Uniswap', e, 'warning');
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
    const token1 = await Fetcher.fetchTokenData(chainId, fromAddress, ethProvider, fromSymbol, fromName);
    const token2 = await Fetcher.fetchTokenData(chainId, toAddress, ethProvider, toSymbol, toName);
    const pair = await Fetcher.fetchPairData(token1, token2, ethProvider);
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
): Promise<Trade> => {
  const fromToken = await Fetcher.fetchTokenData(chainId, toChecksumAddress(fromAssetAddress), ethProvider);
  const fromTokenAmount = new TokenAmount(fromToken, fromQuantityInBaseUnits);
  const trade = new Trade(route, fromTokenAmount, TradeType.EXACT_INPUT);
  return trade;
};

const getAllowanceSet = async (clientAddress: string, fromAsset: Asset): Promise<boolean> => {
  if (fromAsset.code === ETH) return true;
  const assetContract = new ethers.Contract(fromAsset.address, ERC20_CONTRACT_ABI, ethProvider);
  const allowance: BigNumber = await assetContract.allowance(clientAddress, ADDRESSES.router);
  return allowance.gt(0);
};

export const getUniswapOffer = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientAddress: string,
): Promise<Offer | null> => {
  const [fromAssetParsed, toAssetParsed] = parseAssets([fromAsset, toAsset]);

  const decimalsBN = new BigNumber(fromAssetParsed.decimals);
  const quantityBN = new BigNumber(quantity);
  const fromAssetQuantityBaseUnits = convertToBaseUnits(decimalsBN, quantityBN);
  const route: ?Route = await getRoute(fromAssetParsed, toAssetParsed);
  if (!route) return null;
  const trade: Trade = await getTrade(fromAssetParsed.address, fromAssetQuantityBaseUnits.toFixed(), route);
  const expectedOutput = getExpectedOutput(trade);
  const askRate = expectedOutput.dividedBy(quantityBN);
  const allowanceSet = await getAllowanceSet(clientAddress, fromAssetParsed);

  return parseOffer(fromAssetParsed, toAssetParsed, allowanceSet, askRate, PROVIDER_UNISWAP);
};

const getUniswapOrderData = async (
  fromAsset: Asset,
  toAsset: Asset,
  fromAssetQuantityBaseUnits: string,
  toAssetDecimals: string,
): Promise<{ path: string[], expectedOutputBaseUnits: BigNumber, expectedOutputRaw: string } | null> => {
  let route = await getRoute(fromAsset, toAsset);
  if (!route && (
    fromAsset.address.toLowerCase() === ADDRESSES.WETH.toLowerCase()
      || toAsset.address.toLowerCase() === ADDRESSES.WETH.toLowerCase()
  )) {
    reportLog('Unable to find a possible route', null, 'error');
  }
  if (!route) {
    route = await getBackupRoute(fromAsset.address, toAsset.address);
    if (!route) {
      reportLog('Unable to find a possible route', null, 'error');
      return null;
    }
  }
  const trade = await getTrade(fromAsset.address, fromAssetQuantityBaseUnits, route);
  if (!trade) return null;
  const expectedOutput: BigNumber = getExpectedOutput(trade);
  const toAssetDecimalsBN = new BigNumber(toAssetDecimals);
  const expectedOutputWithSlippage = applyAllowedSlippage(expectedOutput, toAssetDecimalsBN);
  const expectedOutputWithSlippageBaseUnits = convertToBaseUnits(toAssetDecimalsBN, expectedOutputWithSlippage);
  const mappedPath: string[] = route.path.map(p => p.address);

  return {
    path: mappedPath,
    expectedOutputRaw: expectedOutput.toString(), // no slippage applied
    expectedOutputBaseUnits: expectedOutputWithSlippageBaseUnits,
  };
};

export const createUniswapOrder = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientSendAddress: string,
): Promise<Object | null> => {
  if (!fromAsset || !toAsset) {
    reportOrWarn('Invalid assets', null, 'error');
    return null;
  }

  const decimalsBN = new BigNumber(fromAsset.decimals);
  const quantityBN = new BigNumber(quantity);
  const quantityBaseUnits = convertToBaseUnits(decimalsBN, quantityBN);

  let txData = '';
  let txValue = '0';
  let expectedOutput;
  if (fromAsset.code !== ETH && toAsset.code !== ETH) {
    const orderData = await getUniswapOrderData(
      fromAsset,
      toAsset,
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );
    if (!orderData) return null;
    const { path, expectedOutputBaseUnits, expectedOutputRaw } = orderData;
    expectedOutput = expectedOutputRaw;

    const deadline = getDeadline();

    txData = swapExactTokensToTokens(
      quantityBaseUnits.toFixed(),
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  } else if (fromAsset.code === ETH && toAsset.code !== ETH) {
    txValue = quantityBaseUnits.toFixed();
    const orderData = await getUniswapOrderData(
      WETH[chainId],
      toAsset,
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );
    if (!orderData) return null;
    const { path, expectedOutputBaseUnits, expectedOutputRaw } = orderData;
    expectedOutput = expectedOutputRaw;

    const deadline = getDeadline();

    txData = swapExactEthToTokens(
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  } else if (fromAsset.code !== ETH && toAsset.code === ETH) {
    const orderData = await getUniswapOrderData(
      fromAsset,
      WETH[chainId],
      quantityBaseUnits.toFixed(),
      toAsset.decimals.toString(),
    );
    if (!orderData) return null;
    const { path, expectedOutputBaseUnits, expectedOutputRaw } = orderData;
    expectedOutput = expectedOutputRaw;

    const deadline = getDeadline();

    txData = swapExactTokensToEth(
      quantityBaseUnits.toFixed(),
      expectedOutputBaseUnits.toFixed(),
      path,
      clientSendAddress,
      deadline.toString(),
    );
  }

  if (!txData || !expectedOutput) {
    reportOrWarn('Unable to create order', null, 'error');
    return null;
  }

  const txObject = generateTxObject(
    ADDRESSES.router,
    txValue,
    txData,
  );
  return {
    orderId: '-',
    sendToAddress: txObject.to,
    transactionObj: txObject,
    expectedOutput,
  };
};

export const createUniswapAllowanceTx =
  async (fromAssetAddress: string, clientAddress: string): Promise<AllowanceTransaction | null> => {
    const allowanceTx = await createAllowanceTx(fromAssetAddress, clientAddress, ADDRESSES.router);
    return allowanceTx;
  };

export const fetchUniswapSupportedTokens = (): Promise<?string[]> => axios
  .get(getEnv().UNISWAP_CACHED_SUBGRAPH_ASSETS_URL, defaultAxiosRequestConfig)
  .then(({ data: responseData }: AxiosResponse) => {
    if (!responseData) {
      reportErrorLog('fetchUniswapSupportedTokens failed: unexpected response', { response: responseData });
      return null;
    }

    // response is CSV
    return responseData.split(',');
  })
  .catch((error) => {
    reportErrorLog('fetchUniswapSupportedTokens failed: API request error', { error });
    return null;
  });
