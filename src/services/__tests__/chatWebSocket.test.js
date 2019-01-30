// @flow
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
  const fakeHost = 'wss://localhost:3292';
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
    mockServer = new Server(fakeURL);
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
    await websocket1.listen();
    await websocket2.listen();
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

    await websocket1.listen();
    await websocket2.listen();

    const requestId = (new Date()).getTime();
    const mockRequest = await websocket1.prepareRequest(
      requestId,
      'PUT',
      '/v1/messages/websocket1',
      JSON.stringify({
        username: 'websocket1',
        message: 'hello there',
        userId: null,
        userConnectionAccessToken: null,
      }),
      ['content-type:application/json;'],
    ) || new Uint8Array(0);

    websocket1.onMessage((msgs) => {
      expect(msgs).toBeTruthy();
      if (msgs.type === 2) {
        done();
      }
    });

    websocket1.onOpen(() => {
      websocket2.onOpen(() => {
        setTimeout(() => {
          websocket2.send(mockRequest);
        }, 50);
      });
    });
  });
});
