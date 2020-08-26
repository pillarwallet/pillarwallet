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
import Storage from './storage';

const storage = Storage.getInstance('db');

function Socket() {
  this.socket = null;
}

Socket.prototype.sendMessage = function (data: string) {
  this.socket.send(data);
};

Socket.prototype.onopen = function () {
  return null;
};

Socket.prototype.onerror = function () {
  return null;
};

Socket.prototype.onMessage = function (callback: (data: any) => void) {
  this.socket.onmessage = function (event) {
    let data = {};
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      //
    }
    callback(data);
  };
};

Socket.prototype.init = async function () {
  const { user = {} } = await storage.get('user');
  this.socket = new WebSocket(`${getEnv().SOCKET_NOTIFICATIONS}${user.walletId}`);
  this.socket.onerror = this.onerror;
  this.socket.onopen = this.onopen;
};

let socketInstance;
const getSocketInstance = () => {
  if (!socketInstance) {
    socketInstance = new Socket();
  }
  return socketInstance;
};

export const SOCKET = getSocketInstance;
