// @flow
import ChatService from 'services/chat';
import { UPDATE_CHATS, ADD_MESSAGE, UPDATE_MESSAGES, RESET_UNREAD_MESSAGE } from 'constants/chatConstants';
import { Platform } from 'react-native';

const chat = new ChatService();

export const getExistingChatsAction = () => {
  return async (dispatch: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => null);
    await chat.client.getUnreadMessagesCount().then((response) => {
      const unread = JSON.parse(response);
      console.log('get messages count from chat action on ', Platform.OS, response)

      chats.map((item) => {
        item.unread = typeof unread.unreadCount[item.username] !== 'undefined' ? unread.unreadCount[item.username] : 0;
        return item;
      });
    }).catch(() => null);
    dispatch({
      type: UPDATE_CHATS,
      payload: chats,
    });
  };
};

export const resetUnreadAction = (contactUsername: string) => {
  return async (dispatch: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => null);

    console.log('chat actions', chats);

    chats.map((item) => {
      item.unread = item.username === contactUsername ? 0 : item.unread;
      console.log('true', item);
      return item;
    });

    dispatch({
      type: RESET_UNREAD_MESSAGE,
      payload: chats,
    });

    // await chat.client.getUnreadMessagesCount().then((response) => {
    //   const unread = JSON.parse(response);
    //   console.log('get messages count from chat action on ', Platform.OS, response)
    //
    //   chats.map((item) => {
    //     item.unread = typeof unread.unreadCount[item.username] !== 'undefined' ? unread.unreadCount[item.username] : 0;
    //     return item;
    //   });
    // }).catch(() => null);
    // dispatch({
    //   type: RESET_UNREAD_MESSAGE,
    //   payload: chats,
    // });
  };
};


export const sendMessageByContactAction = (username: string, message: Object) => {
  return async (dispatch: Function) => {
    await chat.client.sendMessageByContact(username, message.text).catch(() => null);
    const timestamp = new Date(message.createdAt).getTime();
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
    await chat.client.addContact(username).catch(() => null);
    if (loadEarlier) {
      // TODO: split message loading in bunches and load earlier on lick
    }
    await chat.client.receiveNewMessagesByContact(username).catch(() => null);
    const receivedMessages = await chat.client.getChatByContact(username).then(JSON.parse).catch(() => null);
    dispatch({
      type: UPDATE_MESSAGES,
      payload: { messages: receivedMessages, username },
    });
  };
};
