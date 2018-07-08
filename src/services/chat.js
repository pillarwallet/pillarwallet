// @flow
import { SignalClient } from 'rn-signal-protocol-messaging';
import { SIGNAL_SERVER_HOST } from 'react-native-dotenv';

export default function Chat() {
  this.client = SignalClient;
}

Chat.prototype.init = async function (credentials: Object) {
  credentials.host = SIGNAL_SERVER_HOST;
  return this.client.init(credentials);
};
