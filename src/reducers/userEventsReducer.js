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
import { SET_USER_EVENTS, ADD_USER_EVENT } from 'constants/userEventsConstants';
import type { UserEvent } from 'models/userEvent';

export type UserEventsReducerState = {
  data: UserEvent[],
}

export type UserEventsReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
};

export default function userEventsReducer(
  state: UserEventsReducerState = initialState,
  action: UserEventsReducerAction,
) {
  switch (action.type) {
    case SET_USER_EVENTS:
      return { ...state, data: action.payload };
    case ADD_USER_EVENT:
      return { ...state, data: [...state.data.filter(({ id }) => id !== action.payload.id), action.payload] };
    default:
      return state;
  }
}
