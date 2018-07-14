// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import { SIGNAL_SERVER_HOST } from 'react-native-dotenv';
import { Platform } from 'react-native'

export default function Chat() {
  this.client = SignalClient;
}

Chat.prototype.init = async function (credentials: Object) {
  credentials.host = SIGNAL_SERVER_HOST;
  if (Platform.OS === 'ios'){
      return this.client.createClient(credentials.username, credentials.password, credentials.host);
  } else {
      return this.client.init(credentials);
  }
};
