// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import protobufjs from 'protobufjs';

const subProtocolProtobufJson = require('models/protobuf/SubProtocol.json');

const WEBSOCKET_MESSAGE_TYPES = {
  REQUEST: 1,
  RESPONSE: 2,
};

export default class ChatWebSocket {
  credentials: Object;
  WebSocketMessage: Object;
  ws: WebSocket;
  running: boolean;

  constructor(credentials: Object) {
    this.credentials = credentials;
    const root = protobufjs.Root.fromJSON(subProtocolProtobufJson);
    this.WebSocketMessage = root.lookupType('signal.websocket.WebSocketMessage');
    this.running = false;
  }

  listen() {
    if (this.isRunning()) this.ws.close();
    this.setRunning(false);
    const wsUrl = `ws://${this.credentials.host
      .replace(/https:\/\//gi, '')
      .replace(/http:\/\//gi, '')
      .replace(/\/$/, '')}/v1/websocket/?login=${this.credentials.username}&password=${this.credentials.password}`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';
      this.setRunning(true);
    } catch (e) {
      this.setRunning(false);
    }
  }

  onMessage(callback?: Function) {
    if (this.isRunning()) {
      this.ws.addEventListener('message', (incoming: Object) => {
        const buffer = new Uint8Array(incoming.data);
        const received = this.WebSocketMessage.decode(buffer);
        const message = this.WebSocketMessage.toObject(received, {
          bytes: String,
        });
        if (message.type === WEBSOCKET_MESSAGE_TYPES.REQUEST) {
          const request = this.prepareResponse(
            message.request.id,
            200,
            'OK',
          );
          if (request != null) this.send(request);
        } else if (message.type === WEBSOCKET_MESSAGE_TYPES.RESPONSE
          && typeof message.response.body !== 'undefined'
          && message.response.body.trim() !== '') {
          message.response.body = Buffer.from(message.response.body, 'base64').toString('utf8');
        }
        if (typeof callback === 'function') callback(message);
      });
    }
  }

  send(data: Uint8Array, callback?: Function) {
    try { this.ws.send(data); } catch (e) {
      console.log('err', e);
    }
    if (typeof callback === 'function') callback();
  }

  sendSignalMessage(apiBody: Object) {
    const { destination } = apiBody.messages[0];
    const requestBody = JSON.stringify(apiBody);
    const request = this.prepareRequest(
      1,
      'PUT',
      `/v1/messages/${destination}`,
      requestBody,
      ['content-type:application/json;'],
    );
    if (request == null) throw new Error();
    this.send(request, () => {
      SignalClient.saveSentMessage(requestBody);
    });
  }

  stop(callback?: Function) {
    if (this.isRunning()) this.ws.close();
    this.setRunning(false);
    if (typeof callback === 'function') callback();
  }

  onOpen(callback?: Function) {
    this.ws.addEventListener('open', () => {
      if (typeof callback === 'function') callback();
      this.setRunning(true);
    });
  }

  setRunning(state: boolean) {
    this.running = state;
    if (!state) delete this.ws;
  }

  isRunning(): boolean {
    return this.running && typeof this.ws !== 'undefined';
  }

  prepareRequest(requestId: number, verb: string, path: string, body?: string, headers?: string[]): ?Uint8Array {
    const bodyBuffer = typeof body !== 'undefined' ? Buffer.from(body) : null;
    const request = {
      type: WEBSOCKET_MESSAGE_TYPES.REQUEST,
      request: {
        id: requestId,
        verb,
        path,
        body: bodyBuffer,
        headers,
      },
    };
    const err = this.WebSocketMessage.verify(request);
    if (err) {
      console.log(err);
      return null;
    }
    const requestMessage = this.WebSocketMessage.create(request);
    return this.WebSocketMessage.encode(requestMessage).finish();
  }

  prepareResponse(requestId: number, status: number, message: string, body?: string, headers?: string[]): ?Uint8Array {
    const bodyBuffer = typeof body !== 'undefined' ? Buffer.from(body) : null;
    const response = {
      type: WEBSOCKET_MESSAGE_TYPES.RESPONSE,
      response: {
        id: requestId,
        status,
        message,
        body: bodyBuffer,
        headers,
      },
    };
    const err = this.WebSocketMessage.verify(response);
    if (err) {
      console.log(err);
      return null;
    }
    const responseMessage = this.WebSocketMessage.create(response);
    return this.WebSocketMessage.encode(responseMessage).finish();
  }
}
