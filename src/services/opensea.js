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
import { getEnv } from 'configs/envConfig';

// constants
import { API_REQUEST_TIMEOUT } from 'constants/appConstants';

// utils
import httpRequest from 'utils/httpRequest';
import { reportErrorLog } from 'utils/common';
import type {
  OpenSeaAsset,
  OpenSeaHistoryItem,
} from 'models/OpenSea';

const requestConfig = {
  timeout: API_REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': getEnv().OPEN_SEA_API_KEY,
  },
};

const getOpenSeaAssets = (
  url: string,
  paginatedData: Array<Object> = [],
  limit: number = 50,
  offset: number = 0,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: responseData } = await httpRequest.get(`${url}&limit=${limit}&offset=${offset}`, requestConfig);
      const assets = responseData?.assets || [];
      const updatedPaginatedData = [...paginatedData, ...assets];
      const newOffset = offset + limit;

      const results = assets.length === limit
        ? await getOpenSeaAssets(url, updatedPaginatedData, limit, newOffset)
        : updatedPaginatedData;

      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
};

/* eslint-disable i18next/no-literal-string */
export const fetchCollectibles = async (
  walletAddress: string,
): Promise<?OpenSeaAsset[]> => {
  if (!walletAddress) return null;

  const url = `${getEnv().OPEN_SEA_API}/assets/?owner=${walletAddress}`;

  return getOpenSeaAssets(url).catch((error) => {
    reportErrorLog('fetchCollectibles failed', { walletAddress, error });
    return null;
  });
};

export const fetchCollectiblesTransactionHistory = async (): Promise<?OpenSeaHistoryItem[]> => {
  /**
   * Deprecated entirely. NFTs should now be read
   * from Etherspot in future.
   */

  return null;

  /**
   * The below is future reference.
   */

  // try {
  //   const url = `${getEnv().OPEN_SEA_API}/events/` +
  //     `?account_address=${walletAddress}` +
  //     '&event_type=transfer';

  //   const { data } = await httpRequest.get(url, requestConfig);

  //   return data?.asset_events; // eslint-disable-line camelcase
  // } catch (error) {
  //   reportErrorLog('fetchCollectiblesTransactionHistory failed', { walletAddress, error });
  //   return null;
  // }
};
/* eslint-enable i18next/no-literal-string */
