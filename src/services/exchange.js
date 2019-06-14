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

export default class ExchangeService {
  ws: WebSocket;
  running: boolean;

  listen(accessToken: string) {
    this.stop();
    const timestamp = (new Date()).getTime() / 1000;
    const transport = 'polling'; // websocket
    // 123456PLRTST654321QA
    const wsUrl = `${EXCHANGE_URL
      .replace(/(https:\/\/)/gi, 'wss://')
      .replace(/(http:\/\/)/gi, 'ws://')}/?token=${accessToken}&EIO=3&transport=${transport}&t=${timestamp}`;
    /**
     * `EIO=3` the current version of the Engine.IO protocol
     * `transport=polling` transport being established
     * `t=123` a hashed timestamp for cache-busting
     */
    console.log('wsUrl: ', wsUrl);
    try {
      this.ws = new WebSocket(wsUrl);
      // this.ws.binaryType = 'arraybuffer';
      this.setRunning(true);
    } catch (e) {
      this.setRunning(false);
    }
  }

  send(data: Object, callback?: Function) {
    // this.ws.send(data);
    console.log('EXCHANGE SENDING: ', data);
    if (!this.isRunning()) return;
    if (typeof callback === 'function') callback();
  }

  stop(callback?: Function) {
    if (this.isRunning()) this.ws.close(1000, 'OK');
    this.setRunning(false);
    if (!this.ws) return;
    this.ws.onclose = () => {
      if (typeof callback === 'function') callback();
    };
  }


  onMessage(callback?: Function) {
    if (!this.isRunning()) return;
    this.ws.onmessage = async (data: Object) => {
      console.log('RECEIVED WS DATA: ', data);
      if (typeof callback === 'function') callback();
    };
  }

  onOpen(callback?: Function) {
    if (this.ws === undefined) return;
    this.ws.onopen = () => {
      console.log('EXCHANGE WS ON OPEN');
      this.setRunning(true);
      if (typeof callback === 'function') callback();
    };
    this.ws.onclose = () => {
      this.setRunning(false);
    };
    this.ws.onerror = () => {
      // console.log('EXCHANGE WS ON ERR', err.message);
      this.setRunning(false);
    };
  }

  setRunning(state: boolean) {
    this.running = state;
    if (!state) {
      delete this.ws;
    }
  }

  isRunning(): boolean {
    return this.running && typeof this.ws !== 'undefined';
  }
}
