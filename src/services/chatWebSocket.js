// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import protobufjs from 'protobufjs';

const subProtocolProtobufJson = require('models/protobuf/SubProtocol.json');
const textSecureProtobufJson = require('models/protobuf/TextSecure.json');

export const WEBSOCKET_MESSAGE_TYPES = {
  REQUEST: 1,
  RESPONSE: 2,
};

let keepaliveTimer;

export default class ChatWebSocket {
  credentials: Object;
  WebSocketMessage: Object;
  TextSecureEnvelope: Object;
  ws: WebSocket;
  running: boolean;

  constructor(credentials: Object) {
    this.credentials = credentials;
    const rootWebSocketMessage = protobufjs.Root.fromJSON(subProtocolProtobufJson);
    this.WebSocketMessage = rootWebSocketMessage.lookupType('signal.websocket.WebSocketMessage');
    const rootTextSecureEnvelope = protobufjs.Root.fromJSON(textSecureProtobufJson);
    this.TextSecureEnvelope = rootTextSecureEnvelope.lookupType('signal.websocket.Envelope');
    this.running = false;
  }

  listen() {
    if (this.isRunning()) this.ws.close();
    this.setRunning(false);
    const wsUrl = `${this.credentials.host
      .replace(/(https:\/\/)/gi, 'wss://')
      .replace(/(http:\/\/)/gi, 'ws://')}/v1/websocket/`;
    try {
      this.ws = new WebSocket(wsUrl, [this.credentials.accessToken]);
      this.ws.binaryType = 'arraybuffer';
      this.setRunning(true);
    } catch (e) {
      this.setRunning(false);
    }
  }

  keepalive() {
    if (!this.isRunning()) return;
    const request = this.prepareRequest((new Date()).getTime(), 'GET', '/v1/keepalive');
    if (request == null) return;
    this.send(request);
    keepaliveTimer = setTimeout(() => this.keepalive(), 60000); // 60s keepalive
  }

  onMessage(callback?: Function) {
    if (!this.isRunning()) return;
    this.ws.onmessage = async (incoming: Object) => {
      const buffer = new Uint8Array(incoming.data);
      if (buffer === undefined || !buffer.length) return;
      const received = this.WebSocketMessage.decode(buffer);
      const message = this.WebSocketMessage.toObject(received, {
        bytes: String,
      });
      const receivedType = message.type === WEBSOCKET_MESSAGE_TYPES.REQUEST ? 'request' : 'response';
      if (typeof message[receivedType].body !== 'undefined'
        && message[receivedType].body.trim() !== '') {
        if (message.type === WEBSOCKET_MESSAGE_TYPES.REQUEST
          && message[receivedType].verb === 'PUT'
          && message[receivedType].path === '/api/v1/message') {
          const encryptedBody = message[receivedType].body;
          const b64EncodedBytes = await SignalClient.decryptReceivedBody(encryptedBody)
            .catch(() => null);
          const decodedBytes = Buffer.from(b64EncodedBytes, 'base64');
          if (decodedBytes !== undefined && decodedBytes.length) {
            const textSecureEnvelope = this.TextSecureEnvelope.decode(decodedBytes);
            message.receivedSignalMessage = this.TextSecureEnvelope.toObject(textSecureEnvelope, {
              bytes: String,
            });
          }
        } else {
          message[receivedType].body = Buffer.from(message[receivedType].body, 'base64')
            .toString('utf8');
        }
      }
      if (message.type === WEBSOCKET_MESSAGE_TYPES.REQUEST
        && message.request.path !== '/api/v1/message') {
        const webSocketResponse = this.prepareResponse(message.request.id, 200, 'OK');
        if (webSocketResponse != null) {
          await this.ws.send(webSocketResponse);
        }
      }
      if (typeof callback === 'function') callback(message);
    };
  }

  send(data: Uint8Array, callback?: Function) {
    if (!this.isRunning()) return;
    this.ws.send(data);
    if (typeof callback === 'function') callback();
  }

  stop(callback?: Function) {
    if (this.isRunning()) this.ws.close(1000, 'OK');
    this.setRunning(false);
    if (typeof callback === 'function') callback();
  }

  onOpen(callback?: Function) {
    this.ws.onopen = () => {
      if (typeof keepaliveTimer !== 'undefined') clearTimeout(keepaliveTimer);
      this.keepalive();
      this.setRunning(true);
      if (typeof callback === 'function') callback();
    };
    this.ws.onclose = () => {
      this.setRunning(false);
    };
    this.ws.onerror = () => {
      this.setRunning(false);
    };
  }

  setRunning(state: boolean) {
    this.running = state;
    if (!state) {
      delete this.ws;
      if (typeof keepaliveTimer !== 'undefined') clearTimeout(keepaliveTimer);
    }
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
      return null;
    }
    const responseMessage = this.WebSocketMessage.create(response);
    return this.WebSocketMessage.encode(responseMessage).finish();
  }
}
