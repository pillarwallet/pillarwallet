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

import { convertToBaseUnits, reportOrWarn } from 'utils/common';

const EXCHANGE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const EXCHANGE_URL = 'https://api.1inch.exchange/v1.1';
export const SUPPORTED_API_VERSIONS = 'v2.0';
export const EXCHANGE_ADDRESS = '0xe4c9194962532feb467dce8b3d42419641c6ed2e';

type CommonUrlParams = {
  safeFromAddress: string,
  safeToAddress: string,
  amount: string,
}

export const get1inchCommonUrlParams = (
  fromAsset: Asset,
  toAsset: Asset,
  quantity: number | string,
): CommonUrlParams => {
  const quantityBN = new BigNumber(quantity);
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

export const getResponseData = async (url: string): Object => {
  // TODO this is ugly
  let response;
  try {
    response = await axios.get(url);
  } catch (e) {
    reportOrWarn('Unable to fetch offers', e, 'error');
  }
  if (!response || !response.data) {
    reportOrWarn('Unable to fetch offers', null, 'error');
  }
  return response.data;
};

export const parseAssets = (assets: Asset[]) => {
  assets.forEach(asset => {
    asset.code = asset.symbol;
  });
};
