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
import firebase from 'react-native-firebase';
import Intercom from 'react-native-intercom';
import { NavigationActions } from 'react-navigation';
import { Alert } from 'react-native';
import { processNotification } from 'utils/notifications';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import {
  getExistingChatsAction,
  getChatByContactAction,
  addContactAndSendWebSocketChatMessageAction,
  deleteChatAction,
} from 'actions/chatActions';
import {
  addContactAndSendWebSocketTxNoteMessageAction,
  decryptReceivedWebSocketTxNoteMessageAction,
} from 'actions/txNoteActions';
import { navigate, getNavigationPathAndParamsState, updateNavigationLastScreenState } from 'services/navigation';
import Storage from 'services/storage';
import {
  ADD_NOTIFICATION,
  UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
  SET_UNREAD_NOTIFICATIONS_STATUS,
  SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
} from 'constants/notificationConstants';
import { PEOPLE, HOME, AUTH_FLOW, APP_FLOW, CHAT, CHAT_LIST } from 'constants/navigationConstants';
import {
  ADD_WEBSOCKET_RECEIVED_MESSAGE,
  REMOVE_WEBSOCKET_SENT_MESSAGE,
} from 'constants/chatConstants';
import { WEBSOCKET_MESSAGE_TYPES } from 'services/chatWebSocket';
import { MESSAGE_DISCONNECTED } from 'constants/invitationsConstants';
import ChatService from 'services/chat';

const CONNECTION = 'CONNECTION';
const SIGNAL = 'SIGNAL';
const BCX = 'BCX';

const storage = Storage.getInstance('db');

let notificationsListener = null;
let disabledPushNotificationsListener;
let notificationsOpenerListener = null;
let intercomNotificationsListener = null;

const chat = new ChatService();

const NOTIFICATION_ROUTES = {
  [CONNECTION]: PEOPLE,
  [BCX]: HOME,
  [SIGNAL]: CHAT,
};

function checkForSupportAlert(messageData) {
  if (messageData && messageData.support && messageData.message) {
    Alert.alert(messageData.title, messageData.message);
    return true;
  }
  return false;
}

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
    Intercom.logout();
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

export const fetchAllNotificationsAction = () => {
  return async (dispatch: Function) => {
    dispatch(fetchTransactionsHistoryNotificationsAction());
    dispatch(fetchInviteNotificationsAction());
  };
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      wallet: { data: wallet },
      assets: { data: assets },
      contacts: { data: contacts },
    } = getState();
    let enabled = await firebase.messaging().hasPermission();
    if (!enabled) {
      try {
        await firebase.messaging().requestPermission();
        await firebase.messaging().getToken();
        enabled = true;

        dispatch(fetchAllNotificationsAction());
        disabledPushNotificationsListener = setInterval(() => {
          dispatch(fetchAllNotificationsAction());
        }, 30000);
        return;
      } catch (err) { } // eslint-disable-line
    }

    if (notificationsListener) return;
    notificationsListener = firebase.notifications().onNotification(debounce(message => {
      if (!message._data || !Object.keys(message._data).length) return;
      if (checkForSupportAlert(message._data)) return;
      const notification = processNotification(message._data, wallet.address.toUpperCase());

      if (!notification) return;
      if (notification.type === BCX) {
        dispatch(fetchTransactionsHistoryNotificationsAction());
        dispatch(fetchTransactionsHistoryAction(wallet.address, notification.asset));
        dispatch(fetchAssetsBalancesAction(assets, wallet.address));
      }
      if (notification.type === SIGNAL) {
        dispatch(getExistingChatsAction());
        const { params: navParams = null } = getNavigationPathAndParamsState() || {};
        if (!navParams) return;
        dispatch({ type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS, payload: true });
        if (!!navParams.username && navParams.username === notification.navigationParams.username) {
          const contact = contacts.find(c => c.username === navParams.username) || {};
          dispatch(getChatByContactAction(navParams.username, contact.id, contact.profileImage));
          return;
        }
        dispatch({
          type: ADD_NOTIFICATION,
          payload: {
            ...notification,
            message: `${notification.message} from ${notification.navigationParams.username}`,
          },
        });
      }
      if (notification.type === CONNECTION) {
        if (notification.message === MESSAGE_DISCONNECTED) {
          dispatch(deleteChatAction(notification.title));
        }

        dispatch(fetchInviteNotificationsAction());
      }
      if (notification.type !== SIGNAL) {
        dispatch({ type: ADD_NOTIFICATION, payload: notification });
        dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: true });
      }
    }, 500));
  };
};

export const stopListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    if (disabledPushNotificationsListener) clearInterval(disabledPushNotificationsListener);
    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};

export const startListeningOnOpenNotificationAction = () => {
  return async (dispatch: Function, getState: Function) => { // eslint-disable-line
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      checkForSupportAlert(notificationOpen.notification._data);
      const { type, navigationParams } = processNotification(notificationOpen.notification._data) || {};
      const notificationRoute = NOTIFICATION_ROUTES[type] || null;
      updateNavigationLastScreenState({
        lastActiveScreen: notificationRoute,
        lastActiveScreenParams: navigationParams,
      });
      firebase.notifications().setBadge(0);
    }
    if (notificationsOpenerListener) return;
    notificationsOpenerListener = firebase.notifications().onNotificationOpened((message) => {
      checkForSupportAlert(message.notification._data);
      firebase.notifications().setBadge(0);
      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) return;
      const currentFlow = pathAndParams.path.split('/')[0];
      const { type, navigationParams = {}, asset } = processNotification(message.notification._data) || {};
      const notificationRoute = NOTIFICATION_ROUTES[type] || null;
      updateNavigationLastScreenState({
        lastActiveScreen: notificationRoute,
        lastActiveScreenParams: navigationParams,
      });
      if (notificationRoute && currentFlow !== AUTH_FLOW) {
        let backTo = null;

        if (type === BCX) {
          const {
            wallet: { data: wallet },
            assets: { data: assets },
          } = getState();
          dispatch(fetchTransactionsHistoryNotificationsAction());
          dispatch(fetchTransactionsHistoryAction(wallet.address, asset));
          dispatch(fetchAssetsBalancesAction(assets, wallet.address));
        }
        if (type === CONNECTION) {
          dispatch(fetchInviteNotificationsAction());
        }
        if (type === SIGNAL) {
          dispatch(getExistingChatsAction());
          backTo = CHAT_LIST;
        }
        const routeName = notificationRoute || HOME;
        const navigateToAppAction = NavigationActions.navigate({
          routeName: APP_FLOW,
          params: {},
          action: NavigationActions.navigate({
            routeName,
            params: {
              ...navigationParams,
              backTo,
            },
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

export const startListeningChatWebSocketAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const chatWebSocket = chat.getWebSocketInstance();
    await chatWebSocket.listen();
    chatWebSocket.onOpen();
    chatWebSocket.onMessage(async webSocketMessage => {
      const {
        type: messageType,
        response: messageResponse,
        request: messageRequest,
        receivedSignalMessage,
      } = webSocketMessage;
      if (messageType === WEBSOCKET_MESSAGE_TYPES.RESPONSE) {
        if (messageResponse.message.toLowerCase() === 'gone') {
          const {
            chat: { data: { webSocketMessages: { sent: webSocketMessagesSent } } },
          } = getState();
          const messageSent = webSocketMessagesSent.find(
            wsMessageSent => wsMessageSent.requestId === messageResponse.id,
          );
          if (messageSent) {
            const { tag, params } = messageSent;
            switch (tag) {
              case 'chat':
                dispatch(addContactAndSendWebSocketChatMessageAction(tag, params));
                break;
              case 'tx-note':
                dispatch(addContactAndSendWebSocketTxNoteMessageAction(tag, params));
                break;
              default:
                break;
            }
          }
        }
        if (messageResponse.status === 200) {
          dispatch({
            type: REMOVE_WEBSOCKET_SENT_MESSAGE,
            payload: messageResponse.id,
          });
        }
      }
      if (typeof receivedSignalMessage !== 'undefined') {
        const messageTag = Array.isArray(messageRequest.headers)
          ? messageRequest.headers.find(entry => entry.match(/message-tag/g)).split(':')[1]
          : '';
        const {
          contacts: { data: contacts },
        } = getState();
        const { source: senderUsername } = receivedSignalMessage;
        receivedSignalMessage.tag = messageTag;
        receivedSignalMessage.requestId = messageRequest.id;
        switch (messageTag) {
          case 'chat':
            dispatch({
              type: ADD_WEBSOCKET_RECEIVED_MESSAGE,
              payload: receivedSignalMessage,
            });
            dispatch(getExistingChatsAction());
            const { params: navParams = null } = getNavigationPathAndParamsState() || {};
            if (!navParams) return;
            dispatch({
              type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
              payload: true,
            });
            if (!!navParams.username && navParams.username === senderUsername) {
              const contact = contacts.find(c => c.username === navParams.username) || {};
              dispatch(getChatByContactAction(
                navParams.username,
                contact.id,
                contact.profileImage,
                false,
              ));
              return;
            }
            const notification = processNotification({ msg: JSON.stringify({ type: 'signal' }) });
            if (notification == null) return;
            dispatch({
              type: ADD_NOTIFICATION,
              payload: {
                ...notification,
                message: `${notification.message} from ${senderUsername}`,
              },
            });
            break;
          case 'tx-note':
            dispatch(decryptReceivedWebSocketTxNoteMessageAction(receivedSignalMessage));
            break;
          default:
            break;
        }
      }
    });
  };
};

export const stopListeningChatWebSocketAction = () => {
  return () => {
    const chatWebSocket = chat.getWebSocketInstance();
    chatWebSocket.stop();
  };
};
