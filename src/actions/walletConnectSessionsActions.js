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
import { getSdkError } from '@walletconnect/utils';

// actions
import {
  subscribeToWalletConnectConnectorEventsAction,
  fetchV2ActiveSessionsAction,
} from 'actions/walletConnectActions';
import { logEventAction } from 'actions/analyticsActions';

// components
import Toast from 'components/Toast';

// constants
import {
  ADD_WALLETCONNECT_SESSION,
  REMOVE_WALLETCONNECT_SESSION,
  REMOVE_WALLETCONNECT_V2_SESSION,
  SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
  SET_WALLETCONNECT_SESSIONS_IMPORTED,
} from 'constants/walletConnectSessionsConstants';
import {
  REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
  RESET_WALLETCONNECT_ACTIVE_CONNECTORS,
} from 'constants/walletConnectConstants';

// services
import { createConnector, loadLegacyWalletConnectSessions, web3WalletInit } from 'services/walletConnect';

// selectors
import { activeAccountSelector } from 'selectors';

// utils
import { getAccountAddress } from 'utils/accounts';
import { reportErrorLog, logBreadcrumb } from 'utils/common';
import { hasKeyBasedWalletConnectSession } from 'utils/walletConnect';
import { isLogV2AppEvents } from 'utils/environment';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const setIsCreatingWalletConnectSessionsAction = (isInitializing: boolean) => ({
  type: SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
  payload: isInitializing,
});

export const initWalletConnectSessionsAction = (resetExisting: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { isImported, sessions, isInitializingSessions },
      walletConnect: { activeConnectors },
      wallet: { data: walletData },
      session: {
        data: { isOnline },
      },
    } = getState();

    if (!isOnline || isInitializingSessions) return;

    dispatch(setIsCreatingWalletConnectSessionsAction(true));

    // resets sessions for of old key based wallet implementation
    const keyBasedWalletAddress = walletData?.address;
    if (keyBasedWalletAddress && hasKeyBasedWalletConnectSession(sessions, keyBasedWalletAddress)) {
      dispatch(disconnectAllWalletConnectSessionsAction());
    }

    dispatch(fetchV2ActiveSessionsAction());

    let storedSessions = [...sessions];

    // loads and imports sessions from deprecated sessions storage
    if (!isImported) {
      const legacySessions = await loadLegacyWalletConnectSessions();
      storedSessions = [...storedSessions, ...legacySessions];
      legacySessions.forEach((session) =>
        dispatch({
          type: ADD_WALLETCONNECT_SESSION,
          payload: { session },
        }),
      );
      dispatch({ type: SET_WALLETCONNECT_SESSIONS_IMPORTED });
    }

    // reset before subscribing
    if (resetExisting) {
      // closes failed websocket connection, but not killing session
      activeConnectors.forEach((connector) => connector?._transport?.close?.());
      dispatch({ type: RESET_WALLETCONNECT_ACTIVE_CONNECTORS });
    }

    // select connectors after reset
    const {
      walletConnect: { activeConnectors: currentActiveConnectors },
    } = getState();

    storedSessions.forEach((session) => {
      const activeConnectorExists = currentActiveConnectors.some((connector) => connector.peerId === session.peerId);
      if (activeConnectorExists) return;

      const connector = createConnector({ session });
      if (!connector) {
        logBreadcrumb('initWalletConnectSessionsAction', 'createConnector failed: no connector', { session });
        return;
      }

      dispatch(subscribeToWalletConnectConnectorEventsAction(connector));
    });

    dispatch(setIsCreatingWalletConnectSessionsAction(false));
  };
};

export const disconnectWalletConnectSessionByUrlAction = (url: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { activeConnectors },
    } = getState();

    const matchingConnector = activeConnectors.find(({ peerMeta }) => peerMeta?.url === url);
    if (!matchingConnector) return;

    dispatch(disconnectWalletConnectSessionByPeerIdAction(matchingConnector.peerId));
  };
};

export const disconnectWalletConnectSessionByPeerIdAction = (peerId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { activeConnectors },
    } = getState();

    const matchingConnector = activeConnectors.find((session) => session.peerId === peerId);
    if (!matchingConnector) return;

    await matchingConnector.killSession().catch((error) => {
      reportErrorLog('disconnectWalletConnectSessionByPeerIdAction -> killSession failed ', {
        error,
        matchingConnector,
      });
    });

    dispatch(logEventAction('walletconnect_session_disconnected'));
    isLogV2AppEvents() && dispatch(logEventAction('v2_wallet_connect_dapp_disconnect'));
    dispatch({ type: REMOVE_WALLETCONNECT_SESSION, payload: { peerId } });
    dispatch({ type: REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { peerId } });
  };
};

export const disconnectWalletConnectV2SessionByTopicAction = (topic: string, id?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { v2Sessions },
    } = getState();

    const matchingSession = v2Sessions?.find((session) => session.topic === topic);
    if (!matchingSession) return;

    if (!id) {
      try {
        const web3wallet = await web3WalletInit();
        await web3wallet?.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch (error) {
        reportErrorLog('disconnectWalletConnectV2SessionByTopicAction -> disconnectSession failed ', {
          error,
          matchingSession,
        });
      }
    }

    dispatch(logEventAction('walletconnect_session_disconnected'));
    isLogV2AppEvents() && dispatch(logEventAction('v2_wallet_connect_dapp_disconnect'));
    dispatch({ type: REMOVE_WALLETCONNECT_V2_SESSION, payload: { topic } });
  };
};

const disconnectAllWalletConnectSessionsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { sessions, v2Sessions },
    } = getState();

    sessions.forEach(({ peerId }) => dispatch(disconnectWalletConnectSessionByPeerIdAction(peerId)));
    v2Sessions.forEach(({ topic }) => dispatch(disconnectWalletConnectV2SessionByTopicAction(topic)));

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

    const {
      walletConnect: { activeConnectors },
    } = getState();
    const accountAddress = getAccountAddress(activeAccount);

    activeConnectors.forEach((connector) => {
      const sessionData = {
        accounts: [accountAddress],
        chainId: connector.chainId,
      };
      connector.updateSession(sessionData);
    });
  };
};
