// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import ChatWebSocketService from 'services/chatWebSocket';
import { SENTRY_DSN, SIGNAL_SERVER_HOST } from 'react-native-dotenv';
import { Platform } from 'react-native';

let webSocketInstance;

export default class Chat {
  client: Object;

  constructor() {
    this.client = SignalClient;
  }

  async init(credentials: Object) {
    credentials.host = SIGNAL_SERVER_HOST;

    webSocketInstance = new ChatWebSocketService(credentials);

    if (Platform.OS === 'ios') {
      return this.client.createClient(credentials.username, credentials.password, credentials.host);
    }

    credentials.errorTrackingDSN = SENTRY_DSN;
    credentials.isSendingLogs = !__DEV__;
    return this.client.init(credentials);
  }

  getWebSocketInstance(): ChatWebSocketService {
    return webSocketInstance || new ChatWebSocketService({});
  }

  async sendMessage(tag: string, payload: Object) {
    const chatWebSocket = this.getWebSocketInstance();
    if (chatWebSocket.isRunning()) {
      const { username, message } = payload;
      const apiBody = await SignalClient.prepareApiBody(tag, payload);
      const requestId = (new Date()).getTime();
      const request = chatWebSocket.prepareRequest(
        requestId,
        'PUT',
        `/v1/messages/${username}`,
        apiBody,
        ['content-type:application/json;'],
      );
      if (request == null) throw new Error();
      chatWebSocket.send(request, () => {
        const timestamp = (new Date()).getTime() / 1000;
        SignalClient.saveSentMessage('chat', {
          username,
          message,
          timestamp,
        });
      });
    } else {
      await SignalClient.sendMessageByContact(tag, payload);
    }
  }

  async deleteMessage(username: string, timestamp: number) {
    const chatWebSocket = this.getWebSocketInstance();
    if (chatWebSocket.isRunning()) {
      const requestId = (new Date()).getTime();
      const request = chatWebSocket.prepareRequest(
        requestId,
        'DELETE',
        `/v1/messages/${username}/${timestamp}`,
      );
      if (request == null) throw new Error();
      chatWebSocket.send(request);
    } else {
      await SignalClient.deleteSignalMessage(username, timestamp);
    }
  }
}
