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
import { BigNumber } from 'bignumber.js';
import axios from 'axios';
import { getEnv } from 'configs/envConfig';

// utils
import { getEthereumProvider, convertToNominalUnits, reportOrWarn } from 'utils/common';
import {
  EXCHANGE_URL,
  EXCHANGE_ADDRESS,
  get1inchCommonUrlParams,
  getResponseData,
  parseAssets,
} from 'utils/1inch';
import { parseOffer } from 'utils/exchange';

// services
import { encodeContractMethod } from 'services/assets';

// constants
import { PROVIDER_1INCH, ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';
import { ETH } from 'constants/assetsConstants';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { Offer } from 'models/Offer';
import type { Asset } from 'models/Asset';

import t from 'translations/translate';

/* eslint-disable i18next/no-literal-string */

const ethProvider = () => {
  return getEthereumProvider(getEnv().NETWORK_PROVIDER);
};

const getAllowanceSet = async (clientAddress: string, safeFromAddress: string, fromAsset: Asset) => {
  let allowanceSet = true;
  if (fromAsset.code !== ETH) {
    const assetContract = new ethers.Contract(safeFromAddress, ERC20_CONTRACT_ABI, ethProvider());
    const allowance: BigNumber = await assetContract.allowance(clientAddress, EXCHANGE_ADDRESS);
    allowanceSet = allowance.gt(0);
  }
  return allowanceSet;
};

export const get1inchOffer = async (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
  clientAddress: string,
): Promise<Offer | null> => {
  parseAssets([fromAsset, toAsset]);

  const { amount, safeToAddress, safeFromAddress } = get1inchCommonUrlParams(fromAsset, toAsset, quantity);

  const url =
    `${EXCHANGE_URL}/quote?fromTokenAddress=${safeFromAddress}&toTokenAddress=${safeToAddress}&amount=${amount}`;

  const response = await getResponseData(url, 'Failed to fetch 1inch offer');
  if (!response) return null;

  const allowanceSet = await getAllowanceSet(clientAddress, safeFromAddress, fromAsset);

  const fromTokenAmount = convertToNominalUnits(
    new BigNumber(fromAsset.decimals),
    new BigNumber(response.fromTokenAmount),
  );

  const toTokenAmount = convertToNominalUnits(
    new BigNumber(toAsset.decimals),
    new BigNumber(response.toTokenAmount),
  );

  const askRate = toTokenAmount.dividedBy(fromTokenAmount);
  const offer: Offer = parseOffer(fromAsset, toAsset, allowanceSet, askRate.toFixed(), PROVIDER_1INCH);
  return offer;
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
    `&amount=${amount}&disableEstimate=true&slippage=${ALLOWED_SLIPPAGE}&fromAddress=${clientSendAddress}`;

  const response = await getResponseData(url, 'Failed to create 1inch order', t('toast.failedToCreateOrder'));

  if (!response) return null;
  const txCount = await ethProvider().getTransactionCount(clientSendAddress);

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

export const create1inchAllowanceTx = async (fromAssetAddress: string, clientAddress: string): Promise<Object> => {
  if (!clientAddress) {
    reportOrWarn('Unable to set allowance', null, 'error');
    return null;
  }

  const abiFunction = [{
    name: 'approve',
    outputs: [{ type: 'bool', name: 'out' }],
    inputs: [{ type: 'address', name: '_spender' }, { type: 'uint256', name: '_value' }],
    constant: false,
    payable: false,
    type: 'function',
    gas: 38769,
  }];

  const encodedContractFunction = encodeContractMethod(
    abiFunction,
    'approve',
    [EXCHANGE_ADDRESS, ethers.constants.MaxUint256.toString()],
  );

  const txCount = await ethProvider().getTransactionCount(clientAddress);

  return {
    nonce: txCount.toString(),
    to: fromAssetAddress,
    gasLimit: '0',
    gasPrice: '0',
    chainId: '1',
    value: '0',
    data: encodedContractFunction,
  };
};

export const fetch1inchSupportedTokens = async (): Promise<string[]> => {
  const response = await axios.get('https://api.1inch.exchange/v1.1/tokens');
  const fetchedAssetsSymbols = [];
  if (response.status === 200 && response.data) {
    Object.keys(response.data).forEach(key => {
      if (response.data[key]) {
        fetchedAssetsSymbols.push(response.data[key].symbol);
      }
    });
  }
  return fetchedAssetsSymbols;
};
