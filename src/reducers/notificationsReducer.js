// @flow
import { ADD_NOTIFICATION } from 'constants/notificationConstants';

type Notification = {
  title: string,
  body: string,
  data: ?Object,
}

type NotificationReducerState = {
  data: Notification[],
}

type NotificationReducerAction = {
  type: string,
  payload: Notification
}

const initialState = {
  data: [],
};

export default function notificationsReducer(
  state: NotificationReducerState = initialState,
  action: NotificationReducerAction,
) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return { ...state, data: [...state.data, action.payload] };
    default:
      return state;
  }
}
