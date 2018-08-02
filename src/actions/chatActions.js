// @flow
import ChatService from 'services/chat';
import {
  UPDATE_CHATS,
  ADD_MESSAGE,
  UPDATE_MESSAGES,
  RESET_UNREAD_MESSAGE,
  FETCHING_CHATS,
} from 'constants/chatConstants';
import { Platform } from 'react-native';

const chat = new ChatService();

const generateChatInfo = (contacts, chats) => {
  const chatsWithContacts = contacts.map((contact) => {
    const newChat = {
      content: 'Start new conversation',
      device: 1,
      savedTimestamp: '',
      serverTimestamp: '',
      username: '',
    };

    const existingChat = chats.find(({ username }) => contact.username === username) || { lastMessage: newChat };
    const chatInfo = {
      lastMessage: existingChat.lastMessage ? existingChat.lastMessage : newChat,
      username: contact.username,
      unread: 0,
    };

    return chatInfo;
  });
  return chatsWithContacts;
};

export const getExistingChatsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => null);
    const { contacts: { data: contacts } } = getState();
    if (!contacts) return;
    const messagesOfContacts = generateChatInfo(contacts, chats);
    await chat.client.getUnreadMessagesCount().then((response) => {
      const { unreadCount } = JSON.parse(response);
      messagesOfContacts.forEach((item) => {
        item.unread = typeof unreadCount[item.username] !== 'undefined' ? unreadCount[item.username] : 0;
      });
    }).catch(() => {});

    console.log('INFO contacts', Platform.OS, contacts);
    console.log('INFO chats', Platform.OS, chats);
    console.log('INFO generated chats', Platform.OS, messagesOfContacts);

    dispatch({
      type: UPDATE_CHATS,
      payload: messagesOfContacts,
    });
  };
};

export const resetUnreadAction = (contactUsername: string) => {
  return async (dispatch: Function, getState: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => null);
    const { contacts: { data: contacts } } = getState();
    if (!contacts) return;
    const messagesOfContacts = generateChatInfo(contacts, chats);
    await chat.client.getUnreadMessagesCount().then((response) => {
      const { unreadCount } = JSON.parse(response);
      messagesOfContacts.forEach((item) => {
        item.unread = item.username === contactUsername ? 0 : unreadCount[item.username];
      });
    }).catch(() => null);
    dispatch({
      type: RESET_UNREAD_MESSAGE,
      payload: messagesOfContacts,
    });
  };
};

export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Function) => {
    await chat.client.sendMessageByContact(username, message.text).catch(() => null);
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
    const receivedMessages = await chat.client.getChatByContact(username).then(JSON.parse).catch(() => null);

    const updatedMessages = await receivedMessages.map((message) => ({
      _id: message.serverTimestamp,
      text: message.content,
      createdAt: new Date(message.serverTimestamp),
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
