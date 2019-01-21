// @flow
import ChatService from 'services/chat';
import Toast from 'components/Toast';
import { saveDbAction } from 'actions/dbActions';
import { extractTxNotesFromMessages } from 'utils/txNotes';
import {
  UPDATE_TX_NOTES,
  ADD_TX_NOTE,
} from 'constants/txNoteConstants';
import { ADD_WEBSOCKET_SENT_MESSAGE } from 'constants/chatConstants';

const chat = new ChatService();

export const getExistingTxNotesAction = () => {
  return async (dispatch: Function) => {
    const txNotesRaw = await chat.client.getExistingMessages('tx-note').then(JSON.parse).catch(() => []);
    const txNotes = extractTxNotesFromMessages(txNotesRaw);
    dispatch(saveDbAction('txNotes', { txNotes }, true));
    dispatch({
      type: UPDATE_TX_NOTES,
      payload: txNotes,
    });
  };
};

export const sendTxNoteByContactAction = (username: string, userId: string, message: Object) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accessTokens: { data: accessTokens },
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
    try {
      const content = JSON.stringify({ text: message.text, txHash: message.txHash });
      const params = {
        username,
        userId,
        userConnectionAccessToken,
        message: content,
      };
      await chat.sendMessage('tx-note', params, true, (requestId) => {
        // callback is ran if websocket message sent
        dispatch({
          type: ADD_WEBSOCKET_SENT_MESSAGE,
          payload: {
            tag: 'tx-note',
            params,
            requestId,
          },
        });
      });
    } catch (e) {
      Toast.show({
        message: 'Unable to contact the server',
        type: 'warning',
        title: 'Cannot send the transaction note',
        autoClose: false,
      });
      return;
    }

    const msg = {
      text: message.text,
      txHash: message.txHash,
    };

    dispatch({
      type: ADD_TX_NOTE,
      payload: { txNote: msg },
    });
  };
};

export const getTxNoteByContactAction = (username: string, userId: string) => {
  return async (dispatch: Function, getState: Function) => {
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

    await webSocketMessagesReceived
      .filter(wsMessage => wsMessage.source === username && wsMessage.tag === 'tx-note')
      .forEach(async (wsMessage) => {
        await chat.client.decryptSignalMessage('tx-note', JSON.stringify(wsMessage));
        await chat.deleteMessage(wsMessage.source, wsMessage.timestamp, wsMessage.requestId);
      });

    await chat.client.receiveNewMessagesByContact(username, 'tx-note').catch(() => null);
    await chat.client.getMessagesByContact(username, 'tx-note').catch(() => []);

    await dispatch(getExistingTxNotesAction());
  };
};

export const addContactAndSendWebSocketTxNoteMessageAction = (tag: string, params: Object) => {
  return async () => {
    const { username, userId, userConnectionAccessToken } = params;
    try {
      await chat.client.addContact(username, userId, userConnectionAccessToken, true);
      await chat.sendMessage(tag, params, true);
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

export const decryptReceivedWebSocketTxNoteMessageAction = (message: Object) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accessTokens: { data: accessTokens },
      contacts: { data: contacts },
    } = getState();
    const contact = contacts.find(c => c.username === message.source) || {};
    const connectionAccessTokens = accessTokens.find(({ userId: connectionUserId }) => connectionUserId === contact.id);
    if (!Object.keys(connectionAccessTokens).length) {
      return;
    }
    const { userAccessToken: userConnectionAccessToken } = connectionAccessTokens;
    await chat.client.addContact(message.source, contact.id, userConnectionAccessToken, false).then(async () => {
      await chat.client.decryptSignalMessage('tx-note', JSON.stringify(message));
      await chat.deleteMessage(message.source, message.timestamp, message.requestId);
    }).catch(e => {
      if (e.code === 'ERR_ADD_CONTACT_FAILED') {
        Toast.show({
          message: e.message,
          type: 'warning',
          title: 'Cannot retrieve remote user',
          autoClose: false,
        });
      }
    });
  };
};
