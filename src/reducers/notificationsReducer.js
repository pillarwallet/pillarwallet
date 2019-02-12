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
