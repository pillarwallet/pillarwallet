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
import axios from 'axios';

import type { Asset } from 'models/Asset';

import Toast from 'components/Toast';
import { convertToBaseUnits, convertToNominalUnits, reportLog } from 'utils/common';
import { getFixedQuantity } from 'utils/exchange';

const EXCHANGE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const EXCHANGE_URL = 'https://api.1inch.exchange/v2.0';

type CommonUrlParams = {
  safeFromAddress: string,
  safeToAddress: string,
  amount: string,
}

export const get1inchCommonUrlParams = (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: string,
): CommonUrlParams => {
  const quantityBN = new BigNumber(getFixedQuantity(quantity, fromAsset.decimals));
  const quantityInBaseUnits: BigNumber = convertToBaseUnits(
    new BigNumber(fromAsset.decimals), quantityBN,
  );
  const amount = quantityInBaseUnits.toFixed();

  const safeFromAddress = fromAsset.symbol === 'ETH'
    ? EXCHANGE_ETH_ADDRESS
    : fromAsset.address;

  const safeToAddress = toAsset.symbol === 'ETH'
    ? EXCHANGE_ETH_ADDRESS
    : toAsset.address;

  return { amount, safeToAddress, safeFromAddress };
};

const handle1inchError = (e: ?Object, errorMessage: string, toastMessage?: string): void => {
  if (toastMessage) {
    Toast.show({
      message: toastMessage,
      emoji: 'hushed',
    });
  }
  reportLog(errorMessage, e || null, 'warning');
};

export const getResponseData = async (url: string, errorMessage: string, toastMessage?: string): Object | null => {
  let response;
  try {
    response = await axios.get(url);
  } catch (e) {
    return handle1inchError(e, errorMessage, toastMessage);
  }
  if (!response?.data) {
    return handle1inchError(null, errorMessage, toastMessage);
  }
  return response.data;
};

export const parseAssets = (assets: Asset[]): Asset[] => assets.map((asset) => ({
  ...asset,
  code: asset.symbol,
}));

export const parseTokenAmount = (decimals: number, amount: string): BigNumber => convertToNominalUnits(
  new BigNumber(decimals),
  new BigNumber(amount),
);
