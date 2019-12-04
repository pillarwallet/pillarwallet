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

// actions
import { saveDbAction } from 'actions/dbActions';

// constants
import {
  UPDATE_TX_NOTES,
  ADD_TX_NOTE,
  TX_NOTE_DECRYPTING_FINISHED,
  TX_NOTE_DECRYPTING_STARTED,
} from 'constants/txNoteConstants';
import { ADD_WEBSOCKET_SENT_MESSAGE } from 'constants/chatConstants';

// components
import Toast from 'components/Toast';

// services
import ChatService from 'services/chat';

// utils
import { isCaseInsensitiveMatch } from 'utils/common';
import { isContactAvailable } from 'utils/contacts';
import { extractTxNotesFromMessages } from 'utils/txNotes';
import { getConnectionStateCheckParamsByUsername } from 'utils/chat';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

const chat = new ChatService();

export const getExistingTxNotesAction = () => {
  return async (dispatch: Dispatch) => {
    const txNotesRaw = await chat.client.getExistingMessages('tx-note').then(JSON.parse).catch(() => []);
    const txNotes = extractTxNotesFromMessages(txNotesRaw);
    dispatch(saveDbAction('txNotes', { txNotes }, true));
    dispatch({
      type: UPDATE_TX_NOTES,
      payload: txNotes,
    });
  };
};

export const sendTxNoteByContactAction = (username: string, message: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
    const addContactParams = {
      username,
      ...connectionStateCheckParams,
    };

    if (!addContactParams.userId) {
      Toast.show({
        message: 'Tx note send failed',
        type: 'warning',
        autoClose: false,
      });
      return;
    }

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
    try {
      const content = JSON.stringify({ text: message.text, txHash: message.txHash });
      const params = {
        username,
        message: content,
        ...connectionStateCheckParams,
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

export const getTxNoteByContactAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      chat: { data: { isDecrypting } },
      session: { data: { isOnline } },
      contacts: { data: contacts },
    } = getState();
    if (isDecrypting || !isOnline) return;

    const recipientContact = contacts.find((contact) => isCaseInsensitiveMatch(username, contact.username));
    if (!isContactAvailable(recipientContact)) return;

    dispatch({ type: TX_NOTE_DECRYPTING_STARTED });

    const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
    const addContactParams = { username, ...connectionStateCheckParams };
    if (!addContactParams.userId) {
      Toast.show({
        message: `Unable to retrieve tx note for ${username}`,
        type: 'warning',
      });
      return;
    }

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

    const data = await chat.client.receiveNewMessagesByContact(username, 'tx-note')
      .then(JSON.parse)
      .catch(() => {
      });

    if (data !== undefined && Object.keys(data).length) {
      const { messages: newRemoteMessages } = data;
      if (newRemoteMessages !== undefined && newRemoteMessages.length) {
        const remotePromises = newRemoteMessages.map(async remoteMessage => {
          const { username: rmUsername, serverTimestamp: rmServerTimestamp } = remoteMessage;
          await chat.deleteMessage(rmUsername, rmServerTimestamp);
        });
        await Promise.all(remotePromises);
      }
    }

    dispatch({
      type: TX_NOTE_DECRYPTING_FINISHED,
    });

    await dispatch(getExistingTxNotesAction());
  };
};

export const addContactAndSendWebSocketTxNoteMessageAction = (tag: string, params: Object) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { username } = params;
    const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
    const addContactParams = {
      username,
      ...connectionStateCheckParams,
    };
    if (!addContactParams.userId) {
      Toast.show({
        message: `Can't send message to ${username}`,
        type: 'warning',
      });
      return;
    }
    try {
      await chat.client.addContact(addContactParams, true);
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
  return async (dispatch: Dispatch, getState: GetState) => {
    const { source: username } = message;
    const connectionStateCheckParams = getConnectionStateCheckParamsByUsername(getState, username);
    const addContactParams = {
      username,
      ...connectionStateCheckParams,
    };
    if (!addContactParams.userId) {
      Toast.show({
        message: `Unable to retrieve tx note for ${username}`,
        type: 'warning',
      });
      return;
    }
    await chat.client.addContact(addContactParams, false).then(async () => {
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
