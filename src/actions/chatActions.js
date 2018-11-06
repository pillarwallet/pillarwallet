// @flow
import ChatService from 'services/chat';
import Toast from 'components/Toast';
import {
  UPDATE_CHATS,
  ADD_MESSAGE,
  UPDATE_MESSAGES,
  RESET_UNREAD_MESSAGE,
  FETCHING_CHATS,
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
        serverTimestamp: 0,
        savedTimestamp: 0,
      },
      username: _username,
      unread: newChats[_username],
    }))
    .concat(existingChats);
};

export const getExistingChatsAction = () => {
  return async (dispatch: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => []);
    const filteredChats = chats
      .filter(_chat => !!_chat.lastMessage && !!_chat.username);
    const {
      unreadCount: unreadChats = {},
    } = await chat.client.getUnreadMessagesCount().then(JSON.parse).catch(() => ({}));
    const newChats = mergeNewChats(unreadChats, filteredChats);
    const augmentedChats = newChats.map(item => {
      const unread = unreadChats[item.username] || 0;
      const lastMessage = item.lastMessage || {};
      return { ...item, unread, lastMessage };
    });

    dispatch({
      type: UPDATE_CHATS,
      payload: augmentedChats,
    });
  };
};

export const resetUnreadAction = (contactUsername: string) => {
  return async (dispatch: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => []);
    const filteredChats = chats
      .filter(_chat => !!_chat.lastMessage && !!_chat.username);
    const {
      unreadCount: unreadChats = {},
    } = await chat.client.getUnreadMessagesCount().then(JSON.parse).catch(() => ({}));
    const newChats = mergeNewChats(unreadChats, filteredChats);

    const augmentedChats = newChats.map(item => {
      const unread = item.username === contactUsername ? 0 : (unreadChats[item.username] || 0);
      const lastMessage = item.lastMessage || {};
      return { ...item, unread, lastMessage };
    });

    dispatch({
      type: RESET_UNREAD_MESSAGE,
      payload: augmentedChats,
    });
  };
};

export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Function) => {
    try {
      await chat.client.sendMessageByContact(username, message.text);
    } catch (e) {
      Toast.show({
        message: 'Unable to contact the server!',
        type: 'warning',
        title: 'Cannot send the message',
        autoClose: false,
      });
      return;
    }

    const timestamp = new Date(message.createdAt).getTime();
    const msg = {
      _id: timestamp,
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

export const getChatByContactAction = (username: string, avatar: string, loadEarlier: boolean = false) => {
  return async (dispatch: Function) => {
    dispatch({
      type: FETCHING_CHATS,
    });
    await chat.client.addContact(username).catch(() => null);
    if (loadEarlier) {
      // TODO: split message loading in bunches and load earlier on lick
    }
    await chat.client.receiveNewMessagesByContact(username).catch(() => null);
    const receivedMessages = await chat.client.getChatByContact(username).then(JSON.parse).catch(() => []);

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
    })).sort((a, b) => b.createdAt - a.createdAt);

    dispatch({
      type: UPDATE_MESSAGES,
      payload: { messages: updatedMessages, username },
    });
  };
};
