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
import { EXCHANGE_URL } from 'react-native-dotenv';
import SocketIO from 'socket.io-client';

import type { OfferRequest } from 'models/Offer';
import { getRandomString } from 'utils/common';

const executeCallback = (data?: any, callback?: Function) => {
  if (typeof callback === 'function') callback(data);
};

const buildApiUrl = (path: string) => {
  return `${EXCHANGE_URL}/${path}`;
};

export default class ExchangeService {
  io: SocketIO;
  isConnected: boolean;
  apiConfig: Object;

  listen(accessToken: string, shapeshiftAccessToken?: string) {
    this.stop();
    try {
      this.apiConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      };
      if (!!shapeshiftAccessToken
        && shapeshiftAccessToken !== '') {
        this.apiConfig.headers = {
          ...this.apiConfig.headers,
          token: shapeshiftAccessToken,
        };
      }
      this.io = new SocketIO(EXCHANGE_URL, {
        query: {
          token: accessToken,
        },
      });
      this.io.on('disconnect', err => {
        console.log('exchange on disconnect: ', err);
        this.setConnected(false);
      });
      this.io.on('error', (err) => {
        console.log('exchange on error', err);
        this.setConnected(false);
      });
      this.setConnected(true);
    } catch (e) {
      console.log('exchange service error: ', e);
      this.setConnected(false);
    }
  }

  stop(callback?: Function) {
    this.setConnected(false);
    if (this.io) {
      this.io.close();
      this.io.on('close', data => executeCallback(data, callback));
    }
  }

  onConnect(callback?: Function) {
    if (!this.connected()) return;
    this.io.on('connect', data => {
      this.setConnected(true);
      executeCallback(data, callback);
    });
  }

  setConnected(value: boolean) {
    this.isConnected = value;
    if (!this.isConnected) {
      delete this.io;
    }
  }

  connected(): boolean {
    return this.isConnected && this.io;
  }

  onOffers(callback?: Function) {
    if (!this.connected()) return;
    this.io.on('offers', data => executeCallback(data, callback));
  }

  requestOffers(fromAssetCode: string, toAssetCode: string) {
    const urlPath = `offers?name=${fromAssetCode}-${toAssetCode}`;
    return fetch(buildApiUrl(urlPath), this.apiConfig)
      .then(response => response.text())
      .then(response => response.toLowerCase() === 'ok' ? {} : response.json())
      .catch(error => ({ error }));
  }

  takeOffer(order: OfferRequest) {
    return fetch(buildApiUrl('orders'), {
      ...this.apiConfig,
      method: 'POST',
      body: JSON.stringify(order),
    })
      .then(response => response.json())
      .catch(error => ({ error }));
  }

  getShapeshiftAuthUrl() {
    const sessionId = getRandomString();
    const urlPath = `authorize?sessionID=${sessionId}`;
    return buildApiUrl(urlPath);
  }
}
