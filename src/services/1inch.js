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
import {
  getEthereumProvider,
  convertToNominalUnits,
  reportLog,
  reportErrorLog,
} from 'utils/common';
import {
  EXCHANGE_URL,
  EXCHANGE_ADDRESS,
  get1inchCommonUrlParams,
  getResponseData,
  parseAssets,
} from 'utils/1inch';
import { parseOffer, createAllowanceTx } from 'utils/exchange';

// constants
import { PROVIDER_1INCH, ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';
import { ETH } from 'constants/assetsConstants';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { Offer } from 'models/Offer';
import type { Asset } from 'models/Asset';
import type { AllowanceTransaction } from 'models/Transaction';

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
  const [fromAssetParsed, toAssetParsed] = parseAssets([fromAsset, toAsset]);

  const { amount, safeToAddress, safeFromAddress } = get1inchCommonUrlParams(fromAssetParsed, toAssetParsed, quantity);

  const url =
    `${EXCHANGE_URL}/quote?fromTokenAddress=${safeFromAddress}&toTokenAddress=${safeToAddress}&amount=${amount}`;

  const response = await getResponseData(url, 'Failed to fetch 1inch offer');
  if (!response) return null;

  const allowanceSet = await getAllowanceSet(clientAddress, safeFromAddress, fromAssetParsed);

  const fromTokenAmount = convertToNominalUnits(
    new BigNumber(fromAssetParsed.decimals),
    new BigNumber(response.fromTokenAmount),
  );

  const toTokenAmount = convertToNominalUnits(
    new BigNumber(toAssetParsed.decimals),
    new BigNumber(response.toTokenAmount),
  );

  const askRate = toTokenAmount.dividedBy(fromTokenAmount);

  return parseOffer(fromAssetParsed, toAssetParsed, allowanceSet, askRate.toFixed(), PROVIDER_1INCH);
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

  if (!response || !response?.tx) {
    reportErrorLog('Failed to create 1inch order after successful response', { response });
    return null;
  }

  const { data, to, value } = response.tx;

  return {
    orderId: '-',
    sendToAddress: to,
    transactionObj: {
      data,
      to,
      value,
    },
  };
};

export const create1inchAllowanceTx =
  async (fromAssetAddress: string, clientAddress: string): Promise<AllowanceTransaction | null> => {
    const allowanceTx = await createAllowanceTx(fromAssetAddress, clientAddress, EXCHANGE_ADDRESS);
    return allowanceTx;
  };

export const fetch1inchSupportedTokens = async (): Promise<string[]> => {
  const response = await axios.get(`${EXCHANGE_URL}/tokens`);

  if (!response?.data?.tokens) {
    reportLog('fetch1inchSupportedTokens API call failed', {
      responseStatus: response?.status,
      responseData: response?.data,
    });
    return [];
  }

  return (Object.values(response.data.tokens): any).map(({ symbol }) => symbol);
};
