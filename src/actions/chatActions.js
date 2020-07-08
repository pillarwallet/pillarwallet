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

import isEmpty from 'lodash.isempty';

// actions
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';

// components
import Toast from 'components/Toast';

// constants
import {
  UPDATE_CHATS,
  UPDATE_MESSAGES,
  FETCHING_CHATS,
  DELETE_CHAT,
  DELETE_CONTACT,
  CHAT_DECRYPTING_FINISHED,
  REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGE,
  RESET_UNREAD_MESSAGE,
} from 'constants/chatConstants';

// services
import ChatService from 'services/chat';

// utils
import { isCaseInsensitiveMatch } from 'utils/common';
import { isContactAvailable, findContactIdByUsername } from 'utils/contacts';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

const chat = new ChatService();

const mergeNewChats = (newChats, existingChats) => {
  return Object.keys(newChats)
    .filter(_username => !existingChats.find(({ username }) => _username === username))
    .map(_username => ({
      lastMessage: {
        content: '',
        username: _username,
        device: 1,
        serverTimestamp: newChats[_username].latest,
        savedTimestamp: 0,
      },
      username: _username,
      unread: newChats[_username].count,
    }))
    .concat(existingChats);
};

export const getExistingChatsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      chat: { data: { webSocketMessages: { received: webSocketMessagesReceived } } },
      session: { data: { isOnline } },
    } = getState();
    const chats = await chat.client.getExistingMessages('chat').then(JSON.parse).catch(() => []);
    const filteredChats = chats.filter(_chat => !!_chat.lastMessage && !!_chat.username);
    let unreadChats = {};
    if (isOnline) {
      ({ unread: unreadChats = {} } = await chat.client.getUnreadMessagesCount('chat')
        .then(JSON.parse)
        .catch(() => ({})));
    }
    webSocketMessagesReceived.filter(wsMessage => wsMessage.tag === 'chat').forEach(wsMessage => {
      if (!unreadChats[wsMessage.source]) {
        unreadChats[wsMessage.source] = { count: 1, latest: wsMessage.timestamp };
      } else {
        const { count, latest } = unreadChats[wsMessage.source];
        if (latest < wsMessage.timestamp) {
          unreadChats[wsMessage.source] = {
            ...unreadChats[wsMessage.source],
            count: count + 1,
            latest: wsMessage.timestamp,
          };
        }
      }
    });
    const newChats = mergeNewChats(unreadChats, filteredChats);
    const augmentedChats = newChats.map(item => {
      const unread = unreadChats[item.username] ? unreadChats[item.username].count : 0;
      const lastMessage = item.lastMessage || {};
      if (unreadChats[item.username]) lastMessage.serverTimestamp = unreadChats[item.username].latest;
      return { ...item, unread, lastMessage };
    });

    dispatch({
      type: UPDATE_CHATS,
      payload: augmentedChats,
    });
  };
};

export const getChatByContactAction = (
  username: string,
  targetUserId: string,
  avatar: string,
  loadEarlier: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      chat: { data: { isDecrypting } },
      session: { data: { isOnline } },
      contacts: { data: contacts },
      user: { data: { id: userId } },
    } = getState();
    if (isDecrypting) return;

    if (!isOnline) {
      Toast.show({
        message: 'Cannot get new messages while offline',
        type: 'warning',
        autoClose: true,
      });
      return;
    }

    const recipientContact = contacts.find((contact) => isCaseInsensitiveMatch(username, contact.username));
    if (!recipientContact || !isContactAvailable(recipientContact)) {
      Toast.show({
        message: 'You disconnected or blocked this user',
        type: 'warning',
        autoClose: true,
      });
      return;
    }

    dispatch({ type: FETCHING_CHATS });

    const addContactParams = { username, userId, targetUserId };
    await chat.client.addContact(addContactParams, false).catch(e => {
      if (e.code === 'ERR_ADD_CONTACT_FAILED') {
        Toast.show({
          message: e.message,
          type: 'warning',
          title: 'Cannot retrieve remote user',
          autoClose: false,
        });
      }
    });

    if (loadEarlier) {
      // TODO: split message loading in bunches and load earlier on lick
    }

    const data = await chat.client.receiveNewMessagesByContact(username, 'chat')
      .then(JSON.parse)
      .catch(() => {});

    if (!isEmpty(data)) {
      const { messages: newRemoteMessages } = data;
      if (!isEmpty(newRemoteMessages)) {
        const remotePromises = newRemoteMessages.map(async remoteMessage => {
          const { username: rmUsername, serverTimestamp: rmServerTimestamp } = remoteMessage;
          await chat.deleteMessage(rmUsername, rmServerTimestamp);
          dispatch({
            type: REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGE,
            payload: {
              username: rmUsername,
              timestamp: rmServerTimestamp,
            },
          });
        });
        await Promise.all(remotePromises);
      }
    }

    const {
      chat: { data: { chats: existingChats, webSocketMessages: { received: webSocketMessagesReceived } } },
    } = getState();

    if (!isEmpty(webSocketMessagesReceived)) {
      const webSocketPromises = webSocketMessagesReceived
        .filter(wsMessage => wsMessage.source === username && wsMessage.tag === 'chat')
        .map(async wsMessage => {
          const { source, timestamp } = wsMessage;
          await chat.client.decryptSignalMessage('chat', JSON.stringify(wsMessage)).catch(() => {});
          await chat.deleteMessage(source, timestamp, wsMessage.requestId);
          dispatch({
            type: REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGE,
            payload: {
              username: source,
              timestamp,
            },
          });
        });
      await Promise.all(webSocketPromises);
    }

    dispatch({
      type: CHAT_DECRYPTING_FINISHED,
    });

    // will work offline
    const receivedMessages = await chat.client.getMessagesByContact(username, 'chat')
      .then(JSON.parse)
      .catch(() => []);

    const updatedMessages = receivedMessages
      .map((message, index) => ({
        _id: `${message.serverTimestamp}_${index}`,
        text: message.content,
        createdAt: new Date(message.serverTimestamp),
        status: message.status,
        type: message.type,
        user: {
          _id: message.username,
          name: message.username,
          avatar,
        },
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    dispatch({
      type: UPDATE_MESSAGES,
      payload: { messages: updatedMessages, username },
    });

    if (updatedMessages.length) {
      const {
        user: { name: lastMessageSenderUsername },
        text,
        createdAt,
      } = updatedMessages[0];

      if (lastMessageSenderUsername) {
        dispatch({
          type: RESET_UNREAD_MESSAGE,
          payload: {
            username,
            lastMessage: {
              content: text,
              username: lastMessageSenderUsername,
              device: 1,
              serverTimestamp: createdAt,
              savedTimestamp: 0,
            },
          },
        });
      }
    }

    // check if there are any other unread messages left
    if (existingChats.find(
      ({ username: messageUsername, unread }) => messageUsername !== username && !!unread,
    )) return;

    // no more unread messages left, set unread to false
    dispatch(setUnreadChatNotificationsStatusAction(false));
  };
};

export const addContactAndSendWebSocketChatMessageAction = (tag: string, params: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      contacts: { data: contacts },
      user: { data: { id: userId } },
    } = getState();
    const { username } = params;
    const targetUserId = findContactIdByUsername(contacts, username);
    const addContactParams = {
      username,
      userId,
      targetUserId,
    };
    try {
      await chat.client.addContact(addContactParams, true);
      await chat.sendMessage(tag, params, false);
    } catch (e) {
      if (e.code === 'ERR_ADD_CONTACT_FAILED') {
        Toast.show({
          message: e.message,
          type: 'warning',
          title: 'Cannot retrieve remote user',
          autoClose: false,
        });
      }
    }
  };
};

export const deleteChatAction = (username: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await chat.client.deleteContactMessages(username, 'chat');

      dispatch({
        type: DELETE_CHAT,
        payload: username,
      });

      return true;
    } catch (e) {
      Toast.show({
        message: `Unable to delete chat for ${username}!`,
        type: 'warning',
        title: 'Cannot delete chat',
        autoClose: false,
      });
      return false;
    }
  };
};

export const deleteContactAction = (username: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await chat.client.deleteContact(username);

      dispatch({
        type: DELETE_CONTACT,
        payload: username,
      });

      return true;
    } catch (e) {
      Toast.show({
        message: 'Unable to contact the server!',
        type: 'warning',
        title: 'Cannot delete contact',
        autoClose: false,
      });
      return false;
    }
  };
};
