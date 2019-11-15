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
import type {
  GetAddressHistoryParams,
  GetAddressHistoryResponse,
  GetAddressInfoParams,
  GetAddressInfoResponse,
  GetAddressTransactionsParams,
  GetAddressTxsResponse,
  GetTokenHistoryParams,
  GetTokenHistoryResponse,
  GetTokenInfoResponse,
  GetTokenPriceHistoryGroupedResponse,
  GetTxInfoResponse,
} from 'models/EthplorerSdkTypes';

export function parseEthValue(value: number): string {
  let parsed = new BigNumber(value * (10 ** 18));
  /**
   * ethplorer might return number values in format such as `1e-22`
   * and this would result as number with decimals when converting to wei
   * in this case we check if the value is below 1 (has decimals) and then
   * convert the number again (can be 2 times)
   */
  if (parsed.lt(1)) {
    parsed = new BigNumber(parsed * (10 ** 18));
    if (parsed.lt(1)) {
      parsed = new BigNumber(parsed * (10 ** 18));
    }
  }

  return new BigNumber(Math.floor(+parsed.toString())).toString();
}

class EthplorerSdk {
  apiKey: string;
  baseURL = 'https://api.ethplorer.io/';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /*
   * Get last token operations
   * @param {string} address of the token
   * @param {object} params the request parameters {[type], [limit], [timestamp]}
   */
  getTokenHistory(address?: string = '', params?: GetTokenHistoryParams): Promise<GetTokenHistoryResponse> {
    const paramsArray = [];
    if (params) {
      if (params.type) paramsArray.push(`type=${params.type}`);
      if (params.limit) paramsArray.push(`limit=${params.limit}`);
    }
    return this.pubRequest(`getTokenHistory/${address}`, paramsArray);
  }

  /*
   * Get token info
   * @param {string} address of the token
   */
  getTokenInfo(address: string): Promise<GetTokenInfoResponse> {
    return this.pubRequest(`getTokenInfo/${address}`);
  }

  /*
   * Get address info
   * @param {string} address of the token
   * @param {object} params the request parameters {[token], [showETHTotals]}
   */
  getAddressInfo(address: string, params?: GetAddressInfoParams): Promise<GetAddressInfoResponse> {
    const paramsArray = [];
    if (params) {
      if (params.token) paramsArray.push(`token=${params.token}`);
      if (params.showETHTotals) paramsArray.push(`showETHTotals=${params.showETHTotals}`);
    }
    return this.pubRequest(`getAddressInfo/${address}`, paramsArray);
  }

  /*
   * Get transaction info
   * @param {string} address of the transaction
   */
  getTxInfo(address: string): Promise<GetTxInfoResponse> {
    return this.pubRequest(`getTxInfo/${address}`);
  }

  /**
   * Get address tokens transaction history
   * @param {string} address the ETH address
   * @param {object} params the request parameters {[token], [type], [limit], [timestamp]}
   */
  getAddressHistory(address: string, params?: GetAddressHistoryParams): Promise<GetAddressHistoryResponse> {
    const paramsArray = [];
    if (params) {
      if (params.token) paramsArray.push(`token=${params.token}`);
      if (params.type) paramsArray.push(`type=${params.type}`);
      if (params.limit) paramsArray.push(`limit=${params.limit}`);
      if (params.timestamp) paramsArray.push(`timestamp=${params.timestamp}`);
    }
    return this.pubRequest(`getAddressHistory/${address}`, paramsArray);
  }

  /*
   * Get address ETH transactions
   * Note: method used for Ether transactions only
   * @param {string} address of the token
   * @param {object} params the request parameters {[limit], [timestamp], [showZeroValues]}
   */
  getAddressTransactions(address: string, params?: GetAddressTransactionsParams): Promise<GetAddressTxsResponse> {
    const paramsArray = [];
    if (params) {
      if (params.limit) paramsArray.push(`limit=${params.limit}`);
      if (params.timestamp) paramsArray.push(`timestamp=${params.timestamp}`);
      if (params.showZeroValues) paramsArray.push(`showZeroValues=${params.showZeroValues}`);
    }
    return this.pubRequest(`getAddressTransactions/${address}`, paramsArray)
      .then(history => history.map(tx => ({
        ...tx,
        value: parseEthValue(tx.value),
      })));
  }

  /*
   * Get grouped token price history
   * @param {string} address of the token
   * @param {number} show price history of specified days number only [365 days if not set]
   */
  getTokenPriceHistoryGrouped(address: number, period: number): Promise<GetTokenPriceHistoryGroupedResponse> {
    const paramsArray = [`period=${period}`];
    return this.pubRequest(`getTokenPriceHistoryGrouped/${address}`, paramsArray);
  }

  pubRequest(uri: string, params: string[] = []) {
    params.push(`apiKey=${this.apiKey}`);
    const url = `${this.baseURL}${uri}?${params.join('&')}`;
    return fetch(url).then(data => data.json());
  }
}

export default EthplorerSdk;
