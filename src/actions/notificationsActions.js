// @flow

import firebase from 'react-native-firebase';
import { processNotification } from 'utils/notifications';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';

let notificationsListener = null;

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function, getState: Function) => { // eslint-disable-line
    const { wallet: { data: wallet } } = getState();
    // check if permissions enabled
    const enabled = await firebase.messaging().hasPermission();
    if (!enabled) {
      try {
        await firebase.messaging().requestPermission();
        // create a listener
      } catch (err) { return; } // eslint-disable-line
    }
    await firebase.messaging().getToken();
    if (notificationsListener) return;
    notificationsListener = firebase.messaging().onMessage((message) => {
      if (!message._data || !Object.keys(message._data).length) return;
      const notification = processNotification(message._data, wallet.address.toUpperCase());
      if (!notification) return;
      dispatch({ type: ADD_NOTIFICATION, payload: notification });
    });
  };
};

export const stopListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};
