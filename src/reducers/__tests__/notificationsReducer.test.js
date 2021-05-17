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
import reducer from '../notificationsReducer';

describe('Notifications reducer', () => {
  const initialState = {
    data: [],
    showHomeUpdateIndicator: false,
  };

  it('handles ADD_NOTIFICATION', () => {
    const prevNotifications = [{
      message: 'notification 1',
      emoji: 'hash',
    }];

    const prevState = {
      ...initialState,
      data: prevNotifications,
    };

    const notification = {
      message: 'notification 2',
      emoji: 'hash',
    };

    const action = {
      type: ADD_NOTIFICATION,
      payload: notification,
    };

    const expected = {
      data: [...prevNotifications, notification],
    };

    expect(reducer(prevState, action)).toMatchObject(expected);
  });

  it('handles SHOW_HOME_UPDATE_INDICATOR', () => {
    const action = { type: SHOW_HOME_UPDATE_INDICATOR };
    const expected = { showHomeUpdateIndicator: true };

    expect(reducer(initialState, action)).toMatchObject(expected);
  });

  it('handles HIDE_HOME_UPDATE_INDICATOR', () => {
    const prevState = { ...initialState, showHomeUpdateIndicator: true };
    const action = { type: HIDE_HOME_UPDATE_INDICATOR };
    const expected = { showHomeUpdateIndicator: false };

    expect(reducer(prevState, action)).toMatchObject(expected);
  });
});
