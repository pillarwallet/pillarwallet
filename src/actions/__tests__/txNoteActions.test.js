// @flow
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

        await sendTxNoteByContactAction(contact.username, contact.id, message)(dispatchMock, getState);
      });

      afterEach(() => {
        chatService.client.sendSilentMessageByContact.mockRestore();
        chatService.client.addContact.mockRestore();
      });

      it('should call the chatService.client.sendSilentMessageByContact function', () => {
        expect(chatService.client.sendSilentMessageByContact)
          .toBeCalledWith('tx-note', {
            username: contact.username,
            userId: contact.id,
            userConnectionAccessToken: 'token',
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

        await sendTxNoteByContactAction(contact.username, contact.id, {})(dispatchMock, getState);
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
