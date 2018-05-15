// @flow

import Firebase from 'react-native-firebase';

export const registerFCMToken = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    const token = await Firebase.messaging().getToken(); // eslint-disable-line
    // register FCM Token
  };
};

let notificationsListener = null;

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    // check if permissions enabled
    const enabled = await Firebase.messaging().hasPermission();
    if (!enabled) {
      try {
        await Firebase.messaging().requestPermission();
        // create a listener
        if (notificationsListener) return;
        notificationsListener = Firebase.notifications().onNotification((message) => {
          // handle message depending on TYPE?
          console.log(message);
        });
      } catch (err) { }// eslint-disable-line
    }
  };
};

export const stopListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};
