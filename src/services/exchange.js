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

const executeCallback = (data?: any, callback?: Function) => {
  if (typeof callback === 'function') callback(data);
};

const buildApiUrl = (path: string) => {
  return `${EXCHANGE_URL}/${path}`;
};

export default class ExchangeService {
  io: SocketIO;
  running: boolean;
  apiConfig: Object;

  listen(accessToken: string) {
    this.stop();
    // 123456PLRTST654321QA
    // const wsUrl = `${EXCHANGE_URL
    //   .replace(/(https:\/\/)/gi, 'wss://')
    //   .replace(/(http:\/\/)/gi, 'ws://')}`;
    try {
      accessToken = '123456PLRTST654321QA';
      this.apiConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
      this.io = new SocketIO(EXCHANGE_URL, {
        query: {
          token: accessToken,
        },
        // reconnection: false,
      });
      this.io.on('disconnect', () => {
        this.setRunning(false);
      });
      this.io.on('error', (err) => {
        console.log('EXCHANGE WS ON ERR', err.message);
        this.setRunning(false);
      });
      this.setRunning(true);
    } catch (e) {
      console.log('errr', e);
      this.setRunning(false);
    }
  }

  send(data: Object, callback?: Function) {
    // this.io.send(data);
    console.log('EXCHANGE SENDING: ', data);
    if (!this.isRunning()) return;
    executeCallback(data, callback);
  }

  stop(callback?: Function) {
    this.setRunning(false);
    if (this.io) {
      this.io.close();
      this.io.on('close', data => executeCallback(data, callback));
    }
  }

  onConnect(callback?: Function) {
    if (!this.isRunning()) return;
    this.io.on('connect', data => {
      this.setRunning(true);
      executeCallback(data, callback);
    });
  }

  setRunning(state: boolean) {
    this.running = state;
    if (!state) {
      delete this.io;
    }
  }

  isRunning(): boolean {
    return this.running && this.io && typeof this.io !== 'undefined';
  }

  onOffers(callback?: Function) {
    if (!this.isRunning()) return;
    this.io.on('offers', data => executeCallback(data, callback));
  }

  async requestOffers(buyToken: string, sellToken: string) {
    const urlPath = `offers?name=${buyToken}-${sellToken}`;
    return fetch(buildApiUrl(urlPath), this.apiConfig)
      .then(async response => {
        const body = await response.text();
        return body.toLowerCase() === 'ok'
          ? {}
          : response.json();
      })
      .catch(error => ({ error }));
  }
}
