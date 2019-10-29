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
import { SYNTHETICS_URL } from 'react-native-dotenv';

type SyntheticsConfig = {
  accessToken: string,
};

const buildApiUrl = (path: string) => {
  return `${SYNTHETICS_URL}/${path}`;
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
    };
  }

  /**
   * assetToRecipient – recipient address
   * assetToQuantity – asset quantity
   * assetTo – asset symbol code
   */
  createExchangeIntent(assetToRecipient: string, assetToQuantity: number, assetTo: string) {
    const urlPath = 'exchange/intent';
    const body = JSON.stringify({
      assetToRecipient,
      assetToQuantity,
      assetTo,
    });
    return fetch(buildApiUrl(urlPath), {
      ...this.apiConfig,
      method: 'POST',
      body,
    })
      .then(this.handleResponse)
      .catch(error => ({ error }));
  }

  commitTransaction(transactionId: string, transactionHash: string) {
    const urlPath = 'exchange/commit';
    const body = JSON.stringify({ transactionId, transactionHash });
    return fetch(buildApiUrl(urlPath), {
      ...this.apiConfig,
      method: 'POST',
      body,
    })
      .then(this.handleResponse)
      .catch(error => ({ error }));
  }

  getDataFromLiquidityPool() {
    const urlPath = 'exchange/data';
    return fetch(buildApiUrl(urlPath))
      .then(this.handleResponse)
      .catch(error => ({ error }));
  }

  async handleResponse(responseResult: any) {
    const response = await responseResult.json();
    if (response.statusCode === 200) return response;
    return Promise.reject(response);
  }
}

const syntheticsService = new SyntheticsService();

export default syntheticsService;
