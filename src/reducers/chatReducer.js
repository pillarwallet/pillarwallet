// @flow
import {
  UPDATE_MESSAGES,
  ADD_MESSAGE,
  UPDATE_CHATS,
  RESET_UNREAD_MESSAGE,
  FETCHING_CHATS,
} from 'constants/chatConstants';
import merge from 'lodash.merge';

type Message = {
  content: string,
  device: number,
  savedTimestamp: number,
  serverTimestamp: number,
  username: string,
};

type Chat = {
  unread: number,
  username: string,
  lastMessage: {
    content: string,
    serverTimestamp: number,
    device: number,
    savedTimestamp: number,
    username: string,
  },
}

export type ChateducerState = {
  data: {
    chats: Chat[],
    messages: {
      [string]: Message[],
    },
    isFetching: boolean,
  },
}

export type ChateducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {
    chats: [],
    messages: {},
    isFetching: false,
  },
};

export default function chatReducer(
  state: ChateducerState = initialState,
  action: ChateducerAction,
): ChateducerState {
  switch (action.type) {
    case ADD_MESSAGE:
      const { username, message } = action.payload;
      const contactMessages = state.data.messages[username] || [];
      const allMessages = [message, ...contactMessages];

      return merge(
        {},
        state,
        {
          data: {
            messages: {
              [username]: allMessages,
            },
            isFetching: false,
          },
        },
      );
    case FETCHING_CHATS:
      return merge(
        {},
        state,
        {
          data: {
            chats: action.payload,
            isFetching: true,
          },
        },
      );
    case UPDATE_CHATS:
      return merge(
        {},
        state,
        {
          data: {
            chats: action.payload,
            isFetching: false,
          },
        },
      );
    case RESET_UNREAD_MESSAGE:
      return merge(
        {},
        state,
        {
          data: {
            chats: action.payload,
            isFetching: false,
          },
        },
      );
    case UPDATE_MESSAGES:
      return merge(
        {},
        state,
        {
          data: {
            messages: {
              [action.payload.username]: [...action.payload.messages],
            },
            isFetching: false,
          },
        },
      );
    default:
      return state;
  }
}
