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
import t from 'translations/translate';
import { BigNumber } from 'bignumber.js';
import { isEmpty } from 'lodash';
import { getSdkError } from '@walletconnect/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { formatJsonRpcError } from '@json-rpc-tools/utils';

// constants
import {
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
  RESET_WALLETCONNECT_CONNECTOR_REQUEST,
  SET_WALLETCONNECT_REQUEST_ERROR,
  WALLETCONNECT_EVENT,
  SET_WALLETCONNECT_CONNECTOR_REQUEST,
  ADD_WALLETCONNECT_ACTIVE_CONNECTOR,
  REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR,
  ETH_SIGN_TYPED_DATA,
  ETH_SIGN_TYPED_DATA_V4,
  SET_WALLETCONNECT_CURRENT_PROPOSAL,
} from 'constants/walletConnectConstants';
import {
  WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
} from 'constants/navigationConstants';
import {
  ADD_WALLETCONNECT_SESSION,
  UPDATE_WALLETCONNECT_SESSION,
  ADD_WALLETCONNECT_V2_SESSION,
} from 'constants/walletConnectSessionsConstants';

// components
import Toast from 'components/Toast';

// services
import { navigate, updateNavigationLastScreenState } from 'services/navigation';
import { createConnector, createWeb3Wallet, web3wallet, web3WalletPair } from 'services/walletConnect';

// actions
import {
  disconnectWalletConnectSessionByPeerIdAction,
  disconnectWalletConnectV2SessionByTopicAction,
} from 'actions/walletConnectSessionsActions';
import { logEventAction } from 'actions/analyticsActions';
import { hideWalletConnectPromoCardAction } from 'actions/appSettingsActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// selectors
import { activeAccountSelector, supportedAssetsPerChainSelector } from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';

// utils
import { isNavigationAllowed } from 'utils/navigation';
import { getAccountAddress } from 'utils/accounts';
import { chainFromChainId, isTestnetChainId, isMainnetChainId, getSupportedChains } from 'utils/chains';
import { isSupportedDappUrl, mapCallRequestToTransactionPayload, pickPeerIcon } from 'utils/walletConnect';
import { reportErrorLog, logBreadcrumb } from 'utils/common';
import { isLogV2AppEvents, isProdEnv } from 'utils/environment';

// models, types
import type {
  WalletConnectCallRequest,
  WalletConnectConnector,
  sessionDataProps,
  BaseNamespace,
  WalletConnectV2Session,
} from 'models/WalletConnect';
import type { Dispatch, GetState } from 'reducers/rootReducer';

const setWalletConnectErrorAction = (message: string) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_WALLETCONNECT_REQUEST_ERROR, payload: { message } });

    Toast.show({
      message: message || t('toast.walletConnectFailed'),
      emoji: 'eyes',
      supportLink: true,
      autoClose: false,
    });
  };
};

export const resetWalletConnectConnectorRequestAction = (rejectedRequest: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { connectorRequest },
    } = getState();

    if (!connectorRequest) return;

    if (rejectedRequest) {
      if (connectorRequest.connected) await connectorRequest.killSession();
      dispatch(logEventAction('walletconnect_connector_rejected'));
    }

    dispatch({ type: RESET_WALLETCONNECT_CONNECTOR_REQUEST });
  };
};

export const connectToWalletConnectConnectorAction = (uri: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // reset any previous
    dispatch(resetWalletConnectConnectorRequestAction());

    const isV2URI = uri.includes('relay-protocol=irn');

    const toastId = Toast.show({
      message: t('toast.waitingForWalletConnectConnection'),
      emoji: 'zap',
    });

    let connector;
    if (isV2URI) {
      connector = await createWeb3Wallet();
      await web3WalletPair({ uri });
    } else {
      connector = createConnector({ uri });
    }

    if (!connector) {
      dispatch(setWalletConnectErrorAction(t('toast.walletConnectFailed')));
      return;
    }

    dispatch(logEventAction('walletconnect_connector_requested'));

    const onV2SessionProposal = async (proposal) => {
      if (!proposal) return;

      const { id, params } = proposal;
      if (!id || !params) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
        return;
      }

      const {
        proposer: { metadata },
        requiredNamespaces,
      } = params;
      if (!isSupportedDappUrl(metadata?.url)) {
        dispatch(setWalletConnectErrorAction(t('toast.walletConnectUnsupportedApp')));
        return;
      }

      const activeAccount = activeAccountSelector(getState());
      if (!activeAccount) {
        Toast.show({
          message: t('toast.noActiveAccountFound'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
        return;
      }

      const accountAddress = getAccountAddress(activeAccount);
      const supportedChains = getSupportedChains(activeAccount);

      const namespaces = {};
      let chainId = '';
      Object.keys(requiredNamespaces).forEach((key) => {
        const accounts: string[] = [];
        let isValid = true;
        requiredNamespaces[key].chains.map((chain) => {
          chainId = chain.split(':')?.[1];

          const isSupportedChain = isProdEnv() ? isMainnetChainId(Number(chainId)) : isTestnetChainId(Number(chainId));

          if (!isSupportedChain) {
            dispatch(setWalletConnectErrorAction(t('toast.walletConnectUnsupportedNetwork', { chainId })));
            isValid = false;
            return null;
          }

          const chainName = chainFromChainId[Number(chainId)];

          if (!supportedChains.includes(chainName)) {
            dispatch(
              setWalletConnectErrorAction(t('toast.walletConnectUnsupportedWalletNetwork', { chain: chainName })),
            );
            isValid = false;
            return null;
          }

          accounts.push(`${chain}:${accountAddress}`);
          return null;
        });

        if (!isValid) {
          return;
        }

        namespaces[key] = {
          accounts,
          methods: requiredNamespaces[key].methods,
          events: requiredNamespaces[key].events,
        };
      });

      if (isEmpty(namespaces)) {
        return;
      }

      dispatch({
        type: SET_WALLETCONNECT_CURRENT_PROPOSAL,
        payload: { currentProposal: proposal },
      });

      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
          params: { connector: { ...proposal, namespaces }, isV2: true, chainId },
        }),
      );
    };

    if (isV2URI) {
      web3wallet?.on(WALLETCONNECT_EVENT.SESSION_PROPOSAL, onV2SessionProposal);
      return;
    }

    connector.on(WALLETCONNECT_EVENT.SESSION_REQUEST, (error: Error | null, payload: any) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      if (toastId !== null) Toast.close(toastId);

      const { peerId, peerMeta, chainId } = payload?.params?.[0] || {};

      if (!peerId || !peerMeta) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
        return;
      }

      if (!isSupportedDappUrl(peerMeta.url)) {
        dispatch(setWalletConnectErrorAction(t('toast.walletConnectUnsupportedApp')));
        return;
      }

      isLogV2AppEvents() && dispatch(logEventAction('v2_wallet_connect_dapp_connect'));

      dispatch({
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector },
      });

      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
          params: { connector, chainId },
        }),
      );
    });
  };
};

export const fetchV2ActiveSessionsAction = (currentSession?: ?WalletConnectV2Session) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { v2Sessions },
    } = getState();

    try {
      if (!web3wallet) await createWeb3Wallet();

      if (currentSession) {
        const newArrV2Sessions = [...v2Sessions];
        const index = newArrV2Sessions?.findIndex((res) => res?.topic === currentSession.topic);
        if (index !== -1) newArrV2Sessions.splice(index, 1);
        dispatch({
          type: ADD_WALLETCONNECT_V2_SESSION,
          payload: { v2Sessions: [...newArrV2Sessions, currentSession] },
        });
      } else {
        dispatch({ type: ADD_WALLETCONNECT_V2_SESSION, payload: { v2Sessions } });
      }

      if (!isEmpty(v2Sessions) || currentSession) {
        dispatch(subscribeToWalletConnectV2ConnectorEventsAction());
      }
    } catch (e) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
    }
  };
};

export const updateSessionV2 = (newChainId: number, session: WalletConnectV2Session) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { namespaces, topic } = session;

    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      Toast.show({
        message: t('toast.noActiveAccountFound'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const accountAddress = getAccountAddress(activeAccount);

    const methods = namespaces?.eip155.methods;
    const accounts = namespaces?.eip155.accounts;
    const events = namespaces?.eip155.events;

    const updatedNamespaces = {
      eip155: {
        methods,
        // eslint-disable-next-line i18next/no-literal-string
        accounts: [...accounts, `eip155:${newChainId}:${accountAddress}`],
        events,
      },
    };

    await dispatch(updateSessionV2Action(newChainId, topic, updatedNamespaces));

    dispatch(subscribeToWalletConnectV2ConnectorEventsAction());
  };
};

export const updateSessionV2Action = (newChainId: number, topic: string, namespaces: Object) => {
  return async () => {
    await web3wallet?.updateSession({
      topic,
      namespaces,
    });
  };
};

export const approveWalletConnectV2ConnectorRequestAction = (id: number, namespaces: ?BaseNamespace | any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { currentProposal },
    } = getState();

    if (!currentProposal) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    if (currentProposal.id !== id) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
      return;
    }

    const { relays, pairingTopic } = currentProposal.params;

    try {
      await web3wallet?.approveSession({
        id,
        relayProtocol: relays[0].protocol,
        namespaces,
      });

      const activeSessions: any = await web3wallet?.getActiveSessions();

      if (!isEmpty(activeSessions)) {
        const currentSession: any = Object.values(activeSessions)?.find(
          (activeSession: any) => activeSession.pairingTopic === pairingTopic,
        );

        if (currentSession) {
          dispatch(fetchV2ActiveSessionsAction(currentSession));
        }
      }

      dispatch(hideWalletConnectPromoCardAction());

      dispatch(logEventAction('walletconnect_connected'));
      // dispatch(resetWalletConnectConnectorRequestAction());
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
      dispatch(resetWalletConnectConnectorRequestAction());
    }
  };
};

export const approveWalletConnectConnectorRequestAction = (peerId: string, chainId: number) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { connectorRequest },
    } = getState();

    if (!connectorRequest) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    if (connectorRequest.peerId !== peerId) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
      return;
    }

    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      Toast.show({
        message: t('toast.noActiveAccountFound'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const accountAddress = getAccountAddress(activeAccount);
    const sessionData = {
      accounts: [accountAddress],
      chainId,
    };

    try {
      connectorRequest.approveSession(sessionData);

      dispatch({ type: ADD_WALLETCONNECT_SESSION, payload: { session: connectorRequest.session } });
      dispatch(subscribeToWalletConnectConnectorEventsAction(connectorRequest));

      dispatch(hideWalletConnectPromoCardAction());

      dispatch(logEventAction('walletconnect_connected'));
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }

    dispatch(resetWalletConnectConnectorRequestAction());
  };
};

export const updateWalletConnectConnectorSessionAction = (connector: Object, sessionData: sessionDataProps) => {
  return (dispatch: Dispatch) => {
    try {
      connector.updateSession(sessionData);

      dispatch({ type: UPDATE_WALLETCONNECT_SESSION, payload: { session: connector.session } });

      connector?._transport?.close?.();

      dispatch(hideWalletConnectPromoCardAction());
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }

    dispatch(resetWalletConnectConnectorRequestAction());
  };
};

export const rejectWalletConnectV2ConnectorRequestAction = (id: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { currentProposal },
    } = getState();
    if (!web3wallet || !currentProposal) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    if (currentProposal.id !== id) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
      return;
    }

    try {
      await web3wallet.rejectSession({
        id,
        reason: getSdkError('USER_REJECTED_METHODS'),
      });
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }

    dispatch(resetWalletConnectConnectorRequestAction(true));
  };
};

export const rejectWalletConnectConnectorRequestAction = (peerId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { connectorRequest },
    } = getState();
    if (!connectorRequest) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    if (connectorRequest.peerId !== peerId) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
      return;
    }

    try {
      connectorRequest.rejectSession();
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }

    dispatch(resetWalletConnectConnectorRequestAction(true));
  };
};

export const rejectWalletConnectCallRequestAction = (callId: number, rejectReasonMessage?: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { activeConnectors, callRequests },
    } = getState();

    const callRequest = callRequests.find(({ callId: existingCallId }) => existingCallId === callId);
    if (!callRequest) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.requestNotFound')));
      return;
    }

    const activeConnector = activeConnectors.find(({ peerId }) => peerId === callRequest.peerId);
    if (!activeConnector) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    try {
      activeConnector.rejectRequest({
        id: +callId,
        error: new Error(rejectReasonMessage || t('error.walletConnect.requestRejected')),
      });
      dispatch({ type: REMOVE_WALLETCONNECT_CALL_REQUEST, payload: { callId } });
    } catch (error) {
      reportErrorLog('rejectWalletConnectCallRequestAction -> rejectRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestRejectFailed')));
    }
  };
};

export const rejectWalletConnectV2CallRequestAction = (
  callRequest: WalletConnectCallRequest,
  rejectReasonMessage?: string,
) => {
  return async (dispatch: Dispatch) => {
    try {
      web3wallet?.respondSessionRequest({
        topic: callRequest?.topic,
        response: rejectReasonMessage,
      });
      dispatch({ type: REMOVE_WALLETCONNECT_CALL_REQUEST, payload: { callId: callRequest.callId } });
    } catch (error) {
      reportErrorLog('rejectWalletConnectCallRequestAction -> rejectRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestRejectFailed')));
    }
  };
};

export const approveWalletConnectCallRequestAction = (callId: number, result: any) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { activeConnectors, callRequests },
    } = getState();

    const callRequest = callRequests.find(({ callId: existingCallId }) => existingCallId === callId);
    if (!callRequest) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.requestNotFound')));
      return;
    }

    const activeConnector = activeConnectors.find(({ peerId }) => peerId === callRequest.peerId);
    if (!activeConnector) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    try {
      activeConnector.approveRequest({ id: +callId, result });
      dispatch({ type: REMOVE_WALLETCONNECT_CALL_REQUEST, payload: { callId } });
    } catch (error) {
      reportErrorLog('approveWalletConnectCallRequestAction -> approveRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestApproveFailed')));
    }
  };
};

export const approveWalletConnectV2CallRequestAction = (callRequest: WalletConnectCallRequest, result: any) => {
  return async (dispatch: Dispatch) => {
    try {
      await web3wallet?.respondSessionRequest({
        topic: callRequest.topic,
        response: result,
      });
      dispatch({ type: REMOVE_WALLETCONNECT_CALL_REQUEST, payload: { callId: callRequest.callId } });
    } catch (error) {
      reportErrorLog('approveWalletConnectV2CallRequestAction -> respondSessionRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestApproveFailed')));
    }
  };
};

export const switchEthereumChainConnectorAction = (request: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { activeConnectors },
    } = getState();

    const { callId, chainId, peerId: requestPeerId } = request;

    const connector = activeConnectors.find(({ peerId }) => peerId === requestPeerId);
    if (!connector) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.noMatchingConnector')));
      return;
    }

    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      Toast.show({
        message: t('toast.noActiveAccountFound'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const accountAddress = getAccountAddress(activeAccount);
    const sessionData = {
      accounts: [accountAddress],
      chainId,
    };

    try {
      /*
       * Whenever get switch chain request then follows this steps
       * First update session in perticular chain.
       * After approve perticular switch chain request.
       */
      await dispatch(updateWalletConnectConnectorSessionAction(connector, sessionData));

      // For refrence https://github.com/WalletConnect/walletconnect-monorepo/issues/930#issuecomment-1106072395
      dispatch(approveWalletConnectCallRequestAction(callId, null));
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }
  };
};

export const subscribeToWalletConnectV2ConnectorEventsAction = () => {
  return async (dispatch: Dispatch) => {
    web3wallet?.on(WALLETCONNECT_EVENT.SESSION_REQUEST, async (event) => {
      if (!event || !event?.params) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
        return;
      }

      const { topic, params, id } = event;
      const { request } = params;
      const requestSessionData = web3wallet.engine.signClient.session.get(topic);
      const chainId = params?.chainId?.split(':')?.[1];

      const name = requestSessionData?.peer?.metadata?.name;
      const icons = requestSessionData?.peer?.metadata?.icons;
      const url = requestSessionData?.peer?.metadata?.url;

      if (request.method === ETH_SIGN_TYPED_DATA || request.method === ETH_SIGN_TYPED_DATA_V4) {
        if (isEmpty(request?.params)) {
          reportErrorLog('eth_signTypedData failed. params not found in connector.', { event });
          dispatch(setWalletConnectErrorAction(t('error.walletConnect.cannotDetermineChain', { dAppName: name })));
          return;
        }

        try {
          const { domain } = JSON.parse(request.params[1]);

          if (!domain?.chainId) {
            dispatch(setWalletConnectErrorAction(t('error.walletConnect.cannotDetermineChain', { dAppName: name })));
            return;
          }

          if (domain.chainId !== Number(chainId)) {
            dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
            await web3wallet?.respondSessionRequest({
              topic,
              response: formatJsonRpcError(id, getSdkError('USER_REJECTED_METHODS').message),
            });
            return;
          }
        } catch (e) {
          reportErrorLog('eth_signTypedData request failed.', { event, error: e?.message });
          dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
          return;
        }
      }

      const callRequest: WalletConnectCallRequest = {
        name,
        url,
        peerId: '',
        topic,
        chainId,
        callId: id,
        method: request.method,
        params: request.params,
        icon: pickPeerIcon(icons),
      };

      dispatch({
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest },
      });

      const navParams = { callRequest, method: request.method };

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
    });

    web3wallet?.on(WALLETCONNECT_EVENT.SESSION_DELETE, (payload) => {
      const { topic, id } = payload;
      dispatch(disconnectWalletConnectV2SessionByTopicAction(topic, id));
    });
  };
};

export const subscribeToWalletConnectConnectorEventsAction = (connector: WalletConnectConnector) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector } });

    connector.on(WALLETCONNECT_EVENT.CALL_REQUEST, (error: Error | null, payload: any) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      const { peerId, peerMeta, chainId } = connector;
      if (!peerId || !peerMeta) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
        return;
      }

      const { icons, name, url } = peerMeta;
      const { id: callId, method, params } = payload;

      if (!callId) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
        return;
      }

      if (method === ETH_SIGN_TYPED_DATA || method === ETH_SIGN_TYPED_DATA_V4) {
        if (isEmpty(params)) {
          reportErrorLog('eth_signTypedData failed. params not found in connector.', { payload, peerMeta });
          dispatch(setWalletConnectErrorAction(t('error.walletConnect.cannotDetermineChain', { dAppName: name })));
          return;
        }

        try {
          const { domain } = JSON.parse(params[1]);
          if (!domain?.chainId) {
            dispatch(setWalletConnectErrorAction(t('error.walletConnect.cannotDetermineChain', { dAppName: name })));
            return;
          }

          if (Number(domain.chainId) !== chainId) {
            dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
            connector.rejectRequest({
              id: +callId,
              error: new Error(t('error.walletConnect.requestRejected')),
            });
            return;
          }
        } catch (e) {
          reportErrorLog('eth_signTypedData request failed.', { payload, error: e?.message });
          dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
          return;
        }
      }

      const chainID = params[0]?.chainId ? BigNumber(params[0].chainId)?.toNumber() : chainId;

      const callRequest: WalletConnectCallRequest = {
        name,
        url,
        peerId,
        chainId: chainID,
        callId,
        method,
        params,
        icon: pickPeerIcon(icons),
      };

      dispatch({
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest },
      });

      const navParams = { callRequest, method };

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
    });

    connector.on(WALLETCONNECT_EVENT.TRANSPORT_ERROR, (error: Error | null) => {
      // remove from active connectors, active connector will be restored when available
      dispatch({ type: REMOVE_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { peerId: connector.peerId } });

      connector?._transport?.close?.(); // closes failed websocket connection, but not killing session

      if (!error) return;

      dispatch(setWalletConnectErrorAction(error?.message));
    });

    const peerId = connector?.peerId;

    connector.on(WALLETCONNECT_EVENT.DISCONNECT, (error: Error | null) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      if (!peerId) {
        logBreadcrumb('subscribeToWalletConnectConnectorEventsAction', 'disconnect failed: no peerId', {
          connector,
        });
        return;
      }

      dispatch(disconnectWalletConnectSessionByPeerIdAction(connector.peerId));
      dispatch(logEventAction('walletconnect_disconnected'));
    });
  };
};

export const estimateWalletConnectCallRequestTransactionAction = (callRequest: WalletConnectCallRequest) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch(resetEstimateTransactionAction());

    const accountAssets = accountAssetsPerChainSelector(getState());
    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());

    const {
      amount: value,
      to,
      data,
    } = mapCallRequestToTransactionPayload(callRequest, accountAssets, supportedAssetsPerChain);

    const { chainId } = callRequest;
    const chain = chainFromChainId[chainId];
    if (!chain) {
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.cannotDetermineEthereumChain')));
      return;
    }

    dispatch(estimateTransactionAction({ value, to, data }, chain));
  };
};
