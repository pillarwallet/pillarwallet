// @flow
import {
  UPDATE_MESSAGES,
  ADD_MESSAGE,
  UPDATE_CHATS,
  RESET_UNREAD_MESSAGE,
  FETCHING_CHATS,
  DELETE_CHAT,
} from 'constants/chatConstants';
import merge from 'lodash.merge';

type Message = {
  _id: string,
  text: string,
  createdAt: Date,
  status: string,
  type: string,
  user: Object,
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
      return {
        ...state,
        data: {
          chats: action.payload,
          isFetching: false,
          messages: { ...state.data.messages },
        },
      };
    case RESET_UNREAD_MESSAGE:
      return {
        ...state,
        data: {
          ...state.data,
          chats: state.data.chats
            .map(_chat => {
              let { lastMessage, unread } = _chat;
              const { username: contactUsername } = _chat;
              if (contactUsername === action.payload.username && state.data.messages[contactUsername].length) {
                const { text, createdAt } = state.data.messages[contactUsername][0];
                lastMessage = {
                  content: text,
                  username: contactUsername,
                  device: 1,
                  serverTimestamp: createdAt,
                  savedTimestamp: 0,
                };
                unread = 0;
                return { ..._chat, lastMessage, unread };
              }
              return _chat;
            }),
        },
      };
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
    case DELETE_CHAT:
      return {
        ...state,
        data: {
          ...state.data,
          messages: Object.keys(state.data.messages)
            .reduce((thisChat, key) => {
              if (key !== action.payload) {
                thisChat[key] = state.data.messages[key];
              }
              return thisChat;
            }, {}),
          chats: [...state.data.chats]
            .filter(thisChat => thisChat.username !== action.payload),
        },
      };
    default:
      return state;
  }
}
