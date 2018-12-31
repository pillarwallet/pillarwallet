// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import { SENTRY_DSN, SIGNAL_SERVER_HOST } from 'react-native-dotenv';
import { Platform } from 'react-native';

let webSocketInstance;
let webSocketRunning = false;

export default class Chat {
  client: Object;
  credentials: Object;

  constructor() {
    this.client = SignalClient;
  }

  async init(credentials: Object) {
    this.credentials = credentials;

    if (Platform.OS === 'ios') {
      return this.client.createClient(credentials);
    }

    credentials.errorTrackingDSN = SENTRY_DSN;
    credentials.isSendingLogs = !__DEV__;
    credentials.host = SIGNAL_SERVER_HOST;
    return this.client.init(credentials);
  }

  setupWebSocket(credentials?: Object) {
    if (webSocketInstance !== undefined && typeof webSocketInstance.readyState !== 'undefined') {
      console.log('webSocketInstance !== undefined');
      webSocketInstance.close();
      webSocketInstance = {};
    }
    credentials = credentials !== undefined ? credentials : this.credentials;
    if (!Object.keys(credentials).length) return;
    const wsUrl = `ws://${SIGNAL_SERVER_HOST
      .replace(/https:\/\//gi, '')
      .replace(/http:\/\//gi, '')
      .replace(/\/$/, '')}/v1/websocket/?login=${credentials.username}&password=${credentials.password}`;
    try {
      webSocketInstance = new WebSocket(wsUrl);
      webSocketInstance.binaryType = 'arraybuffer';
    } catch (e) {
      webSocketInstance = {};
      this.setWebSocketRunning(false);
    }
  }

  getWebSocketInstance(): Object {
    return webSocketInstance || {};
  }

  setWebSocketRunning(state: boolean) {
    webSocketRunning = state;
  }

  isWebSocketRunning(): boolean {
    return webSocketInstance !== undefined && typeof webSocketInstance.readyState !== 'undefined' && webSocketRunning;
  }
}
