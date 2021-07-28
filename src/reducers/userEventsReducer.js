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

// constants
import { SET_USER_EVENTS, ADD_USER_EVENT } from 'constants/userEventsConstants';

// types
import type { UserEvent, UserEvents } from 'models/userEvent';


export type UserEventsReducerState = {
  data: UserEvents,
}

export type AddUserEventAction = {|
  type: typeof ADD_USER_EVENT,
  payload: { chain: string, userEvent: UserEvent },
|};

export type UserEventsReducerAction = AddUserEventAction;

const initialState = {
  data: { ethereum: [] },
};

const addUserEvent = (
  chain: string,
  userEvents: UserEvents,
  newUserEvent: UserEvent,
): UserEvents => {
  const userChainEvents = userEvents?.[chain] ?? [];
  return {
    ...userEvents,
    [chain]: userChainEvents.filter(({ id }) => id !== newUserEvent.id).concat(newUserEvent),
  };
};

export default function userEventsReducer(
  state: UserEventsReducerState = initialState,
  action: UserEventsReducerAction,
) {
  switch (action.type) {
    case SET_USER_EVENTS:
      return { ...state, data: action.payload };
    case ADD_USER_EVENT:
      const { chain, userEvent } = action.payload;
      return { ...state, data: addUserEvent(chain, state.data, userEvent) };
    default:
      return state;
  }
}
