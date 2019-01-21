// @flow
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
  REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGES,
  DELETE_CONTACT,
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
        unreadChats[wsMessage.source] = {
          ...unreadChats[wsMessage.source],
          count: count + 1,
          latest: latest > wsMessage.timestamp ? latest : wsMessage.timestamp,
        };
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

export const sendMessageByContactAction = (username: string, userId: string, message: Object) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accessTokens: { data: accessTokens },
    } = getState();
    const connectionAccessTokens = accessTokens.find(({ userId: connectionUserId }) => connectionUserId === userId);
    if (!Object.keys(connectionAccessTokens).length) {
      return;
    }
    const { userAccessToken: userConnectionAccessToken } = connectionAccessTokens;
    try {
      const params = {
        username,
        userId,
        userConnectionAccessToken,
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
    dispatch({
      type: FETCHING_CHATS,
    });
    const {
      accessTokens: { data: accessTokens },
      chat: { data: { webSocketMessages: { received: webSocketMessagesReceived } } },
    } = getState();
    const connectionAccessTokens = accessTokens.find(({ userId: connectionUserId }) => connectionUserId === userId);
    if (!Object.keys(connectionAccessTokens).length) {
      return;
    }
    const { userAccessToken: userConnectionAccessToken } = connectionAccessTokens;
    await chat.client.addContact(username, userId, userConnectionAccessToken, false).catch(e => {
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

    await webSocketMessagesReceived
      .filter(wsMessage => wsMessage.source === username && wsMessage.tag === 'chat')
      .forEach(async (wsMessage) => {
        await chat.client.decryptSignalMessage('chat', JSON.stringify(wsMessage));
        await chat.deleteMessage(wsMessage.source, wsMessage.timestamp, wsMessage.requestId);
      });

    dispatch({
      type: REMOVE_WEBSOCKET_RECEIVED_USER_MESSAGES,
      payload: username,
    });

    await chat.client.receiveNewMessagesByContact(username, 'chat')
      .catch(() => null);
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
    const { username, userId, userConnectionAccessToken } = params;
    try {
      await chat.client.addContact(username, userId, userConnectionAccessToken, true);
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
