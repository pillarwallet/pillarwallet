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
import isEqual from 'lodash.isequal';
import {
  UPDATE_OFFLINE_QUEUE,
  QUEUE_ACTION,
  ONLINE,
  OFFLINE,
  RESET_QUEUE,
  REMOVE_FROM_QUEUE,
} from 'constants/offlineQueueConstants';

/**
 * Initial state for the offline queue.
 *
 * @param {Array} queue Keeps an array of redux actions that are queued in the offline mode.
 * @param {Boolean} isConnected Boolean indicating if the device is connected to the Internet.
 */
const initialState = {
  queue: [],
  isConnected: true,
};

export type OfflineQueueReducerState = {
  queue: any,
  isConnected: boolean,
};

type OfflineQueueReducerAction = {
  type: string,
  payload?: any,
};

/**
 * Reducer for the offline queue.
 *
 * @param {Object} state Offline queue Redux store state.
 * @param {Object} action Action that was dispatched to the store.
 */
export default function reducer(
  state: OfflineQueueReducerState = initialState,
  action: OfflineQueueReducerAction,
) {
  switch (action.type) {
    case UPDATE_OFFLINE_QUEUE:
      return { ...state, queue: action.payload };
    case QUEUE_ACTION:
      return { ...state, queue: state.queue.concat(action.payload) };
    case REMOVE_FROM_QUEUE:
      return { ...state, queue: state.queue.filter((el) => !isEqual(el, action.payload)) };
    case RESET_QUEUE:
      return { ...state, queue: [] };
    case ONLINE:
      return { ...state, isConnected: true };
    case OFFLINE:
      return { ...state, isConnected: false };
    default:
      return state;
  }
}
