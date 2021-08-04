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

// selectors
import { useRootSelector } from 'selectors';

// actions
import { disconnectWalletConnectSessionByUrlAction } from 'actions/walletConnectSessionsActions';
import {
  approveWalletConnectCallRequestAction,
  approveWalletConnectConnectorRequestAction,
  connectToWalletConnectConnectorAction,
  estimateWalletConnectCallRequestTransactionAction,
  rejectWalletConnectCallRequestAction,
  rejectWalletConnectConnectorRequestAction,
} from 'actions/walletConnectActions';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { WalletConnectReducerState } from 'reducers/walletConnectReducer';
import type { WalletConnectCallRequest, WalletConnectConnector } from 'models/WalletConnect';


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
|};

const useWalletConnect = (): UseWalletConnectResult => {
  const {
    activeConnectors,
    callRequests,
  }: WalletConnectReducerState = useRootSelector(({ walletConnect }: RootReducerState) => walletConnect);

  const dispatch = useDispatch();

  const connectToConnector = useCallback(
    (uri: string) => dispatch(connectToWalletConnectConnectorAction(uri)),
    [dispatch],
  );

  const disconnectSessionByUrl = useCallback(
    (url: string) => dispatch(disconnectWalletConnectSessionByUrlAction(url)),
    [dispatch],
  );

  const approveConnectorRequest = useCallback(
    (peerId: string, chainId: number) => dispatch(approveWalletConnectConnectorRequestAction(peerId, chainId)),
    [dispatch],
  );

  const rejectConnectorRequest = useCallback(
    (peerId: string) => dispatch(rejectWalletConnectConnectorRequestAction(peerId)),
    [dispatch],
  );

  const approveCallRequest = useCallback(
    (
      callRequest: WalletConnectCallRequest,
      result: string,
    ) => dispatch(approveWalletConnectCallRequestAction(callRequest.callId, result)),
    [dispatch],
  );

  const rejectCallRequest = useCallback(
    (
      callRequest: WalletConnectCallRequest,
      rejectReasonMessage?: string,
    ) => dispatch(rejectWalletConnectCallRequestAction(callRequest.callId, rejectReasonMessage)),
    [dispatch],
  );

  const estimateCallRequestTransaction = useCallback(
    (
      callRequest: WalletConnectCallRequest,
    ) => dispatch(estimateWalletConnectCallRequestTransactionAction(callRequest)),
    [dispatch],
  );

  return useMemo(() => ({
    activeConnectors,
    callRequests,
    approveConnectorRequest,
    rejectConnectorRequest,
    approveCallRequest,
    rejectCallRequest,
    disconnectSessionByUrl,
    connectToConnector,
    estimateCallRequestTransaction,
  }), [
    activeConnectors,
    callRequests,
    approveConnectorRequest,
    rejectConnectorRequest,
    approveCallRequest,
    rejectCallRequest,
    disconnectSessionByUrl,
    connectToConnector,
    estimateCallRequestTransaction,
  ]);
};

export default useWalletConnect;
