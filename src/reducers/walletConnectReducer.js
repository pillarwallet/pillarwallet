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
import {
  SET_WALLETCONNECT_REQUEST_ERROR,
  RESET_WALLETCONNECT_CONNECTOR_REQUEST,
  ADD_WALLETCONNECT_CALL_REQUEST,
  REMOVE_WALLETCONNECT_CALL_REQUEST,
  SET_WALLETCONNECT_CURRENT_PROPOSAL,
  VISIBLE_WC_MODAL,
} from 'constants/walletConnectConstants';

import type { WalletConnectCallRequest, WalletConnectV2Proposal } from 'models/WalletConnect';

export type SetWalletConnectCurrentProposalAction = {|
  type: typeof SET_WALLETCONNECT_CURRENT_PROPOSAL,
  payload: { currentProposal: ?WalletConnectV2Proposal },
|};

export type ResetWalletConnectConnectorRequestAction = {|
  type: typeof RESET_WALLETCONNECT_CONNECTOR_REQUEST,
|};

export type AddWalletConnectCallRequestAction = {|
  type: typeof ADD_WALLETCONNECT_CALL_REQUEST,
  payload: { callRequest: WalletConnectCallRequest },
|};

export type RemoveWalletConnectCallRequestAction = {|
  type: typeof REMOVE_WALLETCONNECT_CALL_REQUEST,
  payload: { callId: string | number },
|};

export type SetWalletConnectRequestErrorAction = {|
  type: typeof SET_WALLETCONNECT_REQUEST_ERROR,
  payload: { message: string },
|};

export type WalletConnectRequestVisibleAction = {|
  type: typeof VISIBLE_WC_MODAL,
  payload: boolean,
|};

export type WalletConnectReducerAction =
  | ResetWalletConnectConnectorRequestAction
  | AddWalletConnectCallRequestAction
  | RemoveWalletConnectCallRequestAction
  | SetWalletConnectRequestErrorAction
  | SetWalletConnectCurrentProposalAction
  | WalletConnectRequestVisibleAction;

export type WalletConnectReducerState = {|
  callRequests: WalletConnectCallRequest[],
  currentProposal: ?WalletConnectV2Proposal,
  errorMessage: ?string,
  isVisibleModal: boolean,
|};

const initialState: WalletConnectReducerState = {
  currentProposal: null,
  callRequests: [],
  errorMessage: null,
  isVisibleModal: false,
};

const removeRequestByCallId = (
  callRequests: WalletConnectCallRequest[],
  callIdToRemove: number,
): WalletConnectCallRequest[] => callRequests.filter(({ callId }) => +callId !== callIdToRemove);

const walletConnectReducer = (
  state: WalletConnectReducerState = initialState,
  action: WalletConnectReducerAction,
): WalletConnectReducerState => {
  const { callRequests } = state;

  switch (action.type) {
    case SET_WALLETCONNECT_CURRENT_PROPOSAL:
      const { currentProposal } = action.payload;
      return { ...state, currentProposal };

    case RESET_WALLETCONNECT_CONNECTOR_REQUEST:
      return { ...state, currentProposal: null };

    case ADD_WALLETCONNECT_CALL_REQUEST:
      const { callRequest } = action.payload;

      const isExists = callRequests.some((request) => request.callId === callRequest.callId);
      if (isExists) return { ...state, callRequests };
      return { ...state, callRequests: [...callRequests, callRequest] };

    case REMOVE_WALLETCONNECT_CALL_REQUEST:
      const { callId } = action.payload;
      return { ...state, callRequests: removeRequestByCallId(callRequests, +callId) };

    case VISIBLE_WC_MODAL:
      return { ...state, isVisibleModal: action.payload };

    case SET_WALLETCONNECT_REQUEST_ERROR:
      const { message: errorMessage } = action.payload;
      return {
        ...state,
        errorMessage,
        currentProposal: null,
        callRequests: [],
      };

    default:
      return state;
  }
};

export default walletConnectReducer;
