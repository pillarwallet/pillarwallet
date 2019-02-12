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
import { UPDATE_SESSION } from 'constants/sessionConstants';
import merge from 'lodash.merge';

export type SessionReducerState = {
  data: Object,
}

export type SessionReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {
    isOnline: true,
    hasDBConflicts: false,
  },
};

export default function appSettingsReducer(
  state: SessionReducerState = initialState,
  action: SessionReducerAction,
) {
  switch (action.type) {
    case UPDATE_SESSION:
      return merge(
        {},
        state,
        { data: action.payload },
      );
    default:
      return state;
  }
}
