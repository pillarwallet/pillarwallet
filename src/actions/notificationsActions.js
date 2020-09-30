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
import debounce from 'lodash.debounce';
import isEmpty from 'lodash.isempty';
import Intercom from 'react-native-intercom';
import { NavigationActions } from 'react-navigation';
import { Alert } from 'react-native';
import get from 'lodash.get';
import { Notifications } from 'react-native-notifications';
import messaging from '@react-native-firebase/messaging';

// actions
import { fetchSmartWalletTransactionsAction } from 'actions/historyActions';
import { checkForMissedAssetsAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { fetchBadgesAction } from 'actions/badgesActions';

// constants
import {
  ADD_NOTIFICATION,
  UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
  SHOW_HOME_UPDATE_INDICATOR,
  HIDE_HOME_UPDATE_INDICATOR,
  BCX,
  COLLECTIBLE,
  BADGE,
  FCM_DATA_TYPE,
} from 'constants/notificationConstants';
import { HOME, AUTH_FLOW, APP_FLOW } from 'constants/navigationConstants';
import {
  CONNECTION_REQUESTED_EVENT,
  COLLECTIBLE_EVENT,
} from 'constants/socketConstants';

// services
import { navigate, getNavigationPathAndParamsState, updateNavigationLastScreenState } from 'services/navigation';
import Storage from 'services/storage';
import { SOCKET } from 'services/sockets';
import { firebaseMessaging } from 'services/firebase';

// utils
import {
  processNotification,
  resetAppNotificationsBadgeNumber,
  getToastNotification,
} from 'utils/notifications';
import { reportLog } from 'utils/common';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';
import type { FirebaseMessage } from 'models/Notification';

const storage = Storage.getInstance('db');

let notificationsListener = null;
let disabledPushNotificationsListener = null;
let notificationsOpenerListener = null;
let intercomNotificationsListener = null;

const NOTIFICATION_ROUTES = {
  [BCX]: HOME,
  [COLLECTIBLE]: HOME,
};

function checkForSupportAlert(messageData) {
  if (messageData && messageData.support && messageData.message) {
    Alert.alert(messageData.title, messageData.message);
    return true;
  }
  return false;
}

export const startListeningIntercomNotificationsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { user } = await storage.get('user');
    if (!user) return;
    const { username } = user;
    const supportHmac = await api.supportHmac();

    Intercom.handlePushMessage();
    Intercom.registerIdentifiedUser({ userId: username });
    Intercom.updateUser({ user_id: username, name: username });
    Intercom.setUserHash(supportHmac);
    intercomNotificationsListener = ({ count }) => dispatch({
      type: UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
      payload: count,
    });
    Intercom.getUnreadConversationCount()
      .then(count => ({ count }))
      .then(intercomNotificationsListener)
      .then(() => Intercom.setInAppMessageVisibility('VISIBLE'))
      .catch(() => { });
    Intercom.addEventListener(Intercom.Notifications.UNREAD_COUNT, intercomNotificationsListener);
  };
};

export const stopListeningIntercomNotificationsAction = () => {
  return () => {
    if (!intercomNotificationsListener) return;
    Intercom.removeEventListener(Intercom.Notifications.UNREAD_COUNT, intercomNotificationsListener);
  };
};

export const showHomeUpdateIndicatorAction = () => ({ type: SHOW_HOME_UPDATE_INDICATOR });
export const hideHomeUpdateIndicatorAction = () => ({ type: HIDE_HOME_UPDATE_INDICATOR });

export const fetchAllNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(checkForMissedAssetsAction());
    dispatch(fetchSmartWalletTransactionsAction());
    dispatch(fetchAllCollectiblesDataAction());
    dispatch(fetchAssetsBalancesAction());
  };
};

export const subscribeToSocketEventsAction = () => {
  return async (dispatch: Dispatch) => {
    if (get(SOCKET(), 'socket.readyState') !== 1) return;

    SOCKET().onMessage((response) => {
      let data;
      try {
        data = JSON.parse(response.data.msg);
      } catch (error) {
        // this shouldn't happen, but was reported to Sentry as issue, let's report with more details
        reportLog('Platform WebSocket notification parse failed', { response, error });
        return; // unable to parse data, do not proceed
      }
      if (data.type === COLLECTIBLE_EVENT) {
        dispatch(fetchAllCollectiblesDataAction());
      }
      if (data.type === BCX) {
        dispatch(checkForMissedAssetsAction());
        dispatch(fetchSmartWalletTransactionsAction());
        dispatch(fetchAssetsBalancesAction());
      }
      if (data.type === BADGE) {
        dispatch(fetchBadgesAction(false));
      }
      if (
        data.type === CONNECTION_REQUESTED_EVENT ||
        data.type === COLLECTIBLE_EVENT ||
        data.type === BCX ||
        data.type === BADGE
      ) {
        const notification = {
          title: response.notification.title,
          message: response.notification.body,
        };
        dispatch({ type: ADD_NOTIFICATION, payload: notification });
        dispatch(showHomeUpdateIndicatorAction());
      }
    });
  };
};

const onFirebaseMessageAction = (message: FirebaseMessage) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (checkForSupportAlert(message.data)) return;
    const type = message?.data?.type;

    if ([
      FCM_DATA_TYPE.BCX,
      FCM_DATA_TYPE.PPN,
      FCM_DATA_TYPE.SMART_WALLET,
    ].includes(type)) {
      dispatch(fetchAllNotificationsAction());
    }

    if (type === FCM_DATA_TYPE.COLLECTIBLE) {
      dispatch(fetchAllCollectiblesDataAction());
    }

    if (message.notification) {
      const { wallet: { data: wallet } } = getState();
      const notification = message.data && getToastNotification(message.data, wallet.address);
      if (!notification) return;

      dispatch({ type: ADD_NOTIFICATION, payload: notification });
      dispatch(showHomeUpdateIndicatorAction());
    }
  };
};

const hasFCMPermission = async () => {
  const status = await firebaseMessaging.requestPermission();
  return [
    messaging.AuthorizationStatus.AUTHORIZED,
    messaging.AuthorizationStatus.PROVISIONAL,
  ].includes(status);
};

export const subscribeToPushNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    if (await hasFCMPermission()) {
      if (notificationsListener !== null) return;
      notificationsListener = firebaseMessaging.onMessage(debounce(message => {
        dispatch(onFirebaseMessageAction(message));
      }, 500));
    } else {
      dispatch(fetchAllNotificationsAction());
      if (disabledPushNotificationsListener !== null) return;
      disabledPushNotificationsListener = setInterval(() => {
        dispatch(fetchAllNotificationsAction());
      }, 30000);
    }
  };
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(subscribeToSocketEventsAction());
    dispatch(subscribeToPushNotificationsAction());
  };
};

export const stopListeningNotificationsAction = () => {
  return async () => {
    if (disabledPushNotificationsListener !== null) {
      clearInterval(disabledPushNotificationsListener);
      disabledPushNotificationsListener = null;
    }

    if (notificationsListener !== null) {
      notificationsListener();
      notificationsListener = null;
    }
  };
};

export const startListeningOnOpenNotificationAction = () => {
  return async (dispatch: Dispatch) => {
    await SOCKET().init();
    /*
    * TODO: Android initial notification and onOpened event are not working
    * seems like native lifecycle onIntent event is not fired
    * this can be linked to 0.59 version support and we should check after upgrade to latest
    */
    const initialNotification = await Notifications.getInitialNotification();
    if (!isEmpty(initialNotification)) {
      checkForSupportAlert(initialNotification.payload);
      const { type, navigationParams } = processNotification(initialNotification.payload) || {};
      const notificationRoute = NOTIFICATION_ROUTES[type] || null;
      updateNavigationLastScreenState({
        lastActiveScreen: notificationRoute,
        lastActiveScreenParams: navigationParams,
      });
      resetAppNotificationsBadgeNumber();
    }
    if (notificationsOpenerListener) return;
    notificationsOpenerListener = (openedNotification, completion) => {
      completion({ alert: true, sound: true, badge: false });
      if (isEmpty(openedNotification)) return;
      const { payload: openedNotificationPayload } = openedNotification;
      checkForSupportAlert(openedNotificationPayload);
      resetAppNotificationsBadgeNumber();
      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) return;
      const currentFlow = pathAndParams.path.split('/')[0];
      const { type, navigationParams = {} } = processNotification(openedNotificationPayload) || {};
      const notificationRoute = NOTIFICATION_ROUTES[type] || null;
      updateNavigationLastScreenState({
        lastActiveScreen: notificationRoute,
        lastActiveScreenParams: navigationParams,
      });
      if (notificationRoute && currentFlow !== AUTH_FLOW) {
        if (type === BCX) {
          dispatch(checkForMissedAssetsAction());
          dispatch(fetchSmartWalletTransactionsAction());
          dispatch(fetchAssetsBalancesAction());
        }
        if (type === COLLECTIBLE) {
          dispatch(fetchAllCollectiblesDataAction());
        }

        if (type === BADGE) {
          dispatch(fetchBadgesAction(false));
        }

        const routeName = notificationRoute || HOME;
        const navigateToAppAction = NavigationActions.navigate({
          routeName: APP_FLOW,
          params: {},
          action: NavigationActions.navigate({
            routeName,
            params: navigationParams,
          }),
        });
        navigate(navigateToAppAction);
      }
    };
    Notifications.events().registerNotificationOpened(notificationsOpenerListener);
  };
};

export const stopListeningOnOpenNotificationAction = () => {
  return () => {
    if (!notificationsOpenerListener) return;
    notificationsOpenerListener = null;
    Notifications.events().registerNotificationOpened(null);
  };
};
