// @flow
import { SOCKET_NOTIFICATIONS } from 'react-native-dotenv';
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
  this.socket = new WebSocket(`${SOCKET_NOTIFICATIONS}${user.walletId}`);
  this.socket.onerror = this.onerror;
  this.socket.onopen = this.onopen;
};

export const SOCKET = new Socket();
