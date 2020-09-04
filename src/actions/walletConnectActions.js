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
import { NavigationActions } from 'react-navigation';
import get from 'lodash.get';
import t from 'translations/translate';
import { getEnv } from 'configs/envConfig';

// constants
import {
  WALLETCONNECT_CANCEL_REQUEST,
  WALLETCONNECT_TIMEOUT,
  WALLETCONNECT_INIT_SESSIONS,
  WALLETCONNECT_SESSION_RECEIVED,
  WALLETCONNECT_SESSION_REQUEST,
  WALLETCONNECT_SESSION_APPROVED,
  WALLETCONNECT_SESSION_REJECTED,
  WALLETCONNECT_SESSION_DISCONNECTED,
  WALLETCONNECT_SESSIONS_KILLED,
  WALLETCONNECT_CALL_REQUEST,
  WALLETCONNECT_CALL_REJECTED,
  WALLETCONNECT_CALL_APPROVED,
  WALLETCONNECT_ERROR,
  SESSION_REQUEST_EVENT,
  CALL_REQUEST_EVENT,
  DISCONNECT_EVENT,
  SESSION_REQUEST_ERROR,
  CALL_REQUEST_ERROR,
  DISCONNECT_ERROR,
  SESSION_KILLED_ERROR,
  SESSION_APPROVAL_ERROR,
  SESSION_REJECTION_ERROR,
  TOGGLE_WALLET_CONNECT_PROMO_CARD,
} from 'constants/walletConnectConstants';
import {
  WALLETCONNECT_SESSION_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  ASSETS,
} from 'constants/navigationConstants';

// services, utils
import Storage from 'services/storage';
import { navigate, updateNavigationLastScreenState } from 'services/navigation';
import { createConnector } from 'services/walletConnect';
import { isNavigationAllowed } from 'utils/navigation';
import {
  getAccountAddress,
  findFirstSmartAccount,
  getActiveAccount,
  checkIfSmartWalletAccount,
} from 'utils/accounts';
import { shouldClearWCSessions, shouldAllowSession } from 'utils/walletConnect';
import { reportLog } from 'utils/common';

// actions
import {
  walletConnectSessionsImportedAction,
  walletConnectSessionsLoadedAction,
  walletConnectSessionAddedAction,
  walletConnectSessionRemovedAction,
  walletConnectSessionsRemovedAction,
} from 'actions/walletConnectSessionsActions';
import { logEventAction } from 'actions/analyticsActions';

// components
import Toast from 'components/Toast';

// models, types
import type { Connector, Session, CallRequest, JsonRpcRequest } from 'models/WalletConnect';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type {
  WalletConnectError,
  WalletConnectInitSessions,
  WalletConnectSessionReceived,
  WalletConnectSessionApproved,
  WalletConnectSessionDisconnected,
  WalletConnectSessionsKilled,
  WalletConnectCallRequest,
  WalletConnectCallRejected,
  WalletConnectCallApproved,
  WalletConnectTogglePromoCard,
} from 'reducers/walletConnectReducer';


const walletConnectError = (code: string, message: string): WalletConnectError => ({
  type: WALLETCONNECT_ERROR,
  payload: { code, message },
});

const walletConnectInitSessions = (connectors: Connector[]): WalletConnectInitSessions => ({
  type: WALLETCONNECT_INIT_SESSIONS,
  connectors,
});

const walletConnectSessionApproved = (connector: Connector): WalletConnectSessionApproved => ({
  type: WALLETCONNECT_SESSION_APPROVED,
  connector,
});

const walletConnectCallRequest = (request: CallRequest): WalletConnectCallRequest => ({
  type: WALLETCONNECT_CALL_REQUEST,
  request,
});

const walletConnectSessionDisconnected = (connector: Connector): WalletConnectSessionDisconnected => ({
  type: WALLETCONNECT_SESSION_DISCONNECTED,
  connector,
});

const walletConnectSessionsKilled = (connectors: Connector[]): WalletConnectSessionsKilled => ({
  type: WALLETCONNECT_SESSIONS_KILLED,
  connectors,
});

const walletConnectCallRejected = (callId: number): WalletConnectCallRejected => ({
  type: WALLETCONNECT_CALL_REJECTED,
  callId,
});

const walletConnectCallApproved = (callId: number): WalletConnectCallApproved => ({
  type: WALLETCONNECT_CALL_APPROVED,
  callId,
});

const walletConnectSessionReceived = (): WalletConnectSessionReceived => ({
  type: WALLETCONNECT_SESSION_RECEIVED,
});

const onWalletConnectCallRequest = (connector: Connector, payload: JsonRpcRequest) => {
  return async (dispatch: Dispatch) => {
    const {
      icons, name, url,
    } = connector.peerMeta || {
      icons: [], name: '', url: '',
    };

    const request: CallRequest = {
      name,
      url,
      icon: get(icons, '[0]'),
      callId: payload.id,
      peerId: connector.peerId,
      method: payload.method,
      params: payload.params,
    };

    dispatch(walletConnectCallRequest(request));

    const navParams = {
      callId: request.callId,
      method: request.method,
    };

    if (!isNavigationAllowed()) {
      updateNavigationLastScreenState({
        lastActiveScreen: WALLETCONNECT_CALL_REQUEST_SCREEN,
        lastActiveScreenParams: navParams,
      });
      return;
    }

    const navigateToAppAction = NavigationActions.navigate({
      routeName: WALLETCONNECT_CALL_REQUEST_SCREEN,
      params: navParams,
    });

    navigate(navigateToAppAction);
  };
};

const subscribeToEvents = (connector: Connector) => {
  return async (dispatch: Dispatch) => {
    connector.on(CALL_REQUEST_EVENT, (e: any, payload: JsonRpcRequest) => {
      if (e) {
        dispatch(walletConnectError(CALL_REQUEST_ERROR, e.toString()));

        return;
      }

      dispatch(onWalletConnectCallRequest(connector, payload));
    });

    connector.on(DISCONNECT_EVENT, (e: any) => {
      if (e) {
        dispatch(walletConnectError(DISCONNECT_ERROR, e.toString()));

        return;
      }

      dispatch(walletConnectSessionDisconnected(connector));
      dispatch(walletConnectSessionRemovedAction(connector.peerId));
      dispatch(logEventAction('walletconnect_disconnected'));
    });
  };
};

const subscribeToSessionRequestEvent = (connector: Connector) => {
  return async (dispatch: Dispatch) => {
    connector.on(SESSION_REQUEST_EVENT, async (e: any, payload: any) => {
      if (e) {
        dispatch(walletConnectError(SESSION_REQUEST_ERROR, e.toString()));

        return;
      }

      const { peerId, peerMeta } = get(payload, 'params[0]', {});

      if (!peerId || !peerMeta) {
        dispatch(walletConnectError(SESSION_REQUEST_ERROR, 'Invalid session'));

        return;
      }

      if (!shouldAllowSession(peerMeta.url)) {
        Toast.show({
          message: t('toast.walletConnectUnsupportedApp'),
          emoji: 'eyes',
          supportLink: true,
          autoClose: false,
        });
        return;
      }

      dispatch(walletConnectSessionReceived());
      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_SESSION_REQUEST_SCREEN,
          params: { peerId, peerMeta },
        }),
      );
    });
  };
};

export const killWalletConnectSession = (peerId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectors } } = getState();

    const matchingConnectors = connectors.filter(c => c.peerId === peerId);

    if (!matchingConnectors.length) {
      dispatch(
        walletConnectError(SESSION_REQUEST_ERROR, 'No Matching Wallet Connect Requests Found'),
      );

      return;
    }

    try {
      const peerIds = await Promise.all(matchingConnectors.map(async c => {
        await c.killSession();

        return c.peerId;
      }));

      dispatch(walletConnectSessionsKilled(matchingConnectors));
      dispatch(walletConnectSessionsRemovedAction(peerIds));
    } catch (e) {
      dispatch(walletConnectError(SESSION_KILLED_ERROR, e.toString()));

      return;
    }

    dispatch(logEventAction('walletconnect_session_killed'));
  };
};

const killAllWalletConnectSessions = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnectSessions: { sessions } } = getState();
    sessions.forEach((s: Session) => {
      dispatch(killWalletConnectSession(s.peerId));
    });
    Toast.show({
      message: t('toast.walletConnectConnectionsExpired'),
      emoji: 'eyes',
      supportLink: true,
      autoClose: false,
    });
  };
};

export const killWalletConnectSessionByUrl = (url: string, skipPeerId?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectors } } = getState();

    const matchingConnectors = connectors.filter(c => {
      const { peerMeta } = c;
      if (!peerMeta) {
        return false;
      }
      if (skipPeerId && skipPeerId === c.peerId) {
        return false;
      }

      return peerMeta.url === url;
    });

    if (!matchingConnectors.length) {
      if (!skipPeerId) {
        dispatch(
          walletConnectError(SESSION_REQUEST_ERROR, 'No Matching Wallet Connect Requests Found'),
        );
      }

      return;
    }

    try {
      const peerIds = await Promise.all(matchingConnectors.map(async c => {
        await c.killSession();

        return c.peerId;
      }));

      dispatch(walletConnectSessionsKilled(matchingConnectors));
      dispatch(walletConnectSessionsRemovedAction(peerIds));
    } catch (e) {
      dispatch(walletConnectError(SESSION_KILLED_ERROR, e.toString()));

      return;
    }

    dispatch(logEventAction('walletconnect_session_killed'));
  };
};

export const cancelWaitingRequestAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { pendingConnector: connector } } = getState();

    if (!connector) {
      return;
    }

    if (connector.connected) {
      connector.killSession();
    }

    dispatch(logEventAction('walletconnect_rejected'));
    dispatch({ type: WALLETCONNECT_CANCEL_REQUEST });
  };
};

const sessionRequestTimedOut = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: {
        waitingForSession,
        pendingConnector: connector,
      },
    } = getState();

    if (!connector || !waitingForSession) {
      return;
    }

    dispatch(logEventAction('walletconnect_timed_oud'));

    Toast.show({
      message: t('toast.walletConnectSessionTimedOut'),
      emoji: 'snail',
      supportLink: true,
      autoClose: false,
    });

    dispatch(cancelWaitingRequestAction());
  };
};

export const requestSessionAction = (uri: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    try {
      const { walletConnect: { pendingConnector } } = getState();
      if (pendingConnector) {
        dispatch(
          walletConnectError(SESSION_REQUEST_ERROR, 'A connection is already waiting'),
        );
        return;
      }

      const connector = createConnector({ uri });

      dispatch({ type: WALLETCONNECT_SESSION_REQUEST, connector });
      dispatch(subscribeToSessionRequestEvent(connector));
      dispatch(logEventAction('walletconnect_requested'));

      setTimeout(() => dispatch(sessionRequestTimedOut()), WALLETCONNECT_TIMEOUT);
    } catch (e) {
      dispatch(walletConnectError(SESSION_REQUEST_ERROR, e.toString()));
    }
  };
};

export const toggleWCPromoCardAction = (collapsed: boolean): WalletConnectTogglePromoCard => ({
  type: TOGGLE_WALLET_CONNECT_PROMO_CARD,
  payload: { collapsed },
});

export const approveSessionAction = (peerId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { pendingConnector: connector } } = getState();

    if (!connector) {
      dispatch(
        walletConnectError(SESSION_REQUEST_ERROR, 'No Matching Wallet Connect Requests Found'),
      );

      return;
    }

    if (connector.peerId !== peerId) {
      dispatch(walletConnectError(SESSION_REQUEST_ERROR, 'Invalid Wallet Connect session'));

      return;
    }

    const { peerMeta } = connector;
    if (peerMeta) {
      dispatch(killWalletConnectSessionByUrl(peerMeta.url, peerId));
    }
    const {
      accounts: { data: accounts },
    } = getState();
    try {
      let account = getActiveAccount(accounts);
      if (!account || !checkIfSmartWalletAccount(account)) {
        account = findFirstSmartAccount(accounts);
      }
      if (!account) {
        Toast.show({
          message: t('toast.walletConnectSmartWalletNotActive'),
          emoji: 'point_up',
          link: t('label.activateSmartWallet'),
          onLinkPress: () => navigate(NavigationActions.navigate({ routeName: ASSETS })), // contains sw activation card
          autoClose: false,
        });
        return;
      }
      const smartAccAddress = getAccountAddress(account);
      await connector.approveSession({
        accounts: [smartAccAddress],
        chainId: getEnv().NETWORK_PROVIDER === 'kovan' ? 42 : 1,
      });
    } catch (e) {
      dispatch(walletConnectError(SESSION_APPROVAL_ERROR, e.toString()));

      return;
    }

    dispatch(walletConnectSessionApproved(connector));
    dispatch(walletConnectSessionAddedAction(connector.session));
    dispatch(subscribeToEvents(connector));
    dispatch(toggleWCPromoCardAction(true));

    dispatch(logEventAction('walletconnect_connected'));
  };
};

export const rejectSessionAction = (peerId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { pendingConnector: connector } } = getState();

    if (!connector) {
      return;
    }

    if (connector.peerId !== peerId) {
      dispatch(walletConnectError(SESSION_REQUEST_ERROR, 'Invalid Wallet Connect session'));

      return;
    }

    try {
      await connector.rejectSession();
    } catch (e) {
      dispatch(walletConnectError(SESSION_REJECTION_ERROR, e.toString()));

      return;
    }

    dispatch({ type: WALLETCONNECT_SESSION_REJECTED });
  };
};

export const rejectCallRequestAction = (callId: number, errorMsg?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectors, requests } } = getState();

    const request = requests.find(({ callId: requestCallId }) => requestCallId === callId);
    if (!request) {
      dispatch(walletConnectError(CALL_REQUEST_ERROR, 'Request not found'));
      return;
    }

    const connector = connectors.find(c => c.peerId === request.peerId);
    if (connector) {
      dispatch(walletConnectCallRejected(callId));
      connector.rejectRequest({ id: +callId, error: { message: errorMsg || 'Call Request Rejected' } });
    } else {
      dispatch(walletConnectError(CALL_REQUEST_ERROR, 'No Matching Wallet Connect Connectors Found'));
    }
  };
};

export const approveCallRequestAction = (callId: number, result: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectors, requests } } = getState();

    const request = requests.find(({ callId: requestCallId }) => requestCallId === callId);
    if (!request) {
      if (result) {
        dispatch(walletConnectError(CALL_REQUEST_ERROR, 'Request not found'));
      }

      return;
    }
    if (!result) {
      dispatch(rejectCallRequestAction(callId));

      return;
    }

    const connector = connectors.find(c => c.peerId === request.peerId);
    if (connector) {
      dispatch(walletConnectCallApproved(callId));
      connector.approveRequest({ id: +callId, result });
    } else {
      dispatch(walletConnectError(CALL_REQUEST_ERROR, 'No Matching Wallet Connect Connectors Found'));
    }
  };
};

const loadLegacySessions = async (): Promise<Session[]> => {
  const storage = Storage.getInstance('db');
  const walletconnect = await storage.get('walletconnect');

  if (walletconnect) {
    const { sessions = [] } = walletconnect;

    return sessions;
  }

  return [];
};

export const initWalletConnectSessions = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { isImported, sessions },
      wallet: { data: { address: keyBasedWalletAddress } },
    } = getState();

    if (!keyBasedWalletAddress) {
      reportLog('initWalletConnectSessions failed: ', { keyBasedWalletAddress });
      return;
    }

    if (shouldClearWCSessions(sessions, keyBasedWalletAddress)) {
      dispatch(killAllWalletConnectSessions());
    }

    let initialSessions = sessions;
    if (!isImported) {
      initialSessions = await loadLegacySessions();
      dispatch(walletConnectSessionsImportedAction());
    }

    const initialConnectors: Connector[] = [];

    initialSessions.forEach(session => {
      if (!session.connected) return;

      try {
        const connector = createConnector({ session });
        dispatch(subscribeToEvents(connector));

        initialConnectors.push(connector);
      } catch (e) {
        // Connection error
      }
    });

    const connectors: Connector[] = initialConnectors.filter(c => !!c);
    if (connectors.length) {
      dispatch(walletConnectInitSessions(connectors));
      dispatch(walletConnectSessionsLoadedAction(connectors.map(c => c.session)));
    }
  };
};
