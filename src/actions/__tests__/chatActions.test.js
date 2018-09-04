// @flow
import ChatService from 'services/chat';
import Toast from 'components/Toast';
import { sendMessageByContactAction } from 'actions/chatActions';
import { ADD_MESSAGE } from 'constants/chatConstants';

describe('Chat Actions', () => {
  const dispatchMock = jest.fn();

  let chatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  afterEach(() => {
    dispatchMock.mockClear();
  });

  describe('sendMessageByContactAction()', () => {
    describe('when the message sent successfully', () => {
      let username;
      let message;
      let timestamp;

      beforeEach(async () => {
        username = 'test-username';
        message = {
          text: 'lorem',
          user: { _id: 'user-id' },
          createdAt: '2018-01-01',
        };
        timestamp = new Date(message.createdAt).getTime();

        chatService.client.sendMessageByContact = jest.fn().mockImplementation(() => Promise.resolve());

        await sendMessageByContactAction(username, message)(dispatchMock);
      });

      afterEach(() => {
        chatService.client.sendMessageByContact.mockRestore();
      });

      it('should call the chatService.client.sendMessageByContact function', () => {
        expect(chatService.client.sendMessageByContact).toBeCalledWith(username, message.text);
      });

      it('should call the dispatch function', () => {
        const msg = {
          _id: timestamp,
          createdAt: timestamp,
          text: message.text,
          user: {
            _id: message.user._id,
            name: message.user._id,
          },
        };

        expect(dispatchMock).toBeCalledWith({
          type: ADD_MESSAGE,
          payload: { message: msg, username },
        });
      });
    });

    describe('when sendMessageByContact throws the exception', () => {
      beforeEach(async () => {
        chatService.client.sendMessageByContact = jest.fn().mockImplementation(() => Promise.reject());
        jest.spyOn(Toast, 'show');

        await sendMessageByContactAction('userName', {})(dispatchMock);
      });

      afterEach(() => {
        chatService.client.sendMessageByContact.mockRestore();
        Toast.show.mockRestore();
      });

      it('should call the Toast.show function', () => {
        expect(Toast.show).toBeCalledWith({
          message: 'Unable to contact the server!',
          type: 'warning',
          title: 'Cannot send the message',
          autoClose: false,
        });
      });

      it('should NOT call the dispatch function', () => {
        expect(dispatchMock).not.toBeCalled();
      });
    });
  });
});
