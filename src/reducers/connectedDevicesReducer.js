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
  SET_CONNECTED_DEVICES,
  SET_REMOVING_CONNECTED_DEVICE_ADDRESS,
  RESET_REMOVING_CONNECTED_DEVICE_ADDRESS,
  SET_ADDING_CONNECTED_DEVICE_ADDRESS,
  RESET_ADDING_CONNECTED_DEVICE_ADDRESS,
} from 'constants/connectedDevicesConstants';

import type { ConnectedDevice } from 'models/ConnectedDevice';


export type ConnectedDevicesReducerState = {
  data: ConnectedDevice[],
  addingDeviceAddress: ?string,
  removingDeviceAddress: ?string,
};

export type ConnectedDevicesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [],
  addingDeviceAddress: null,
  removingDeviceAddress: null,
};

const connectedDevicesReducer = (
  state: ConnectedDevicesReducerState = initialState,
  action: ConnectedDevicesReducerAction,
) => {
  switch (action.type) {
    case SET_CONNECTED_DEVICES:
      return {
        ...state,
        data: action.payload,
      };
    case SET_ADDING_CONNECTED_DEVICE_ADDRESS:
      return {
        ...state,
        addingDeviceAddress: action.payload,
      };
    case RESET_ADDING_CONNECTED_DEVICE_ADDRESS:
      return {
        ...state,
        addingDeviceAddress: null,
      };
    case SET_REMOVING_CONNECTED_DEVICE_ADDRESS:
      return {
        ...state,
        removingDeviceAddress: action.payload,
      };
    case RESET_REMOVING_CONNECTED_DEVICE_ADDRESS:
      return {
        ...state,
        removingDeviceAddress: null,
      };
    default:
      return state;
  }
};

export default connectedDevicesReducer;
