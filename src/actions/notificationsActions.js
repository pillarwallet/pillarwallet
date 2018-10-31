// @flow

import debounce from 'lodash.debounce';
import firebase from 'react-native-firebase';
import Intercom from 'react-native-intercom';
import { NavigationActions } from 'react-navigation';
import { processNotification } from 'utils/notifications';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { getExistingChatsAction } from 'actions/chatActions';
import { navigate, getNavigationState, updateNavigationLastScreenState } from 'services/navigation';
import Storage from 'services/storage';
import {
  ADD_NOTIFICATION,
  UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
  SET_UNREAD_NOTIFICATIONS_STATUS,
  SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
} from 'constants/notificationConstants';
import { PEOPLE, HOME, AUTH_FLOW, APP_FLOW } from 'constants/navigationConstants';

const CONNECTION = 'CONNECTION';
const SIGNAL = 'SIGNAL';
const BCX = 'BCX';

const storage = Storage.getInstance('db');

let notificationsListener = null;
let notificationsOpenerListener = null;
let intercomNotificationsListener = null;
let signalListener = null;

const NOTIFICATION_ROUTES = {
  [CONNECTION]: PEOPLE,
  [BCX]: HOME,
};

export const startListeningIntercomNotificationsAction = () => {
  return async (dispatch: Function) => {
    const { user } = await storage.get('user');
    if (!user) return;
    const { username } = user;
    Intercom.registerIdentifiedUser({ userId: username });
    Intercom.updateUser({ user_id: username, name: username });
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

export const setUnreadNotificationsStatusAction = (status: boolean) => {
  return async (dispatch: Function) => {
    dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: status });
  };
};

export const setUnreadChatNotificationsStatusAction = (status: boolean) => {
  return async (dispatch: Function) => {
    dispatch({ type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS, payload: status });
  };
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      wallet: { data: wallet },
      assets: { data: assets },
    } = getState();
    const enabled = await firebase.messaging().hasPermission();
    if (!enabled) {
      try {
        await firebase.messaging().requestPermission();
        await firebase.messaging().getToken();
      } catch (err) { return; } // eslint-disable-line
    }
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: true });
    }
    // TODO: remove it once signal payload matches the rest notifications.
    if (!signalListener) {
      // TODO: This is a temporary solution to reduces the possibility of the wrong notification order.
      // We're going to use websockets in the future.
      const onMessage = message => {
        const notification = processNotification(message._data, wallet.address.toUpperCase());
        if (!notification) return;
        if (notification.type === SIGNAL) {
          dispatch(getExistingChatsAction());
          // dispatch({ type: ADD_NOTIFICATION, payload: notification });
          dispatch({ type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS, payload: true });
        }
      };
      signalListener = firebase.notifications().onNotification(debounce(onMessage, 500));
    }
    if (notificationsListener) return;
    notificationsListener = firebase.notifications().onNotification(message => {
      if (!message._data || !Object.keys(message._data).length) return;
      const notification = processNotification(message._data, wallet.address.toUpperCase());
      if (!notification) return;
      if (notification.type === BCX) {
        dispatch(fetchTransactionsHistoryNotificationsAction());
        dispatch(fetchTransactionsHistoryAction(wallet.address, notification.asset));
        dispatch(fetchAssetsBalancesAction(assets, wallet.address));
      }
      if (notification.type === CONNECTION) {
        dispatch(fetchInviteNotificationsAction());
      }
      if (notification.type !== SIGNAL) {
        dispatch({ type: ADD_NOTIFICATION, payload: notification });
        dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: true });
      }
    });
  };
};

export const stopListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    // TODO: remove it once signal payload matches the rest notifications.
    if (signalListener) {
      signalListener();
      signalListener = null;
    }

    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};

export const startListeningOnOpenNotificationAction = () => {
  return (dispatch: Function, getState: Function) => { // eslint-disable-line
    if (notificationsOpenerListener) return;
    notificationsOpenerListener = firebase.notifications().onNotificationOpened((message) => {
      const { navigator } = getNavigationState();
      const pathAndParams = navigator._navigation.router.getPathAndParamsForState(navigator._navigation.state);
      const currentFlow = pathAndParams.path.split('/')[0];
      const { type } = processNotification(message.notification._data) || {};
      const notificationRoute = NOTIFICATION_ROUTES[type] || null;
      updateNavigationLastScreenState({
        lastActiveScreen: notificationRoute,
      });
      if (notificationRoute && currentFlow !== AUTH_FLOW) {
        const routeName = notificationRoute || HOME;
        const navigateToAppAction = NavigationActions.navigate({
          routeName: APP_FLOW,
          params: {},
          action: NavigationActions.navigate({
            routeName,
          }),
        });
        navigate(navigateToAppAction);
      }
    });
  };
};

export const stopListeningOnOpenNotificationAction = () => {
  return (dispatch: Function) => { // eslint-disable-line
    if (!notificationsOpenerListener) return;
    notificationsOpenerListener();
    notificationsOpenerListener = null;
  };
};
