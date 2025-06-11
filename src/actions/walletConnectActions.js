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
import { CommonActions } from '@react-navigation/native';
import t from 'translations/translate';
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
  ETH_SIGN_TYPED_DATA,
  ETH_SIGN_TYPED_DATA_V4,
  SET_WALLETCONNECT_CURRENT_PROPOSAL,
  VISIBLE_WC_MODAL,
} from 'constants/walletConnectConstants';
import {
  APP_FLOW,
  WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
} from 'constants/navigationConstants';
import { ADD_WALLETCONNECT_V2_SESSION } from 'constants/walletConnectSessionsConstants';
import { ETHERSPOT, PILLARX } from 'constants/walletConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// components
import Toast from 'components/Toast';

// services
import { navigate, updateNavigationLastScreenState } from 'services/navigation';
import { createWeb3Wallet, web3wallet, web3WalletPair } from 'services/walletConnect';
import { firebaseRemoteConfig } from 'services/firebase';

// actions
import { disconnectWalletConnectV2SessionByTopicAction } from 'actions/walletConnectSessionsActions';
import { logEventAction } from 'actions/analyticsActions';
import { hideWalletConnectPromoCardAction, dismissSwitchAccountTooltipAction } from 'actions/appSettingsActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { switchAccountAction } from 'actions/accountsActions';

// selectors
import { activeAccountSelector, supportedAssetsPerChainSelector, accountsSelector } from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';

// utils
import { isNavigationAllowed } from 'utils/navigation';
import { getAccountAddress, findKeyBasedAccount, getActiveAccount } from 'utils/accounts';
import { chainFromChainId, isTestnetChainId, isMainnetChainId, getSupportedChains } from 'utils/chains';
import {
  isSupportedDappUrl,
  mapCallRequestToTransactionPayload,
  pickPeerIcon,
  getRequiredNameSpaces,
} from 'utils/walletConnect';
import { reportErrorLog } from 'utils/common';
import { isProdEnv } from 'utils/environment';

// models, types
import type { WalletConnectCallRequest, BaseNamespace, WalletConnectV2Session } from 'models/WalletConnect';
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

export const resetWalletConnectConnectorRequestAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnect: { currentProposal },
    } = getState();

    if (!currentProposal) return;

    dispatch({ type: RESET_WALLETCONNECT_CONNECTOR_REQUEST });
  };
};

export const connectToWalletConnectConnectorAction = (uri: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // reset any previous
    dispatch(resetWalletConnectConnectorRequestAction());

    const isV2URI = uri.includes('relay-protocol=irn');

    // Note: In every event gets the request URL in android
    // Disable for tx, sign request
    if (!isV2URI) return;

    dispatch({ type: VISIBLE_WC_MODAL, payload: true });

    const toastId = Toast.show({
      message: t('toast.waitingForWalletConnectConnection'),
      emoji: 'zap',
    });

    const connector = await createWeb3Wallet();
    await web3WalletPair({ uri });

    if (!connector) {
      dispatch(setWalletConnectErrorAction(t('toast.walletConnectFailed')));
      return;
    }

    dispatch(logEventAction('walletconnect_connector_requested'));

    const onV2SessionProposal = async (proposal) => {
      if (!proposal) return;

      if (toastId !== null) Toast.close(toastId);

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

      let activeAccount = activeAccountSelector(getState());

      const allAccounts = accountsSelector(getState());
      const appName = proposal?.params?.proposer?.metadata?.name;
      const keyBasedAccount = findKeyBasedAccount(allAccounts);

      const pillarXMigrationWalletName = firebaseRemoteConfig.getString(
        REMOTE_CONFIG.APP_WALLETCONNECT_MIGRATION_MATCHER,
      );

      if (
        activeAccount !== keyBasedAccount &&
        (appName?.includes(ETHERSPOT) || appName === pillarXMigrationWalletName || appName?.includes(PILLARX))
      ) {
        if (keyBasedAccount?.id) {
          await dispatch(switchAccountAction(keyBasedAccount.id));
          if (appName?.includes(ETHERSPOT)) {
            dispatch(dismissSwitchAccountTooltipAction(false));
          }
        }
      }

      activeAccount = activeAccountSelector(getState());

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
        namespaces.eip155 = getRequiredNameSpaces(accountAddress);
        chainId = '1';
      }

      if (isEmpty(namespaces)) {
        return;
      }

      dispatch({
        type: SET_WALLETCONNECT_CURRENT_PROPOSAL,
        payload: { currentProposal: proposal },
      });

      if (!isNavigationAllowed()) {
        updateNavigationLastScreenState({
          lastActiveScreen: APP_FLOW,
          lastActiveScreenParams: {
            screen: WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
            params: { connector: { ...proposal, namespaces }, isV2: true, chainId },
          },
        });
        return;
      }

      dispatch({ type: VISIBLE_WC_MODAL, payload: true });


      navigate(
        CommonActions.navigate(APP_FLOW, {
          screen: WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
          params: { connector: { ...proposal, namespaces }, isV2: true, chainId },
        }),
      );
    };
    web3wallet?.on(WALLETCONNECT_EVENT.SESSION_PROPOSAL, onV2SessionProposal);
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

export const updateSessionV2 = (newChainId: ?number, newAccountAddress: ?string, session: WalletConnectV2Session) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { namespaces, topic, requiredNamespaces, pairingTopic } = session;

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

    let accounts = namespaces?.eip155.accounts;
    let chains = namespaces?.eip155?.chains || requiredNamespaces?.eip155?.chains;

    const isAccountExists = accounts.some((account) => account?.split(':')?.[2] === newAccountAddress);
    const isExists = newChainId && chains.some((chain) => chain === `eip155:${newChainId}`);
    if (isExists || isAccountExists) return;

    // Note: Used for adding a new chain
    if (newChainId) {
      // eslint-disable-next-line i18next/no-literal-string
      chains = [...chains, `eip155:${newChainId}`];
      // eslint-disable-next-line i18next/no-literal-string
      accounts = [...accounts, `eip155:${newChainId}:${accountAddress}`];
    }

    // Note: Used for adding a new account(etherspot, key)
    if (newAccountAddress) {
      // eslint-disable-next-line i18next/no-literal-string
      accounts = [...accounts, ...chains.map((chain) => `${chain}:${newAccountAddress}`)];
    }

    const updatedNamespaces = {
      ...namespaces,
      eip155: {
        ...namespaces.eip155,
        accounts,
        chains,
      },
    };

    await dispatch(updateSessionV2Action({ topic, namespaces: updatedNamespaces }, pairingTopic));
  };
};

export const updateSessionV2Action = (updatedSession: Object, pairingTopic: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await web3wallet?.updateSession(updatedSession);

      const activeSessions: any = await web3wallet?.getActiveSessions();
      if (!isEmpty(activeSessions)) {
        const currentSession: any = Object.values(activeSessions)?.find(
          (activeSession: any) => activeSession.pairingTopic === pairingTopic,
        );
        if (currentSession) {
          dispatch(fetchV2ActiveSessionsAction(currentSession));
        }
      }
    } catch (error) {
      dispatch(setWalletConnectErrorAction(error?.message));
    }
  };
};

export const approveWalletConnectV2ConnectorRequestAction = (id: number, namespaces: ?BaseNamespace | any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
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
    const activeAccount: any = getActiveAccount(accounts);
    const accountAddress = getAccountAddress(activeAccount);

    const { relays, pairingTopic } = currentProposal.params;

    let newNamespace = namespaces;
    if (isEmpty(namespaces)) {
      newNamespace = { eip155: getRequiredNameSpaces(accountAddress) };
    }

    try {
      await web3wallet?.approveSession({
        id,
        relayProtocol: relays[0].protocol,
        namespaces: newNamespace,
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

export const rejectWalletConnectV2ConnectorRequestAction = (id: number) => {
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

    dispatch(resetWalletConnectConnectorRequestAction());
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
      reportErrorLog('rejectWalletConnectV2CallRequestAction -> rejectRequest failed', { error });
      dispatch(setWalletConnectErrorAction(t('error.walletConnect.callRequestRejectFailed')));
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
          lastActiveScreen: APP_FLOW,
          lastActiveScreenParams: {
            screen: WALLETCONNECT_CALL_REQUEST_SCREEN,
            params: navParams,
          },
        });
        return;
      }

      dispatch({ type: VISIBLE_WC_MODAL, payload: true });

      const navigateToAppAction = CommonActions.navigate({
        name: WALLETCONNECT_CALL_REQUEST_SCREEN,
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
