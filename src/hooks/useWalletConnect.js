// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslationWithPrefix } from 'translations/translate';

// selectors
import { useRootSelector, useAccounts } from 'selectors';

// actions
import {
  disconnectWalletConnectSessionByUrlAction,
  disconnectWalletConnectV2SessionByTopicAction,
} from 'actions/walletConnectSessionsActions';
import {
  approveWalletConnectCallRequestAction,
  approveWalletConnectConnectorRequestAction,
  approveWalletConnectV2ConnectorRequestAction,
  connectToWalletConnectConnectorAction,
  estimateWalletConnectCallRequestTransactionAction,
  updateWalletConnectConnectorSessionAction,
  rejectWalletConnectCallRequestAction,
  rejectWalletConnectConnectorRequestAction,
  rejectWalletConnectV2ConnectorRequestAction,
  switchEthereumChainConnectorAction,
  approveWalletConnectV2CallRequestAction,
  rejectWalletConnectV2CallRequestAction,
  fetchV2ActiveSessionsAction,
} from 'actions/walletConnectActions';

// Constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { WalletConnectReducerState } from 'reducers/walletConnectReducer';
import type {
  WalletConnectCallRequest,
  WalletConnectConnector,
  sessionDataProps,
  BaseNamespace,
} from 'models/WalletConnect';
import type { Account } from 'models/Account';

type UseWalletConnectResult = {|
  activeConnectors: WalletConnectConnector[],
  callRequests: WalletConnectCallRequest[],
  approveConnectorRequest: (peerId: string, chainId: number) => void,
  rejectConnectorRequest: (peerId: string) => void,
  approveCallRequest: (callRequest: WalletConnectCallRequest, result: string) => void,
  rejectCallRequest: (callRequest: WalletConnectCallRequest, rejectReasonMessage?: string) => void,
  disconnectSessionByUrl: (url: string) => void,
  connectToConnector: (url: string) => void,
  estimateCallRequestTransaction: (callRequest: WalletConnectCallRequest) => void,
  updateConnectorSession: (connector: any, session: any) => void,
  switchEthereumChainConnectorRequest: (request: Object) => void,
  fetchV2ActiveSessions: () => void,
  approveV2ConnectorRequest: (id: number, namespaces: ?BaseNamespace | any) => void,
  rejectV2ConnectorRequest: (id: string) => void,
  rejectV2CallRequest: (callRequest: WalletConnectCallRequest, message: any) => void,
  approveV2CallRequest: (callRequest: WalletConnectCallRequest, result: any) => void,
  disconnectSessionV2ByTopic: (topic: string) => void,
|};

const useWalletConnect = (): UseWalletConnectResult => {
  const { activeConnectors, callRequests }: WalletConnectReducerState = useRootSelector(
    ({ walletConnect }: RootReducerState) => walletConnect,
  );

  const dispatch = useDispatch();

  const connectToConnector = useCallback(
    (uri: string) => dispatch(connectToWalletConnectConnectorAction(uri)),
    [dispatch],
  );

  const disconnectSessionByUrl = useCallback(
    (url: string) => dispatch(disconnectWalletConnectSessionByUrlAction(url)),
    [dispatch],
  );

  const disconnectSessionV2ByTopic = useCallback(
    (topic: string) => dispatch(disconnectWalletConnectV2SessionByTopicAction(topic)),
    [dispatch],
  );

  const approveConnectorRequest = useCallback(
    (peerId: string, chainId: number) => dispatch(approveWalletConnectConnectorRequestAction(peerId, chainId)),
    [dispatch],
  );

  const approveV2ConnectorRequest = useCallback(
    (id: number, namespaces: any) => dispatch(approveWalletConnectV2ConnectorRequestAction(id, namespaces)),
    [dispatch],
  );

  const updateConnectorSession = useCallback(
    (connector: Object, sessionData: sessionDataProps) =>
      dispatch(updateWalletConnectConnectorSessionAction(connector, sessionData)),
    [dispatch],
  );

  const switchEthereumChainConnectorRequest = useCallback(
    (request: Object) => dispatch(switchEthereumChainConnectorAction(request)),
    [dispatch],
  );

  const rejectConnectorRequest = useCallback(
    (peerId: string) => dispatch(rejectWalletConnectConnectorRequestAction(peerId)),
    [dispatch],
  );

  const rejectV2ConnectorRequest = useCallback(
    (id: string) => dispatch(rejectWalletConnectV2ConnectorRequestAction(id)),
    [dispatch],
  );

  const approveCallRequest = useCallback(
    (callRequest: WalletConnectCallRequest, result: string) =>
      dispatch(approveWalletConnectCallRequestAction(callRequest.callId, result)),
    [dispatch],
  );

  const rejectCallRequest = useCallback(
    (callRequest: WalletConnectCallRequest, rejectReasonMessage?: string) =>
      dispatch(rejectWalletConnectCallRequestAction(callRequest.callId, rejectReasonMessage)),
    [dispatch],
  );

  const approveV2CallRequest = useCallback(
    (callRequest: WalletConnectCallRequest, result: any) =>
      dispatch(approveWalletConnectV2CallRequestAction(callRequest, result)),
    [dispatch],
  );

  const rejectV2CallRequest = useCallback(
    (callRequest: WalletConnectCallRequest, rejectReasonMessage: string) =>
      dispatch(rejectWalletConnectV2CallRequestAction(callRequest, rejectReasonMessage)),
    [dispatch],
  );

  const fetchV2ActiveSessions = useCallback(() => dispatch(fetchV2ActiveSessionsAction()), [dispatch]);

  const estimateCallRequestTransaction = useCallback(
    (callRequest: WalletConnectCallRequest) => dispatch(estimateWalletConnectCallRequestTransactionAction(callRequest)),
    [dispatch],
  );

  return useMemo(
    () => ({
      activeConnectors,
      callRequests,
      approveConnectorRequest,
      approveV2ConnectorRequest,
      rejectConnectorRequest,
      rejectV2ConnectorRequest,
      approveCallRequest,
      rejectCallRequest,
      disconnectSessionByUrl,
      connectToConnector,
      updateConnectorSession,
      estimateCallRequestTransaction,
      switchEthereumChainConnectorRequest,
      approveV2CallRequest,
      rejectV2CallRequest,
      fetchV2ActiveSessions,
      disconnectSessionV2ByTopic,
    }),
    [
      activeConnectors,
      callRequests,
      approveConnectorRequest,
      approveV2ConnectorRequest,
      rejectConnectorRequest,
      rejectV2ConnectorRequest,
      approveCallRequest,
      rejectCallRequest,
      disconnectSessionByUrl,
      connectToConnector,
      updateConnectorSession,
      estimateCallRequestTransaction,
      switchEthereumChainConnectorRequest,
      approveV2CallRequest,
      rejectV2CallRequest,
      fetchV2ActiveSessions,
      disconnectSessionV2ByTopic,
    ],
  );
};

export const useWalletConnectAccounts = (id?: string) => {
  const accounts = useAccounts();
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');

  const wallets = useMemo(() => {
    const avlAccounts: any = [];
    accounts.forEach((account: Account) => {
      if (account.type === ACCOUNT_TYPES.KEY_BASED) {
        // eslint-disable-next-line i18next/no-literal-string
        avlAccounts.push({ value: 'Key wallet', label: t('key_based'), icon: 'key-wallet', ...account });
      }
      if (account.type === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET) {
        // eslint-disable-next-line i18next/no-literal-string
        avlAccounts.push({ value: 'Archanova wallet', label: t('plr_v1'), icon: 'plr-token', ...account });
      }
      if (account.type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET) {
        // eslint-disable-next-line i18next/no-literal-string
        avlAccounts.push({ value: 'Smart wallet', label: t('etherspot'), icon: 'etherspot', ...account });
      }
    });
    return avlAccounts;
  }, [accounts, t]);

  if (id) {
    return wallets.filter(({ id: accountId }) => accountId === id);
  }

  return wallets;
};

export default useWalletConnect;
