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
import { EXCHANGE_URL, MOONPAY_API_URL, MOONPAY_KEY } from 'react-native-dotenv';
import SocketIO from 'socket.io-client';
import axios, { AxiosError, AxiosResponse } from 'axios';

// utils, services
import { extractJwtPayload, getRandomString } from 'utils/common';
import { API_REQUEST_TIMEOUT } from 'services/api';

// types
import type { OfferRequest, TokenAllowanceRequest } from 'models/Offer';


const executeCallback = (data?: any, callback?: Function) => {
  if (typeof callback === 'function') callback(data);
};

const buildApiUrl = (path: string, version?: string) => {
  if (version) return `${EXCHANGE_URL}/v${version}/${path}`;
  return `${EXCHANGE_URL}/${path}`;
};

const buildAPIConfig = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: API_REQUEST_TIMEOUT,
});

export default class ExchangeService {
  io: SocketIO;
  isConnected: boolean;
  apiConfig: Object;
  tokens: Object;
  ipInfo: Object;

  connect(accessToken: string, shapeshiftAccessToken?: string) {
    this.stop();
    this.tokens = {
      accessToken,
      shapeshiftAccessToken,
    };
    try {
      this.apiConfig = buildAPIConfig(accessToken);
      if (!!shapeshiftAccessToken
        && shapeshiftAccessToken !== '') {
        this.apiConfig.headers = {
          ...this.apiConfig.headers,
          token: shapeshiftAccessToken,
        };
      }
      const wsUrl = EXCHANGE_URL
        .replace(/(https:\/\/)/gi, 'wss://')
        .replace(/(http:\/\/)/gi, 'ws://');
      this.io = new SocketIO(`${wsUrl}:443`, {
        transports: ['websocket'],
        query: {
          token: accessToken,
        },
      });

      this.io.on('disconnect', () => {
        this.setConnected(false);
      });
      this.io.on('error', () => {
        this.setConnected(false);
      });
      this.io.on('connect', () => {
        this.setConnected(true);
      });
    } catch (e) {
      this.setConnected(false);
    }
  }

  stop() {
    this.setConnected(false);
    if (this.io) {
      this.io.close();
      this.io.on('close', () => {
        delete this.io;
      });
    }
  }

  setIPInfo(value: Object) {
    this.ipInfo = value;
  }

  setConnected(value: boolean) {
    this.isConnected = value;
  }

  connected(): boolean {
    return this.isConnected && !!this.io;
  }

  onOffers(callback?: Function) {
    /**
     * may not be connected yet, but event bind can already be done
     * if client is created, however, cannot put this as callback on connect event
     * as it's not recommended since it will be fired each time websocket is reconnected,
     * (see – https://socket.io/docs/client-api/#Event-%E2%80%98connect%E2%80%99)
     */
    if (!this.io) return;
    this.io.off('offers').on('offers', data => executeCallback(data, callback));
  }

  resetOnOffers() {
    if (!this.io) return;
    this.io.off('offers');
  }

  requestOffers(fromAssetAddress: string, toAssetAddress: string, quantity: number) {
    const urlPath = `offers?fromAssetAddress=${fromAssetAddress}&toAssetAddress=${toAssetAddress}&quantity=${quantity}`;
    return axios.get(buildApiUrl(urlPath, '2.0'), this.apiConfig)
      .then(({ data }: AxiosResponse) => data)
      .then(response => typeof response === 'string' && response.toLowerCase() === 'ok' ? {} : response)
      .catch((error: AxiosError) => ({ error }));
  }

  takeOffer(order: OfferRequest) {
    return axios.post(
      buildApiUrl('orders', '2.0'),
      JSON.stringify(order),
      this.apiConfig,
    )
      .then(({ data }: AxiosResponse) => data)
      .catch((error: AxiosError) => ({ error }));
  }

  setTokenAllowance(request: TokenAllowanceRequest) {
    return axios.post(
      buildApiUrl('orders/allowance', '2.0'),
      JSON.stringify(request),
      this.apiConfig,
    )
      .then(({ data }: AxiosResponse) => data)
      .catch((error: AxiosError) => ({ error }));
  }

  getShapeshiftAuthUrl() {
    const { sub: regId } = extractJwtPayload(this.tokens.accessToken);
    const sessionId = getRandomString();
    const urlPath = `authorize?sessionID=${sessionId}&regId=${regId}`;
    return buildApiUrl(urlPath);
  }

  getShapeshiftAccessToken(tokenHash: string) {
    const urlPath = `gettoken?hash=${tokenHash}`;
    return axios.get(buildApiUrl(urlPath), this.apiConfig)
      .then(({ data }: AxiosResponse) => data)
      .catch((error: AxiosError) => ({ error }));
  }

  getIPInformation() {
    if (!this.ipInfo) {
      return axios.get(`${MOONPAY_API_URL}/v3/ip_address?apiKey=${MOONPAY_KEY}`)
        .then(({ data }: AxiosResponse) => data)
        .then(data => {
          this.setIPInfo(data);
          return data;
        })
        .catch(() => ({}));
    }
    return Promise.resolve(this.ipInfo);
  }

  getMetaData() {
    return axios.get(buildApiUrl('shims/meta', '2.0'))
      .then(({ data }: AxiosResponse) => data)
      .then(({ data }) => data.items || [])
      .catch(() => []);
  }

  getProdAssetsAddress() {
    return axios.get(buildApiUrl('prod-assets'))
      .then(({ data }: AxiosResponse) => data)
      .catch(() => []);
  }

  getExchangeSupportedAssets() {
    return axios.get(buildApiUrl('shims/assets', '1.0'))
      .then(({ data }: AxiosResponse) => data)
      .catch(() => []);
  }
}
