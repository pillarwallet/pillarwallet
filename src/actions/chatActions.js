// @flow
import ChatService from 'services/chat';
import { UPDATE_CHATS, ADD_MESSAGE, UPDATE_MESSAGES } from 'constants/chatConstants';

const chat = new ChatService();

export const addChatContactAction = (username: string) => {
  return async () => {
    await chat.client.addContact(username).catch(() => null);
  };
};

export const getExistingChatsAction = () => {
  return async (dispatch: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => null);
    dispatch({
      type: UPDATE_CHATS,
      payload: chats,
    });
  };
};

export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Function) => {
    await chat.client.sendMessageByContact(username, message.text).catch(() => null);
    const timestamp = new Date(message.createdAt).getTime() / 1000;
    const msg = {
      content: message.text,
      savedTimestamp: timestamp,
      serverTimestamp: timestamp,
      username: message.user._id,
    };

    dispatch({
      type: ADD_MESSAGE,
      payload: { message: msg, username },
    });
  };
};

export const getChatByContactAction = (username: string, loadEarlier: boolean = false) => {
  return async (dispatch: Function) => {
    if (loadEarlier) {
      await chat.client.receiveNewMessagesByContact(username).catch(() => null);
    }
    const receivedMessages = await chat.client.getChatByContact(username).then(JSON.parse).catch(() => null);
    dispatch({
      type: UPDATE_MESSAGES,
      payload: { messages: receivedMessages, username },
    });
  };
};
