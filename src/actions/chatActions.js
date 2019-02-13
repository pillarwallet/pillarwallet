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
import ChatService from 'services/chat';
import Toast from 'components/Toast';
import {
  UPDATE_CHATS,
  ADD_MESSAGE,
  UPDATE_MESSAGES,
  RESET_UNREAD_MESSAGE,
  FETCHING_CHATS,
  DELETE_CHAT,
  ADD_WEBSOCKET_SENT_MESSAGE,
  DELETE_CONTACT,
  CHAT_DECRYPTING_FINISHED,
  REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGE,
} from 'constants/chatConstants';

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
  return async (dispatch: Function, getState: Function) => {
    const {
      chat: { data: { webSocketMessages: { received: webSocketMessagesReceived } } },
    } = getState();
    const chats = await chat.client.getExistingMessages('chat').then(JSON.parse).catch(() => []);
    const filteredChats = chats.filter(_chat => !!_chat.lastMessage && !!_chat.username);
    const {
      unread: unreadChats = {},
    } = await chat.client.getUnreadMessagesCount('chat').then(JSON.parse).catch(() => ({}));
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

export const resetUnreadAction = (username: string) => ({
  type: RESET_UNREAD_MESSAGE,
  payload: { username },
});

export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Function) => {
    try {
      const params = {
        username,
        userId: null,
        userConnectionAccessToken: null,
        message: message.text,
      };
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

export const getChatByContactAction = (
  username: string,
  userId: string,
  avatar: string,
  loadEarlier: boolean = false,
) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      chat: { data: { isDecrypting } },
    } = getState();
    if (isDecrypting) return;
    dispatch({
      type: FETCHING_CHATS,
    });
    await chat.client.addContact(username, null, null, false).catch(e => {
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

    if (data !== undefined && Object.keys(data).length) {
      const { messages: newRemoteMessages } = data;
      if (newRemoteMessages !== undefined && newRemoteMessages.length) {
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
      chat: { data: { webSocketMessages: { received: webSocketMessagesReceived } } },
    } = getState();

    if (webSocketMessagesReceived !== undefined && webSocketMessagesReceived.length) {
      const webSocketPromises = webSocketMessagesReceived
        .filter(wsMessage => wsMessage.source === username && wsMessage.tag === 'chat')
        .map(async wsMessage => {
          const { source, timestamp } = wsMessage;
          await chat.client.decryptSignalMessage('chat', JSON.stringify(wsMessage));
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

    const receivedMessages = await chat.client.getMessagesByContact(username, 'chat')
      .then(JSON.parse)
      .catch(() => []);

    const updatedMessages = await receivedMessages.map((message, index) => ({
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
  };
};

export const addContactAndSendWebSocketChatMessageAction = (tag: string, params: Object) => {
  return async () => {
    const { username } = params;
    try {
      await chat.client.addContact(username, null, null, true);
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
  return async (dispatch: Function) => {
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
  return async (dispatch: Function) => {
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
