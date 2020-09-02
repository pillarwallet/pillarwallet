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
import axios, { AxiosError, AxiosResponse } from 'axios';
import { getEnv } from 'configs/envConfig';
import { API_REQUEST_TIMEOUT } from './api';


type SyntheticsConfig = {
  accessToken: string,
};

const buildApiUrl = (path: string) => {
  return `${getEnv().SYNTHETICS_URL}/${path}`;
};

class SyntheticsService {
  apiConfig: Object;

  init(config: SyntheticsConfig) {
    this.apiConfig = {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: API_REQUEST_TIMEOUT,
    };
  }

  /**
   * assetToRecipient – recipient address
   * assetToQuantity – asset quantity
   * assetTo – asset symbol code
   */
  createExchangeIntent(assetToRecipient: string, assetToQuantity: number, assetTo: string) {
    return axios.post(
      buildApiUrl('exchange/intent'),
      JSON.stringify({ assetToRecipient, assetToQuantity, assetTo }),
      this.apiConfig,
    )
      .then(this.handleResponse)
      .catch((error: AxiosError) => ({ error }));
  }

  commitTransaction(transactionId: string, transactionHash: string) {
    return axios.post(
      buildApiUrl('exchange/commit'),
      JSON.stringify({ transactionId, transactionHash }),
      this.apiConfig,
    )
      .then(this.handleResponse)
      .catch((error: AxiosError) => ({ error }));
  }

  getDataFromLiquidityPool() {
    return axios.get(buildApiUrl('exchange/data'), this.apiConfig)
      .then(this.handleResponse)
      .catch((error: AxiosError) => ({ error }));
  }

  handleResponse(response: AxiosResponse) {
    if (response.status === 200) return response.data;
    return Promise.reject(response.data);
  }
}

const syntheticsService = new SyntheticsService();

export default syntheticsService;
