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
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'react-navigation-hooks';

// actions
import { disconnectWalletConnectSessionByUrlAction } from 'actions/walletConnectSessionsActions';
import {
  estimateWalletConnectCallRequestTransactionAction,
  rejectWalletConnectCallRequestAction,
} from 'actions/walletConnectActions';

// constants
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { WalletConnectReducerState } from 'reducers/walletConnectReducer';
import type { CallRequest, Connector } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';


type WalletConnectHook = {
  activeConnectors: Connector[],
  callRequests: CallRequest[],
  approveConnectorRequest: () => void,
  cancelConnectorRequest: () => void,
  approveCallRequest: (
    callRequest: CallRequest,
    transactionPayload: ?TransactionPayload,
  ) => void,
  cancelCallRequest: (
    callRequest: CallRequest,
  ) => void,
  disconnectSessionByUrl: (url: string) => void,
  connectToConnector: (url: string) => void,
  estimateCallRequestTransaction: (callRequest: CallRequest) => void,
};

const useWalletConnect = (): WalletConnectHook => {
  const {
    activeConnectors,
    callRequests,
  }: WalletConnectReducerState = useSelector(({ walletConnect }: RootReducerState) => walletConnect);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const connectToConnector = () => { console.log('connectToConnector!'); };
  const approveConnectorRequest = () => { console.log('approveConnectorRequest!'); };
  const cancelConnectorRequest = () => { console.log('cancelConnectorRequest!'); };

  const approveCallRequest = (
    callRequest: CallRequest,
    transactionPayload: ?TransactionPayload,
  ) => {
    navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, {
      callId: callRequest.callId,
      transactionPayload,
    });
  };

  const cancelCallRequest = (
    callRequest: CallRequest,
  ) => dispatch(rejectWalletConnectCallRequestAction(callRequest.callId));

  const disconnectSessionByUrl = (
    url: string,
  ) => dispatch(disconnectWalletConnectSessionByUrlAction(url));

  const estimateCallRequestTransaction = (
    callRequest: CallRequest,
  ) => dispatch(estimateWalletConnectCallRequestTransactionAction(callRequest));

  return useMemo(() => ({
    activeConnectors,
    callRequests,
    approveConnectorRequest,
    cancelConnectorRequest,
    approveCallRequest,
    cancelCallRequest,
    disconnectSessionByUrl,
    connectToConnector,
    estimateCallRequestTransaction,
  }), [activeConnectors, callRequests])
};

export default useWalletConnect;
