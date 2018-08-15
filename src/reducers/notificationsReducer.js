// @flow
import {
  ADD_NOTIFICATION,
  UPDATE_INTERCOM_NOTIFICATIONS_COUNT,
  SET_UNREAD_NOTIFICATIONS_STATUS,
  SET_UNREAD_CHAT_NOTIFICATIONS_STATUS,
} from 'constants/notificationConstants';
import type { Notification } from 'models/Notification';

type NotificationReducerState = {
  data: Notification[],
  intercomNotificationsCount: number,
  homeNotifications: [],
  hasUnreadNotifications: boolean,
  hasUnreadChatNotifications: boolean,
}

type NotificationReducerAction = {
  type: string,
  payload: Notification,
}

const initialState = {
  data: [],
  intercomNotificationsCount: 0,
  homeNotifications: [],
  hasUnreadNotifications: false,
  hasUnreadChatNotifications: false,
};

export default function notificationsReducer(
  state: NotificationReducerState = initialState,
  action: NotificationReducerAction,
) {
  switch (action.type) {
    case UPDATE_INTERCOM_NOTIFICATIONS_COUNT:
      return { ...state, intercomNotificationsCount: action.payload };
    case ADD_NOTIFICATION:
      return { ...state, data: [...state.data, action.payload] };
    case SET_UNREAD_NOTIFICATIONS_STATUS:
      return { ...state, hasUnreadNotifications: action.payload };
    case SET_UNREAD_CHAT_NOTIFICATIONS_STATUS:
      return { ...state, hasUnreadChatNotifications: action.payload };
    default:
      return state;
  }
}
