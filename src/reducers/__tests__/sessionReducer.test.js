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
import reducer from 'reducers/sessionReducer';

describe('Session reducer', () => {
  it('should handle UPDATE_SESSION', () => {
    const updateAction = {
      type: UPDATE_SESSION,
      payload: { fcmToken: 'token' },
    };

    const expectedState = {
      data: {
        fcmToken: 'token',
      },
    };

    expect(reducer(undefined, updateAction)).toMatchObject(expectedState);
  });

  it('does not replace unmodified values', () => {
    const initialAction = {
      type: UPDATE_SESSION,
      payload: { fcmToken: 'token', isOnline: false },
    };

    const state = reducer(undefined, initialAction);

    const action = {
      type: UPDATE_SESSION,
      payload: { isOnline: true },
    };

    const expectedState = {
      data: {
        fcmToken: 'token',
        isOnline: true,
      },
    };

    expect(reducer(state, action)).toMatchObject(expectedState);
  });
});
