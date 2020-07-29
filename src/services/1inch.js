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

import { ethers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';

import { getEthereumProvider, convertToNominalUnits } from 'utils/common';

import {
  EXCHANGE_URL,
  EXCHANGE_ADDRESS,
  get1inchCommonUrlParams,
  getResponseData,
  parseAssets,
} from 'utils/1inch';

import ERC20_ABI from 'abi/erc20.json';

const provider = getEthereumProvider(NETWORK_PROVIDER);

export const get1inchOffer = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientAddress: string,
): Promise<Object> => {
  parseAssets([fromAsset, toAsset]);

  const { amount, safeToAddress, safeFromAddress } = get1inchCommonUrlParams(fromAsset, toAsset, quantity);

  const url =
    `${EXCHANGE_URL}/quote?fromTokenAddress=${safeFromAddress}&toTokenAddress=${safeToAddress}&amount=${amount}`;

  const response = await getResponseData(url);
  if (!response) return null;

  let allowanceSet = true;
  if (fromAsset.symbol !== 'ETH') {
    const assetContract = new ethers.Contract(safeFromAddress, ERC20_ABI, provider);
    const allowance: BigNumber = await assetContract.allowance(clientAddress, EXCHANGE_ADDRESS);
    allowanceSet = allowance.gt(0);
  }

  const fromTokenAmount = convertToNominalUnits(
    new BigNumber(fromAsset.decimals),
    new BigNumber(response.fromTokenAmount),
  );

  const toTokenAmount = convertToNominalUnits(
    new BigNumber(toAsset.decimals),
    new BigNumber(response.toTokenAmount),
  );

  const askRate = toTokenAmount.dividedBy(fromTokenAmount);

  return {
    fromAsset,
    toAsset,
    allowanceSet,
    askRate: askRate.toFixed(),
    _id: 'ONEINCH-SHIM',
    description: '',
    minQuantity: '0',
    maxQuantity: '0',
    provider: 'ONEINCH-SHIM',
  };
};

export const create1inchOrder = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientSendAddress: string,
): Promise<Object> => {
  const { amount, safeToAddress, safeFromAddress } = get1inchCommonUrlParams(fromAsset, toAsset, quantity);

  const url =
    `${EXCHANGE_URL}/swap?fromTokenAddress=${safeFromAddress}&toTokenAddress=${safeToAddress}` +
    `&amount=${amount}&disableEstimate=true&slippage=3&fromAddress=${clientSendAddress}`;

  const response = await getResponseData(url);
  if (!response) return null;
  const txCount = await provider.getTransactionCount(clientSendAddress);

  const txObject = {
    data: response.data,
    nonce: txCount.toString(),
    to: response.to,
    gasLimit: response.gas || '0',
    gasPrice: response.gasPrice || '0',
    chainId: '1',
    value: response.value,
  };

  return {
    orderId: '-',
    sendToAddress: txObject.to,
    transactionObj: txObject,
  };
};
