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

const addNewChatToChats = (unreadCount, chats) => {
  return Object.keys(unreadCount).map((key) => {
    if (!chats.find(({ username }) => key === username)) {
      return {
        lastMessage: {
          content: '',
          username: key,
          device: 1,
          serverTimestamp: 0,
          savedTimestamp: 0,
        },
        username: key,
        unread: unreadCount[key],
      };
    }
    return {};
  });
};

export const getExistingChatsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => []);
    const filteredChats = chats.filter((thisChat) => { return typeof thisChat.lastMessage !== 'undefined'; });

    const { contacts: { data: contacts } } = getState();
    if (!contacts.length) return;

    const { unreadCount = {} } = await chat.client.getUnreadMessagesCount().then(JSON.parse).catch(() => ({}));
    const newChats = addNewChatToChats(unreadCount, chats);
    const augmentedChats = filteredChats.map(item => {
      const unread = unreadCount[item.username] || 0;
      return { ...item, unread };
    });

    const augmentedChatsWithNewChats = augmentedChats.concat(newChats.filter(value => Object.keys(value).length !== 0));

    dispatch({
      type: UPDATE_CHATS,
      payload: augmentedChatsWithNewChats,
    });
  };
};

export const resetUnreadAction = (contactUsername: string) => {
  return async (dispatch: Function, getState: Function) => {
    const chats = await chat.client.getExistingChats().then(JSON.parse).catch(() => []);
    const filteredChats = chats.filter((thisChat) => { return typeof thisChat.lastMessage !== 'undefined'; });

    const { contacts: { data: contacts } } = getState();
    if (!contacts.length) return;

    const { unreadCount = {} } = await chat.client.getUnreadMessagesCount().then(JSON.parse).catch(() => ({}));
    const newChats = addNewChatToChats(unreadCount, chats);

    const augmentedChats = filteredChats.map(item => {
      const unread = item.username === contactUsername ? 0 : (unreadCount[item.username] || 0);
      return { ...item, unread };
    });
    const augmentedChatsWithNewChats = augmentedChats.concat(newChats.filter(value => Object.keys(value).length !== 0));

    dispatch({
      type: RESET_UNREAD_MESSAGE,
      payload: augmentedChatsWithNewChats,
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
