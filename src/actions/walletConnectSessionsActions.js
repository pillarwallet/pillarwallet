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
import t from 'translations/translate';

// actions
import { subscribeToWalletConnectConnectorEventsAction } from 'actions/walletConnectActions';
import { logEventAction } from 'actions/analyticsActions';

// components
import Toast from 'components/Toast';

// constants
import {
  ADD_WALLETCONNECT_SESSION,
  REMOVE_WALLETCONNECT_SESSION,
  SET_WALLETCONNECT_SESSIONS_IMPORTED,
} from 'constants/walletConnectSessionsConstants';
import {
  REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
  RESET_WALLETCONNECT_ACTIVE_CONNECTORS,
} from 'constants/walletConnectConstants';

// services
import { createConnector, loadLegacyWalletConnectSessions } from 'services/walletConnect';

// utils
import { reportErrorLog } from 'utils/common';
import { hasKeyBasedWalletConnectSession } from 'utils/walletConnect';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { activeAccountSelector } from 'selectors';
import { getAccountAddress } from 'utils/accounts';
import { getEnv } from 'configs/envConfig';


export const initWalletConnectSessionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { isImported, sessions },
      wallet: { data: walletData },
    } = getState();

    // resets sessions for of old key based wallet implementation
    const keyBasedWalletAddress = walletData?.address;
    if (keyBasedWalletAddress && hasKeyBasedWalletConnectSession(sessions, keyBasedWalletAddress)) {
      dispatch(disconnectAllWalletConnectSessionsAction());
    }

    let storedSessions = [...sessions];

    // loads and imports sessions from deprecated sessions storage
    if (!isImported) {
      const legacySessions = await loadLegacyWalletConnectSessions();
      storedSessions = [...storedSessions, ...legacySessions];
      legacySessions.forEach((session) => dispatch({
        type: ADD_WALLETCONNECT_SESSION,
        payload: { session }
      }));
      dispatch({ type: SET_WALLETCONNECT_SESSIONS_IMPORTED });
    }

    // reset before subscribing
    dispatch(({ type: RESET_WALLETCONNECT_ACTIVE_CONNECTORS }));

    storedSessions.forEach((session) => {
      const connector = createConnector({ session });
      if (connector) {
        dispatch(subscribeToWalletConnectConnectorEventsAction(connector));
      }
    });
  };
};

export const disconnectWalletConnectSessionByPeerIdAction = (peerId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { activeConnectors } } = getState();

    const matchingConnector = activeConnectors.find((session) => session.peerId === peerId);
    if (!matchingConnector) return;

    await matchingConnector.killSession().catch((error) => {
      reportErrorLog('disconnectWalletConnectSessionByPeerIdAction -> killSession failed ', {
        error,
        matchingConnector,
      });
    });

    dispatch(logEventAction('walletconnect_session_disconnected'));
    dispatch({ type: REMOVE_WALLETCONNECT_SESSION, payload: { peerId } });
    dispatch({ type: REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { peerId } });
  };
};

const disconnectAllWalletConnectSessionsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletConnectSessions: { sessions } } = getState();

    sessions.forEach(({ peerId }) => dispatch(disconnectWalletConnectSessionByPeerIdAction(peerId)));

    Toast.show({
      message: t('toast.walletConnectConnectionsExpired'),
      emoji: 'eyes',
      supportLink: true,
      autoClose: false,
    });
  };
};

export const updateWalletConnectSessionsByActiveAccount = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) return;

    const { walletConnect: { activeConnectors } } = getState();
    const accountAddress = getAccountAddress(activeAccount);

    activeConnectors.forEach((connector) => {
      const sessionData = {
        accounts: [accountAddress],
        chainId: getEnv().NETWORK_PROVIDER === 'kovan' ? 42 : 1,
      };
      connector.updateSession(sessionData);
    });
  };
};
