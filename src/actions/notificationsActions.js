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
import { NavigationActions } from 'react-navigation';
import { Alert } from 'react-native';
import { Notifications } from 'react-native-notifications';
import messaging from '@react-native-firebase/messaging';

// Actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  subscribeToEtherspotNotificationsAction,
  unsubscribeToEtherspotNotificationsAction,
} from 'actions/etherspotActions';

// Constants
import {
  ADD_NOTIFICATION,
  SHOW_HOME_UPDATE_INDICATOR,
  HIDE_HOME_UPDATE_INDICATOR,
  BCX,
  COLLECTIBLE,
  FCM_DATA_TYPE,
} from 'constants/notificationConstants';
import { HOME, AUTH_FLOW, APP_FLOW } from 'constants/navigationConstants';

// Services
import { navigate, getNavigationPathAndParamsState, updateNavigationLastScreenState } from 'services/navigation';
import { firebaseMessaging } from 'services/firebase';

// Utils
import { getNotificationsVisibleStatus } from 'utils/getNotification';
import { processNotification, resetAppNotificationsBadgeNumber, getToastNotification } from 'utils/notifications';
import { logBreadcrumb } from 'utils/common';

// Types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { FirebaseMessage } from 'models/Notification';

// Selectors
import { activeAccountAddressSelector } from 'selectors';

let notificationsListener = null;
let disabledPushNotificationsListener = null;
let disabledFetchingBalanceListener = null;
let notificationsOpenerListener = null;

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

export const showHomeUpdateIndicatorAction = () => ({ type: SHOW_HOME_UPDATE_INDICATOR });
export const hideHomeUpdateIndicatorAction = () => ({ type: HIDE_HOME_UPDATE_INDICATOR });

export const fetchAllNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(fetchTransactionsHistoryAction());
    dispatch(fetchAllCollectiblesDataAction());
    dispatch(fetchAssetsBalancesAction(true));
  };
};

export const fetchAssetsBalanceNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(fetchAssetsBalancesAction(true));
  };
};

const onFirebaseMessageAction = (message: FirebaseMessage) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (checkForSupportAlert(message.data)) return;
    const type = message?.data?.type;

    if ([FCM_DATA_TYPE.BCX, FCM_DATA_TYPE.PPN, FCM_DATA_TYPE.SMART_WALLET].includes(type)) {
      dispatch(fetchAllNotificationsAction());
    }

    if (type === FCM_DATA_TYPE.COLLECTIBLE) {
      dispatch(fetchAllCollectiblesDataAction());
    }

    if (message.notification) {
      const walletAddress = activeAccountAddressSelector(getState());
      const notification = message.data && getToastNotification(message.data, walletAddress);
      if (!notification) return;
      dispatch({ type: ADD_NOTIFICATION, payload: notification });
      dispatch(showHomeUpdateIndicatorAction());
    }
  };
};

export const hasFCMPermission = async () => {
  try {
    const status = await firebaseMessaging.requestPermission();
    return [messaging.AuthorizationStatus.AUTHORIZED, messaging.AuthorizationStatus.PROVISIONAL].includes(status);
  } catch (e) {
    logBreadcrumb('Notification Actions', 'Notification Actions: failed firebase request permission', { e });
    return null;
  }
};

export const subscribeToPushNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    if (await getNotificationsVisibleStatus()) {
      if (notificationsListener !== null) return;
      notificationsListener = firebaseMessaging.onMessage(
        debounce((message) => {
          dispatch(onFirebaseMessageAction(message));
        }, 500),
      );
    } else {
      dispatch(fetchAllNotificationsAction());
      if (disabledPushNotificationsListener !== null) return;
      disabledPushNotificationsListener = setInterval(() => {
        dispatch(fetchAllNotificationsAction());
      }, 30000);
    }
  };
};

export const startListeningGetBalancesAction = () => {
  return (dispatch: Dispatch) => {
    if (disabledFetchingBalanceListener !== null) return;
    disabledFetchingBalanceListener = setInterval(() => {
      dispatch(fetchAssetsBalanceNotificationsAction());
    }, 10000);
  };
};

export const stopListeningGetBalancesAction = () => {
  return () => {
    if (disabledFetchingBalanceListener !== null) {
      clearInterval(disabledFetchingBalanceListener);
      disabledFetchingBalanceListener = null;
    }
  };
};

export const startListeningNotificationsAction = () => {
  return (dispatch: Dispatch) => {
    dispatch(subscribeToPushNotificationsAction());
    dispatch(subscribeToEtherspotNotificationsAction());
  };
};

export const stopListeningNotificationsAction = () => {
  return (dispatch: Dispatch) => {
    if (disabledPushNotificationsListener !== null) {
      clearInterval(disabledPushNotificationsListener);
      disabledPushNotificationsListener = null;
    }
    if (disabledFetchingBalanceListener !== null) {
      clearInterval(disabledFetchingBalanceListener);
      disabledFetchingBalanceListener = null;
    }

    if (notificationsListener !== null) {
      notificationsListener();
      notificationsListener = null;
    }

    dispatch(unsubscribeToEtherspotNotificationsAction());
  };
};

export const startListeningOnOpenNotificationAction = () => {
  return async (dispatch: Dispatch) => {
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
          dispatch(fetchTransactionsHistoryAction());
          dispatch(fetchAssetsBalancesAction(true));
        }
        if (type === COLLECTIBLE) {
          dispatch(fetchAllCollectiblesDataAction());
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
