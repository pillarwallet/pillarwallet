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
import merge from 'lodash.merge';
import WalletConnect from '@walletconnect/react-native';
import {
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REJECTED,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSION_KILLED,
  WALLETCONNECT_CLEAR_PENDING,
  WALLETCONNECT_ERROR,
} from 'constants/walletConnectConstants';

export type WalletConnectReducerState = {
  connectors: Array<WalletConnect>,
  pending: Array<WalletConnect>,
  requests: Array<{
    peerId: string,
    peerMeta: Object,
    payload: Object,
  }>,
  error: ?{
    code: string,
    message: string,
  },
};

export type WalletConnectReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  connectors: [],
  pending: [],
  requests: [],
  error: null,
};

export default function walletConnectReducer(
  state: WalletConnectReducerState = initialState,
  action: WalletConnectReducerAction,
) {
  switch (action.type) {
    case WALLETCONNECT_INIT_SESSIONS:
    case WALLETCONNECT_SESSION_DISCONNECTED:
    case WALLETCONNECT_SESSION_KILLED:
      return merge({}, state, { connectors: action.payload });
    case WALLETCONNECT_SESSION_APPROVED:
      return merge({}, state, { pending: action.payload.pending, connectors: action.payload.connectors });
    case WALLETCONNECT_SESSION_REQUEST:
    case WALLETCONNECT_SESSION_REJECTED:
    case WALLETCONNECT_CLEAR_PENDING:
      return merge({}, state, { pending: action.payload });
    case WALLETCONNECT_ERROR:
      return merge({}, state, { error: action.payload });
    default:
      return state;
  }
}
