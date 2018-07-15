// @flow
import { UPDATE_MESSAGES, ADD_MESSAGE, UPDATE_CHATS } from 'constants/chatConstants';
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
    username: string
  }
}

export type ChateducerState = {
  data: {
    chats: Chat[],
    messages: {
      [string]: Message[],
    },
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
  },
};

export default function historyReducer(
  state: ChateducerState = initialState,
  action: ChateducerAction,
): ChateducerState {
  switch (action.type) {
    case ADD_MESSAGE:
      const { username, message } = action.payload;
      const contactMessages = (state.data.messages[username] || []).concat(message);
      return merge(
        {},
        state,
        {
          data: {
            messages: {
              [username]: contactMessages,
            },
          },
        },
      );
    case UPDATE_CHATS:
      return merge(
        {},
        state,
        { data: { chats: action.payload } },
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
          },
        },
      );
    default:
      return state;
  }
}
