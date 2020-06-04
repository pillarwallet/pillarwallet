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
import { WebSocket, Server } from 'mock-socket';

global.WebSocket = WebSocket;

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

describe('chatWebSocket service', () => {
  const fakeHost = 'https://localhost:3292';
  const fakeURL = `${fakeHost}/v1/websocket/`;
  let mockServer;
  let websocket1;
  let websocket2;
  const credentials1 = {
    host: fakeHost,
    accessToken: 'uniqueAccessToken1',
  };

  const credentials2 = {
    host: fakeHost,
    accessToken: 'uniqueAccessToken2',
  };

  beforeEach(() => {
    mockServer = new Server(fakeURL.replace('https', 'wss'));
    websocket1 = new ChatWebSocketService(credentials1);
    websocket2 = new ChatWebSocketService(credentials2);
  });

  afterEach(() => {
    websocket1.stop();
    websocket2.stop();
    mockServer.stop();
  });

  it('Should successfully listen on two instances of websockets with the given credentials', async () => {
    mockServer.on('connection', socket => {
      socket.on('message', data => {
        socket.send(data);
      });
    });
    websocket1.start();
    websocket2.start();
    expect(websocket1.ws).toBeTruthy();
    expect(websocket2.ws).toBeTruthy();
    expect(websocket1.running).toBe(true);
    expect(websocket2.running).toBe(true);
  });

  it('Should successfully exchange, encode and decode a signal server message payload', async (done) => {
    const socketConnections = [];
    mockServer.on('connection', socket => {
      socketConnections.push({
        socketKey: socket.protocol,
        ws: socket,
      });
      socket.on('message', data => {
        if (data.toString().search('keepalive') > -1) {
          socket.send(toArrayBuffer(data));
        } else {
          socketConnections[0].ws.send(toArrayBuffer(data));
        }
      });
    });

    const requestId = (new Date()).getTime();

    let mockRequest;
    try {
      mockRequest = await websocket1.prepareRequest(
        requestId,
        'PUT',
        '/v1/messages/websocket1',
        JSON.stringify({
          username: 'websocket1',
          message: 'hello there',
          userId: null,
          targetUserId: null,
        }),
      );
    } catch (e) {
      //
    }

    expect(mockRequest).toBeTruthy();

    websocket1.start((message) => {
      expect(message).toBeTruthy();
      if (message.type === 2) {
        done();
      }
    });

    websocket2.start();
    if (mockRequest) websocket2.send(mockRequest);
  });
});
