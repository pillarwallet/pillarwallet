// @flow

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
    default:
      return state;
  }
}
