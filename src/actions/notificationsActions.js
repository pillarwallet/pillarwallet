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
/* eslint-disable */
// TODO: eslint disabled because of commented out code below.
import debounce from 'lodash.debounce';
import isEmpty from 'lodash.isempty';
import Intercom from 'react-native-intercom';
import { NavigationActions } from 'react-navigation';
import { Alert } from 'react-native';
import get from 'lodash.get';
import { Sentry } from 'react-native-sentry';
import firebaseMessaging from '@react-native-firebase/messaging';

// actions
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import {
  fetchSmartWalletTransactionsAction,
  fetchTransactionsHistoryNotificationsAction,
  fetchAssetTransactionsAction,
} from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { updateConnectionsAction } from 'actions/connectionsActions';
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
import { fetchBadgesAction } from 'actions/badgesActions';

// constants
import {
  ADD_NOTIFICATION,
  UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
  SET_UNREAD_NOTIFICATIONS_STATUS,
  SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
  CONNECTION,
  SIGNAL,
  BCX,
  COLLECTIBLE,
  BADGE,
} from 'constants/notificationConstants';
import { PEOPLE, HOME, AUTH_FLOW, APP_FLOW, CHAT } from 'constants/navigationConstants';
import { ADD_WEBSOCKET_RECEIVED_MESSAGE, REMOVE_WEBSOCKET_SENT_MESSAGE } from 'constants/chatConstants';
import { MESSAGE_DISCONNECTED, UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import {
  CONNECTION_ACCEPTED_EVENT,
  CONNECTION_CANCELLED_EVENT,
  CONNECTION_DISCONNECTED_EVENT,
  CONNECTION_REJECTED_EVENT,
  CONNECTION_REQUESTED_EVENT,
  CONNECTION_COLLECTIBLE_EVENT,
} from 'constants/socketConstants';
import { STATUS_MUTED } from 'constants/connectionsConstants';

// services
import { navigate, getNavigationPathAndParamsState, updateNavigationLastScreenState } from 'services/navigation';
import Storage from 'services/storage';
import { WEBSOCKET_MESSAGE_TYPES } from 'services/chatWebSocket';
import ChatService from 'services/chat';
import { SOCKET } from 'services/sockets';

// utils
import { processNotification } from 'utils/notifications';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

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

export const setUnreadNotificationsStatusAction = (status: boolean) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: status });
  };
};

export const setUnreadChatNotificationsStatusAction = (status: boolean) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS, payload: status });
  };
};

export const fetchAllNotificationsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(fetchTransactionsHistoryNotificationsAction());
    dispatch(fetchSmartWalletTransactionsAction());
    dispatch(fetchInviteNotificationsAction());
    dispatch(fetchAllCollectiblesDataAction());
  };
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: wallet },
      invitations: { data: invitations },
      contacts: { data: contacts },
    } = getState();
    if (SOCKET && SOCKET.socket && SOCKET.socket.readyState === 1) {
      SOCKET.onMessage((response) => {
        let data;
        try {
          data = JSON.parse(response.data.msg);
        } catch (error) {
          // this shouldn't happen, but was reported to Sentry as issue, let's report with more details
          Sentry.captureMessage('Platform WebSocket notification parse failed', { extra: { response, error } });
          return; // unable to parse data, do not proceed
        }

        const senderUserId = get(data, 'senderUserData.id');

        if (data.type === CONNECTION_REQUESTED_EVENT) {
          dispatch(fetchInviteNotificationsAction());
        }
        if (
          data.type === CONNECTION_CANCELLED_EVENT ||
          data.type === CONNECTION_REJECTED_EVENT
        ) {
          const updatedInvitations = invitations.filter(({ id }) => id !== senderUserId);
          dispatch({
            type: UPDATE_INVITATIONS,
            payload: updatedInvitations,
          });
        }
        if (
          data.type === CONNECTION_ACCEPTED_EVENT ||
          data.type === CONNECTION_DISCONNECTED_EVENT
        ) {
          dispatch(updateConnectionsAction(senderUserId));
        }
        if (data.type === CONNECTION_COLLECTIBLE_EVENT) {
          dispatch(fetchAllCollectiblesDataAction());
        }
        if (data.type === BCX) {
          dispatch(fetchTransactionsHistoryNotificationsAction());
          dispatch(fetchSmartWalletTransactionsAction());
          dispatch(fetchAssetTransactionsAction(data.asset));
          dispatch(fetchAssetsBalancesAction());
        }
        if (data.type === BADGE) {
          dispatch(fetchBadgesAction(false));
        }
        if (
          data.type === CONNECTION_REQUESTED_EVENT ||
          data.type === CONNECTION_COLLECTIBLE_EVENT ||
          data.type === BCX ||
          data.type === BADGE
        ) {
          const payload = {
            title: response.notification.title,
            message: response.notification.body,
          };
          dispatch({ type: ADD_NOTIFICATION, payload });
          dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: true });
        }
      });
      return;
    }
    const firebaseNotificationsEnabled = await firebaseMessaging().hasPermission();
    if (!firebaseNotificationsEnabled) {
      try {
        await firebaseMessaging().requestPermission();
        await firebaseMessaging().getToken();
        dispatch(fetchAllNotificationsAction());
        disabledPushNotificationsListener = setInterval(() => {
          dispatch(fetchAllNotificationsAction());
        }, 30000);
        return;
      } catch (err) {
        //
      }
    }

    if (notificationsListener) return;
    // TODO: change to other notifications lib as firebase v6 excluded notifications
    // notificationsListener = firebase.notifications().onNotification(debounce(message => {
    //   if (!message._data || !Object.keys(message._data).length) return;
    //   if (checkForSupportAlert(message._data)) return;
    //   const notification = processNotification(message._data, wallet.address.toUpperCase());
    //   if (!notification) return;
    //   if (notification.type === BCX) {
    //     dispatch(fetchTransactionsHistoryNotificationsAction());
    //     dispatch(fetchSmartWalletTransactionsAction());
    //     dispatch(fetchAssetTransactionsAction(notification.asset));
    //     dispatch(fetchAssetsBalancesAction());
    //   }
    //   if (notification.type === COLLECTIBLE) {
    //     dispatch(fetchAllCollectiblesDataAction());
    //   }
    //   if (notification.type === BADGE) {
    //     dispatch(fetchBadgesAction());
    //   }
    //   if (notification.type === SIGNAL) {
    //     dispatch(getExistingChatsAction());
    //     const { params: navParams = null } = getNavigationPathAndParamsState() || {};
    //     if (!navParams) return;
    //     dispatch({ type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS, payload: true });
    //     const contact = contacts.find(c => c.username === notification.navigationParams.username);
    //     if (contact) {
    //       if (!!navParams.username && navParams.username === contact.username) {
    //         // $FlowFixMe - profileImage can be undefined
    //         dispatch(getChatByContactAction(contact.username, contact.id, contact.profileImage));
    //         return;
    //       }
    //       if (contact.status !== STATUS_MUTED) {
    //         dispatch({
    //           type: ADD_NOTIFICATION,
    //           payload: {
    //             ...notification,
    //             message: `${notification.message} from ${contact.username}`,
    //           },
    //         });
    //       }
    //     }
    //   }
    //   if (notification.type === CONNECTION) {
    //     if (notification.message === MESSAGE_DISCONNECTED) {
    //       dispatch(deleteChatAction(notification.title));
    //     }
    //
    //     dispatch(fetchInviteNotificationsAction());
    //   }
    //   if (notification.type !== SIGNAL) {
    //     dispatch({ type: ADD_NOTIFICATION, payload: notification });
    //     dispatch({ type: SET_UNREAD_NOTIFICATIONS_STATUS, payload: true });
    //   }
    // }, 500));
  };
};

export const stopListeningNotificationsAction = () => {
  return async () => {
    if (disabledPushNotificationsListener) clearInterval(disabledPushNotificationsListener);
    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};

export const startListeningOnOpenNotificationAction = () => {
  return async (dispatch: Dispatch) => {
    await SOCKET.init();
    // TODO: change to other notifications lib as firebase v6 excluded notifications
    // const notificationOpen = await firebase.notifications().getInitialNotification();
    // if (notificationOpen) {
    //   checkForSupportAlert(notificationOpen.notification._data);
    //   const { type, navigationParams } = processNotification(notificationOpen.notification._data) || {};
    //   if (type === SIGNAL) {
    //     dispatch(getExistingChatsAction());
    //   }
    //   const notificationRoute = NOTIFICATION_ROUTES[type] || null;
    //   updateNavigationLastScreenState({
    //     lastActiveScreen: notificationRoute,
    //     lastActiveScreenParams: navigationParams,
    //   });
    //   firebase.notifications().setBadge(0);
    // }
    // if (notificationsOpenerListener) return;
    // notificationsOpenerListener = firebase.notifications().onNotificationOpened((message) => {
    //   checkForSupportAlert(message.notification._data);
    //   firebase.notifications().setBadge(0);
    //   const pathAndParams = getNavigationPathAndParamsState();
    //   if (!pathAndParams) return;
    //   const currentFlow = pathAndParams.path.split('/')[0];
    //   const { type, asset, navigationParams = {} } = processNotification(message.notification._data) || {};
    //   const notificationRoute = NOTIFICATION_ROUTES[type] || null;
    //   updateNavigationLastScreenState({
    //     lastActiveScreen: notificationRoute,
    //     lastActiveScreenParams: navigationParams,
    //   });
    //   if (notificationRoute && currentFlow !== AUTH_FLOW) {
    //     if (type === BCX) {
    //       dispatch(fetchTransactionsHistoryNotificationsAction());
    //       dispatch(fetchSmartWalletTransactionsAction());
    //       dispatch(fetchAssetTransactionsAction(asset));
    //       dispatch(fetchAssetsBalancesAction());
    //     }
    //     if (type === COLLECTIBLE) {
    //       dispatch(fetchAllCollectiblesDataAction());
    //     }
    //     if (type === CONNECTION) {
    //       dispatch(fetchInviteNotificationsAction());
    //     }
    //     if (type === SIGNAL) {
    //       dispatch(getExistingChatsAction());
    //     }
    //
    //     if (type === BADGE) {
    //       dispatch(fetchBadgesAction(false));
    //     }
    //
    //     const routeName = notificationRoute || HOME;
    //     const navigateToAppAction = NavigationActions.navigate({
    //       routeName: APP_FLOW,
    //       params: {},
    //       action: NavigationActions.navigate({
    //         routeName,
    //         params: navigationParams,
    //       }),
    //     });
    //     navigate(navigateToAppAction);
    //   }
    // });
  };
};

export const stopListeningOnOpenNotificationAction = () => {
  return () => {
    if (!notificationsOpenerListener) return;
    notificationsOpenerListener();
    notificationsOpenerListener = null;
  };
};

export const startListeningChatWebSocketAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { session: { data: { isOnline } } } = getState();
    if (!isOnline) return;
    const chatWebSocket = chat.getWebSocketInstance();
    await chatWebSocket.listen();
    chatWebSocket.onOpen();
    chatWebSocket.onMessage(async webSocketMessage => {
      const {
        contacts: { data: contacts },
      } = getState();
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
      if (!isEmpty(receivedSignalMessage)) {
        const messageTag = Array.isArray(messageRequest.headers)
          ? messageRequest.headers.find(entry => entry.match(/message-tag/g)).split(':')[1]
          : '';
        const { source: senderUsername } = receivedSignalMessage;
        receivedSignalMessage.tag = messageTag;
        receivedSignalMessage.requestId = messageRequest.id;
        switch (messageTag) {
          case 'chat':
            dispatch({
              type: ADD_WEBSOCKET_RECEIVED_MESSAGE,
              payload: receivedSignalMessage,
            });
            const { params: navParams = null } = getNavigationPathAndParamsState() || {};

            if (!navParams) return;
            dispatch({
              type: SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
              payload: true,
            });

            dispatch(getExistingChatsAction());

            const contact = contacts.find(c => c.username === senderUsername) || {};

            if (contact) {
              if (!!navParams.username && navParams.username === contact.username) {
                // $FlowFixMe - profileImage can be undefined
                dispatch(getChatByContactAction(contact.username, contact.id, contact.profileImage));
                return;
              }

              const notification = processNotification({ msg: JSON.stringify({ type: 'signal' }) });

              if (notification == null || contact.status === STATUS_MUTED) return;

              dispatch({
                type: ADD_NOTIFICATION,
                payload: {
                  ...notification,
                  message: `${notification.message} from ${senderUsername}`,
                },
              });
            }
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
