// @flow

import ChatService from 'services/chat';

const chat = new ChatService();

export const signalInitAction = (credentials: Object) => {
  return () => {
    if (typeof credentials.accessToken === 'undefined'
      || credentials.accessToken === undefined) return;
    chat.init(credentials)
      .then(() => chat.client.registerAccount())
      .then(() => chat.client.setFcmId(credentials.fcmToken))
      .catch(() => null);
  };
};
