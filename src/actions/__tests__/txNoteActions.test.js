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
import { sendTxNoteByContactAction } from 'actions/txNoteActions';
import { ADD_TX_NOTE } from 'constants/txNoteConstants';

describe('Transaction Notes Actions', () => {
  const dispatchMock = jest.fn();
  const getState = jest.fn();

  let chatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  afterEach(() => {
    dispatchMock.mockClear();
    getState.mockClear();
  });

  describe('sendTxNoteByContactAction()', () => {
    describe('when the tx-note sent successfully', () => {
      let contact;
      let message;

      beforeEach(async () => {
        getState.mockImplementation(() => ({
          accessTokens: { data: [{ userId: 'user-id', userAccessToken: 'token' }] },
        }));
        contact = {
          username: 'test-username',
          id: 'user-id',
        };
        message = {
          text: 'lorem',
          txHash: 'txHashStringHere',
        };

        chatService.client.addContact = jest.fn().mockImplementation(() => Promise.resolve());
        chatService.client.sendSilentMessageByContact = jest.fn().mockImplementation(() => Promise.resolve());

        await sendTxNoteByContactAction(contact.username, message)(dispatchMock);
      });

      afterEach(() => {
        chatService.client.sendSilentMessageByContact.mockRestore();
        chatService.client.addContact.mockRestore();
      });

      it('should call the chatService.client.sendSilentMessageByContact function', () => {
        expect(chatService.client.sendSilentMessageByContact)
          .toBeCalledWith('tx-note', {
            username: contact.username,
            userId: null,
            userConnectionAccessToken: null,
            message: JSON.stringify(message),
          });
      });

      it('should call the dispatch function', () => {
        const msg = {
          text: message.text,
          txHash: message.txHash,
        };

        expect(dispatchMock).toBeCalledWith({
          type: ADD_TX_NOTE,
          payload: { txNote: msg },
        });
      });
    });

    describe('when sendSilentMessageByContact throws the exception', () => {
      let contact;

      beforeEach(async () => {
        contact = {
          username: 'test-username',
          id: 'user-id',
        };
        getState.mockImplementation(() => ({
          accessTokens: { data: [{ userId: 'user-id', userAccessToken: 'token' }] },
        }));
        chatService.client.addContact = jest.fn().mockImplementation(() => Promise.resolve());
        chatService.client.sendSilentMessageByContact = jest.fn().mockImplementation(() => Promise.reject());
        jest.spyOn(Toast, 'show');

        await sendTxNoteByContactAction(contact.username, {})(dispatchMock);
      });

      afterEach(() => {
        chatService.client.sendSilentMessageByContact.mockRestore();
        chatService.client.addContact.mockRestore();
        Toast.show.mockRestore();
      });

      it('should call the Toast.show function', () => {
        expect(Toast.show).toBeCalledWith({
          message: 'Unable to contact the server',
          type: 'warning',
          title: 'Cannot send the transaction note',
          autoClose: false,
        });
      });

      it('should NOT call the dispatch function', () => {
        expect(dispatchMock).not.toBeCalled();
      });
    });
  });
});
