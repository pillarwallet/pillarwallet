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
import ChatWebSocketService from 'services/chatWebSocket';
import ChatService from 'services/chat';
import { WebSocket, Server } from 'mock-socket';
import { SENTRY_DSN } from 'react-native-dotenv';
import { SignalClient } from 'rn-signal-protocol-messaging';


SignalClient.prepareApiBody = () => {
  return Promise.resolve(JSON.stringify({
    username: 'websocket1',
    message: 'hello there',
    userId: null,
    targetUserId: null,
  }));
};

global.WebSocket = WebSocket;
global.SignalClient = SignalClient;

describe('chat service', () => {
  const fakeHost = 'https://localhost:3292';
  const fakeURL = `${fakeHost}/v1/websocket/`;
  const client = SignalClient;
  let mockServer;
  let websocket;
  const credentials = {
    host: fakeHost,
    accessToken: 'uniqueAccessToken1',
    username: 'username1',
    fcmToken: 'fcmToken123',
    isSendingLogs: false,
    errorTrackingDSN: '',
  };
  const chat = new ChatService();

  const chatMock = {
    ...chat,
    init: jest.fn().mockImplementation(async (creds) => {
      websocket = new ChatWebSocketService(creds);
      creds.errorTrackingDSN = SENTRY_DSN;
      creds.isSendingLogs = false;
      websocket.init();
      return client.init(credentials);
    }),
    getWebSocketInstance: () => {
      return websocket;
    },
    sendMessage: chat.sendMessage,
    deleteMessage: chat.deleteMessage,
  };

  beforeEach(() => {
    mockServer = new Server(fakeURL.replace('https', 'wss'));
  });

  afterEach(() => {
    websocket.stop();
    mockServer.stop();
  });

  it('Should successfully initialize chat service with websockets', async (done) => {
    mockServer.on('connection', socket => {
      expect(socket).toBeTruthy();
      done();
    });

    await chatMock.init(credentials)
      .then(() => chatMock.client.registerAccount())
      .then(() => chatMock.client.setFcmId(credentials.fcmToken))
      .catch(() => null);
  });

  it('Should successfully send a chat message to a target', async (done) => {
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        expect(data).toBeTruthy();
        if (data.toString().search('keepalive') === -1) {
          done();
        }
      });
    });

    await chatMock.init(credentials)
      .then(() => chatMock.client.registerAccount())
      .then(() => chatMock.client.setFcmId(credentials.fcmToken))
      .catch(() => null);

    chatMock.getWebSocketInstance = () => {
      return websocket;
    };

    const params = {
      username: 'targetUsername',
      userId: null,
      targetUserId: null,
      sourceIdentityKey: null,
      targetIdentityKey: null,
      message: 'Hello there',
    };
    await chatMock.sendMessage('chat', params, false);
  });
});
