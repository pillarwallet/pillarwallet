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
  OFFLINE_API_CALL,
  QUEUE_ACTION,
  UPDATE_OFFLINE_QUEUE,
  REMOVE_FROM_QUEUE,
  RESET_QUEUE,
  ONLINE,
  OFFLINE,
} from 'constants/offlineQueueConstants';
import reducer from '../offlineQueueReducer';

const mockOfflineAction: Object = {
  type: OFFLINE_API_CALL,
  payload: {
    method: 'test',
    params: [],
  },
  meta: {
    queueIfOffline: true,
    timestamp: +new Date(),
  },
};
const defaultIsConnected = true;

describe('Offline queue reducer', () => {
  it('should handle UPDATE_OFFLINE_QUEUE', () => {
    const action = { type: UPDATE_OFFLINE_QUEUE, payload: [mockOfflineAction] };
    expect(reducer(undefined, action)).toMatchObject({ queue: [mockOfflineAction] });
  });

  it('should handle QUEUE_ACTION', () => {
    const action = { type: QUEUE_ACTION, payload: mockOfflineAction };
    expect(reducer(undefined, action)).toMatchObject({ queue: [mockOfflineAction] });
  });

  it('should handle REMOVE_FROM_QUEUE', () => {
    const action = { type: REMOVE_FROM_QUEUE, payload: mockOfflineAction };
    const initialState = {
      queue: [mockOfflineAction],
      isConnected: defaultIsConnected,
    };
    expect(reducer(initialState, action)).toMatchObject({ queue: [] });
  });

  it('should handle RESET_QUEUE', () => {
    const action = { type: RESET_QUEUE };
    const initialState = {
      queue: [mockOfflineAction],
      isConnected: defaultIsConnected,
    };
    expect(reducer(initialState, action)).toMatchObject({ queue: [] });
  });

  it('should handle ONLINE', () => {
    const action = { type: ONLINE };
    expect(reducer(undefined, action)).toMatchObject({ isConnected: true });
  });

  it('should handle OFFLINE', () => {
    const action = { type: OFFLINE };
    expect(reducer(undefined, action)).toMatchObject({ isConnected: false });
  });
});
