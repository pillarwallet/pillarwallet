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
  CONNEXT_INIT_CHANNEL_PENDING,
  CONNEXT_INIT_CHANNEL_SUCCESS,
  CONNEXT_INIT_CHANNEL_FAILURE,
} from 'constants/connextConstants';

import type {Channel} from 'models/Connext';

export type ConnextReducerState = {|
  initializing: boolean,
  channel: Channel,
  error: ?{|
    code: string,
    message: string,
  |},
|};

const initialState: ConnextReducerState = {
  initializing: false,
  channel: null,
  error: null,
};

export type ConnextInitChannelPending = {|
  type: 'CONNEXT_INIT_CHANNEL_PENDING',
|};

export type ConnextInitChannelSuccess = {|
  type: 'CONNEXT_INIT_CHANNEL_SUCCESS',
  channel: Channel,
|};

export type ConnextInitChannelFailure = {|
  type: 'CONNEXT_INIT_CHANNEL_FAILURE',
  error: ?{|
    code: string,
    message: string,
  |},
|};

export type ConnextReducerAction =
  | ConnextInitChannelPending
  | ConnextInitChannelSuccess
  | ConnextInitChannelFailure;

const connextReducer = (
  state: ConnextReducerState = initialState,
  action: ConnextReducerAction,
): ConnextReducerState => {
  switch (action.type) {
    case CONNEXT_INIT_CHANNEL_PENDING:
      return {...state, initializing: true};
    case CONNEXT_INIT_CHANNEL_SUCCESS:
      return {...state, initializing: false, channel: action.channel};
    case CONNEXT_INIT_CHANNEL_FAILURE:
      return {...state, initializing: false, error: action.error};
    default:
      return state;
  }
};
export default connextReducer;
