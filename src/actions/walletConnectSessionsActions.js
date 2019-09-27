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
// import WalletConnect from '@walletconnect/react-native';
import {
  WALLETCONNECT_SESSIONS_IMPORTED,
  WALLETCONNECT_SESSIONS_LOADED,
  WALLETCONNECT_SESSION_ADDED,
  WALLETCONNECT_SESSION_REMOVED,
  WALLETCONNECT_SESSIONS_REMOVED,
} from 'constants/walletConnectSessionsConstants';

import type {
  WalletConnectSessionsImported,
  WalletConnectSessionsLoaded,
  WalletConnectSessionAdded,
  WalletConnectSessionRemoved,
  WalletConnectSessionsRemoved,
} from 'reducers/walletConnectSessionsReducer';

import type { Session } from 'models/WalletConnect';

export const walletConnectSessionsImportedAction = (): WalletConnectSessionsImported => ({
  type: WALLETCONNECT_SESSIONS_IMPORTED,
});

export const walletConnectSessionsLoadedAction = (
  sessions: Session[],
): WalletConnectSessionsLoaded => ({
  type: WALLETCONNECT_SESSIONS_LOADED,
  sessions,
});

export const walletConnectSessionAddedAction = (
  session: Session,
): WalletConnectSessionAdded => ({
  type: WALLETCONNECT_SESSION_ADDED,
  session,
});

export const walletConnectSessionRemovedAction = (
  peerId: string,
): WalletConnectSessionRemoved => ({
  type: WALLETCONNECT_SESSION_REMOVED,
  peerId,
});

export const walletConnectSessionsRemovedAction = (
  peerIds: string[],
): WalletConnectSessionsRemoved => ({
  type: WALLETCONNECT_SESSIONS_REMOVED,
  peerIds,
});
