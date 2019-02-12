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
import { SignalClient } from 'rn-signal-protocol-messaging';
import ChatWebSocketService from 'services/chatWebSocket';
import { SENTRY_DSN, SIGNAL_SERVER_HOST } from 'react-native-dotenv';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

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
      return this.client.createClient(credentials.username, credentials.accessToken, credentials.host);
    }

    credentials.errorTrackingDSN = SENTRY_DSN;
    credentials.isSendingLogs = !__DEV__;
    try {
      credentials.buildNumber = `${DeviceInfo.getBuildNumber()}`;
      credentials.device = `${DeviceInfo.getManufacturer()} ${DeviceInfo.getModel()}`;
      credentials.os = `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`;
    } catch (e) {
      //
    }
    return this.client.init(credentials);
  }

  getWebSocketInstance(): ChatWebSocketService {
    return webSocketInstance || new ChatWebSocketService({});
  }

  async sendMessage(tag: string, payload: Object, silent: boolean, webSocketSendCallback?: Function) {
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
        if (typeof webSocketSendCallback === 'function') {
          webSocketSendCallback(requestId);
        }
        const timestamp = (new Date()).getTime() / 1000;
        SignalClient.saveSentMessage(tag, {
          username,
          message,
          timestamp,
        });
      });
    } else if (silent) {
      await SignalClient.sendSilentMessageByContact(tag, payload);
    } else {
      await SignalClient.sendMessageByContact(tag, payload);
    }
  }

  async deleteMessage(username: string, timestamp: number, responseRequestId?: number) {
    const chatWebSocket = this.getWebSocketInstance();
    if (chatWebSocket.isRunning() && responseRequestId !== undefined) {
      const webSocketResponse = chatWebSocket.prepareResponse(responseRequestId, 200, 'OK');
      if (webSocketResponse != null) {
        await chatWebSocket.send(webSocketResponse);
      }
    }
    await SignalClient.deleteSignalMessage(username, timestamp);
  }
}
