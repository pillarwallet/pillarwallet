// @flow

import firebase from 'react-native-firebase';
import Intercom from 'react-native-intercom';
import { processNotification } from 'utils/notifications';
import Storage from 'services/storage';
import { ADD_NOTIFICATION, UPDATE_INTERCOM_NOTIFICATIONS_COUNT } from 'constants/notificationConstants';

const storage = Storage.getInstance('db');

let notificationsListener = null;
let intercomNotificationsListener = null;

export const startListeningIntercomNotificationsAction = () => {
  return async (dispatch: Function) => {
    const { user } = await storage.get('user');
    if (!user) return;
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
    Intercom.registerIdentifiedUser({ userId: user.username });
    intercomNotificationsListener = ({ count }) => dispatch({
      type: UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
      payload: count,
    });
    Intercom.getUnreadConversationCount()
      .then(count => ({ count }))
      .then(intercomNotificationsListener)
      .catch(() => { });
    Intercom.addEventListener(Intercom.Notifications.UNREAD_COUNT, intercomNotificationsListener);
  };
};

export const stopListeningIntercomNotificationsAction = () => {
  return () => {
    if (!intercomNotificationsListener) return;
    Intercom.reset();
    Intercom.removeEventListener(Intercom.Notifications.UNREAD_COUNT, intercomNotificationsListener);
  };
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function, getState: Function) => {
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
