// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import { SENTRY_DSN, SIGNAL_SERVER_HOST } from 'react-native-dotenv';
import { Platform } from 'react-native';


export default class Chat {
  client: Object;

  constructor() {
    this.client = SignalClient;
  }

  async init(credentials: Object) {
    if (Platform.OS === 'ios') {
      return this.client.createClient(
        credentials.username,
        credentials.password,
        SIGNAL_SERVER_HOST,
      );
    }

    credentials.errorTrackingDSN = SENTRY_DSN;
    credentials.isSendingLogs = !__DEV__;
    credentials.host = SIGNAL_SERVER_HOST;
    return this.client.init(credentials);
  }
}
