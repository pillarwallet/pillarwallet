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
  SHOW_HOME_UPDATE_INDICATOR,
  HIDE_HOME_UPDATE_INDICATOR,
} from 'constants/notificationConstants';
import type { Notification } from 'models/Notification';

export type NotificationsReducerState = {
  data: Notification[],
  showHomeUpdateIndicator: boolean,
}

type AddNotificationAction = {
  type: typeof ADD_NOTIFICATION,
  payload: Notification,
};

type ShowHomeIndicatorAction = {
  type: typeof SHOW_HOME_UPDATE_INDICATOR,
};

type ClearHomeIndicatorAction = {
  type: typeof HIDE_HOME_UPDATE_INDICATOR,
};

type NotificationsReducerAction =
  | AddNotificationAction
  | ShowHomeIndicatorAction
  | ClearHomeIndicatorAction;

const initialState = {
  data: [],
  showHomeUpdateIndicator: false,
};

export default function notificationsReducer(
  state: NotificationsReducerState = initialState,
  action: NotificationsReducerAction,
) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return { ...state, data: [...state.data, action.payload] };
    case SHOW_HOME_UPDATE_INDICATOR:
      return { ...state, showHomeUpdateIndicator: true };
    case HIDE_HOME_UPDATE_INDICATOR:
      return { ...state, showHomeUpdateIndicator: false };
    default:
      return state;
  }
}
