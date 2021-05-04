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
import { getEnv } from 'configs/envConfig';

// constants
import {
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
  RESET_WALLETCONNECT_CONNECTOR_REQUEST,
  SET_WALLETCONNECT_REQUEST_ERROR,
  WALLETCONNECT_EVENT,
  SET_WALLETCONNECT_CONNECTOR_REQUEST,
  ADD_WALLETCONNECT_ACTIVE_CONNECTOR,
} from 'constants/walletConnectConstants';
import {
  ASSETS,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
} from 'constants/navigationConstants';

// services, utils
import { navigate, updateNavigationLastScreenState } from 'services/navigation';
import { createConnector } from 'services/walletConnect';
import { isNavigationAllowed } from 'utils/navigation';
import { getAccountAddress, isArchanovaAccount } from 'utils/accounts';
import {
  isSupportedDappUrl,
  mapCallRequestToTransactionPayload,
} from 'utils/walletConnect';
import { reportErrorLog } from 'utils/common';

// actions
import {
  addWalletConnectSessionAction,
  disconnectWalletConnectSessionByPeerIdAction,
  removeWalletConnectSessionAction,
} from 'actions/walletConnectSessionsActions';
import { logEventAction } from 'actions/analyticsActions';
import { hideWalletConnectPromoCardAction } from 'actions/appSettingsActions';

// components
import Toast from 'components/Toast';

// selectors
import { isArchanovaWalletActivatedSelector } from 'selectors/archanova';
import {
  activeAccountSelector,
  supportedAssetsSelector,
} from 'selectors';

// models, types
import type {
  CallRequest,
  Connector,
  JsonRpcRequest,
} from 'models/WalletConnect';
import type {
  Dispatch,
  GetState,
} from 'reducers/rootReducer';
import type {
  SetWalletConnectRequestError,
} from 'reducers/walletConnectReducer';
import type { WalletConnectConnector } from 'models/WalletConnect';
import { ADD_WALLETCONNECT_SESSION } from 'constants/walletConnectSessionsConstants';
import {
  estimateTransactionAction,
  resetEstimateTransactionAction,
} from 'actions/transactionEstimateActions';
import { accountAssetsSelector } from 'selectors/assets';
import { getAssetsAsList } from 'utils/assets';


const setWalletConnectErrorAction = (message: string): SetWalletConnectRequestError => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_WALLETCONNECT_REQUEST_ERROR, payload: { message }});

    Toast.show({
      message: message || t('toast.walletConnectFailed'),
      emoji: 'eyes',
      supportLink: true,
      autoClose: false,
    });
  };
};

export const resetWalletConnectConnectorRequestAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectorRequest } } = getState();

    if (!connectorRequest) return;

    if (connectorRequest.connected) {
      await connectorRequest.killSession();
    }

    dispatch(logEventAction('walletconnect_connector_rejected'));
    dispatch({ type: RESET_WALLETCONNECT_CONNECTOR_REQUEST });
  };
};

export const connectToWalletConnectConnectorAction = (uri: string) => {
  return (dispatch: Dispatch) => {
    // reset any previous
    dispatch(resetWalletConnectConnectorRequestAction());

    const connector = createConnector({ uri });
    if (!connector) {
      dispatch(setWalletConnectErrorAction(t('toast.walletConnectFailed')));
      return;
    }

    dispatch(logEventAction('walletconnect_connector_requested'));

    connector.on(WALLETCONNECT_EVENT.SESSION_REQUEST, async (error: Error, payload: any) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      const { peerId, peerMeta } = payload?.params?.[0] || {};

      if (!peerId || !peerMeta) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidSession')));
        return;
      }

      if (!isSupportedDappUrl(peerMeta.url)) {
        dispatch(setWalletConnectErrorAction(t('toast.walletConnectUnsupportedApp')));
        return;
      }

      dispatch({
        type: SET_WALLETCONNECT_CONNECTOR_REQUEST,
        payload: { connectorRequest: connector },
      });

      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
          params: { peerId, peerMeta },
        }),
      );
    });
  };
};

export const approveWalletConnectConnectorRequestAction = (peerId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectorRequest } } = getState();
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

    const requiresSmartWalletDeployment = isArchanovaAccount(activeAccount)
      && !isArchanovaWalletActivatedSelector(getState());
    if (requiresSmartWalletDeployment) {
      Toast.show({
        message: t('toast.walletConnectSmartWalletNotActive'),
        emoji: 'point_up',
        link: t('label.activateSmartWallet'),
        onLinkPress: () => navigate(NavigationActions.navigate({ routeName: ASSETS })), // contains sw activation card
        autoClose: false,
      });
      return;
    }

    const accountAddress = getAccountAddress(activeAccount);

    const sessionData = {
      accounts: [accountAddress],
      chainId: getEnv().NETWORK_PROVIDER === 'kovan' ? 42 : 1,
    };

    try {
      connectorRequest.approveSession(sessionData);

      dispatch({ type: ADD_WALLETCONNECT_SESSION, payload: { session: connectorRequest.session }});
      dispatch(subscribeToWalletConnectConnectorEventsAction(connectorRequest));

      dispatch(hideWalletConnectPromoCardAction());

      dispatch(logEventAction('walletconnect_connected'));
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }

    dispatch(resetWalletConnectConnectorRequestAction());
  };
};

export const rejectWalletConnectConnectorRequestAction = (peerId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { connectorRequest } } = getState();
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

    dispatch(resetWalletConnectConnectorRequestAction());
  };
};

export const rejectWalletConnectCallRequestAction = (callId: number, rejectReasonMessage?: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { activeConnectors, callRequests } } = getState();

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

    console.log('activeConnector: ', activeConnector)

    try {
      activeConnector.rejectRequest({
        id: +callId,
        error: { message: rejectReasonMessage || t('error.walletConnect.requestRejected') },
      });
      dispatch({ type: REMOVE_WALLETCONNECT_CALL_REQUEST, payload: { callId } });
    } catch (error) {
      reportErrorLog('rejectWalletConnectCallRequestAction -> rejectRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestRejectFailed')));
    }
  };
};

export const approveWalletConnectCallRequestAction = (callId: number, result: any) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletConnect: { activeConnectors, callRequests } } = getState();

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

export const subscribeToWalletConnectConnectorEventsAction = (connector: WalletConnectConnector) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: ADD_WALLETCONNECT_ACTIVE_CONNECTOR, payload: { connector }});

    connector.on(WALLETCONNECT_EVENT.CALL_REQUEST, (error: Error, payload: JsonRpcRequest) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      const { peerId, peerMeta } = connector;
      if (!peerId || !peerMeta) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
        return;
      }

      const { icons, name = null, url = null } = peerMeta;
      const { id: callId, method, params } = payload;

      if (!callId) {
        dispatch(setWalletConnectErrorAction(t('error.walletConnect.invalidRequest')));
        return;
      }

      const callRequest: CallRequest = {
        name,
        url,
        peerId,
        callId,
        method,
        params,
        icon: icons?.[0] || null,
      };

      dispatch({
        type: ADD_WALLETCONNECT_CALL_REQUEST,
        payload: { callRequest },
      });

      const navParams = { callId, method };

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

    connector.on(WALLETCONNECT_EVENT.DISCONNECT, (error: Error) => {
      if (error) {
        dispatch(setWalletConnectErrorAction(error?.message));
        return;
      }

      if (!connector?.peerId) {
        reportErrorLog('subscribeToWalletConnectConnectorEventsAction -> disconnect failed: no peerId', { connector });
        return;
      }

      dispatch(disconnectWalletConnectSessionByPeerIdAction(connector.peerId));
      dispatch(logEventAction('walletconnect_disconnected'));
    });
  };
};

export const estimateWalletConnectCallRequestTransactionAction = (callRequest: CallRequest) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch(resetEstimateTransactionAction());

    const accountAssets = getAssetsAsList(accountAssetsSelector(getState()));
    const supportedAssets = supportedAssetsSelector(getState())

    const { amount: value, to, data } = mapCallRequestToTransactionPayload(callRequest, accountAssets, supportedAssets);

    dispatch(estimateTransactionAction({ value, to, data }));
  };
};
