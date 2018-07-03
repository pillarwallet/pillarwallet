// @flow
import { ADD_NOTIFICATION, UPDATE_INTERCOM_NOTIFICATIONS_COUNT } from 'constants/notificationConstants';
import type { Notification } from 'models/Notification';

type NotificationReducerState = {
  data: Notification[],
  intercomNotificationsCount: number,
}

type NotificationReducerAction = {
  type: string,
  payload: Notification
}

const initialState = {
  data: [],
  intercomNotificationsCount: 0,
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
    default:
      return state;
  }
}
