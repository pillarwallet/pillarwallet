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
import partition from 'lodash.partition';

// actions
import { setUnreadChatNotificationsStatusAction } from 'actions/notificationsActions';

// components
import Toast from 'components/Toast';

// constants
import {
  UPDATE_CHATS,
  ADD_MESSAGE,
  UPDATE_MESSAGES,
  FETCHING_CHATS,
  DELETE_CHAT,
  ADD_WEBSOCKET_SENT_MESSAGE,
  DELETE_CONTACT,
  CHAT_DECRYPTING_FINISHED,
  REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGE,
  ADD_CHAT_DRAFT,
  CLEAR_CHAT_DRAFT,
  RESET_UNREAD_MESSAGE,
} from 'constants/chatConstants';

// services
import ChatService from 'services/chat';
import Storage from 'services/storage';

// utils
import { getConnectionStateCheckParamsByUsername, getConnectionStateCheckParamsByUserId } from 'utils/chat';
import { isCaseInsensitiveMatch } from 'utils/common';
import { isContactAvailable } from 'utils/contacts';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';

const chat = new ChatService();
const storage = Storage.getInstance('db');

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

export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { session: { data: { isOnline } } } = getState();
    if (!isOnline) {
      Toast.show({
        message: 'Cannot send message offline',
        type: 'warning',
        autoClose: false,
      });
      return;
    }
    try {
      const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
      const params = {
        username,
        message: message.text,
        ...connectionStateCheckParams,
      };
      if (!params.userId) {
        Toast.show({
          message: `Unable to send message to ${username}`,
          type: 'warning',
          autoClose: false,
        });
        return;
      }
      await chat.sendMessage('chat', params, false, (requestId) => {
        // callback is ran if websocket message sent
        dispatch({
          type: ADD_WEBSOCKET_SENT_MESSAGE,
          payload: {
            tag: 'chat',
            params,
            requestId,
          },
        });
      });
    } catch (e) {
      Toast.show({
        message: 'Unable to contact the server',
        type: 'warning',
        title: 'Cannot send the message',
        autoClose: false,
      });
      return;
    }

    const timestamp = new Date(message.createdAt).getTime();
    const msg = {
      _id: timestamp.toString(),
      createdAt: timestamp,
      text: message.text,
      user: {
        _id: message.user._id,
        name: message.user._id,
      },
    };

    dispatch({
      type: ADD_MESSAGE,
      payload: { message: msg, username },
    });
  };
};

export const getChatDraftByContactAction = (contactId: string) => {
  return async (dispatch: Dispatch) => {
    const { drafts = {} } = await storage.get('chat');
    const [chatDraft, chatDrafts] = partition(drafts, { contactId });
    const { draftText = '' } = chatDraft[0] || {};

    if (!draftText) { return; }

    dispatch(saveDbAction('chat', { drafts: chatDrafts }, true));
    dispatch({
      type: ADD_CHAT_DRAFT,
      payload: { draftText },
    });
  };
};

export const clearChatDraftStateAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: CLEAR_CHAT_DRAFT,
    });
  };
};

export const saveDraftAction = (contactId: string, draftText: string) => {
  return async (dispatch: Dispatch) => {
    const chatStorage = await storage.get('chat');
    const { drafts = [] } = chatStorage || {};

    const chatDrafts = drafts.filter((draft) => draft.contactId !== contactId);
    chatDrafts.push({ contactId, draftText });
    dispatch(saveDbAction('chat', { drafts: chatDrafts }, true));
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
    if (!isContactAvailable(recipientContact)) {
      Toast.show({
        message: 'You disconnected or blocked this user',
        type: 'warning',
        autoClose: true,
      });
      return;
    }

    dispatch({ type: FETCHING_CHATS });

    const connectionStateCheckParams = getConnectionStateCheckParamsByUserId(getState, targetUserId);
    const addContactParams = { username, ...connectionStateCheckParams };

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
    const { username } = params;
    const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
    const addContactParams = {
      username,
      ...connectionStateCheckParams,
    };
    if (!addContactParams.userId) {
      Toast.show({
        message: `Unable to send message to ${username}`,
        type: 'warning',
        autoClose: false,
      });
      return;
    }
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
