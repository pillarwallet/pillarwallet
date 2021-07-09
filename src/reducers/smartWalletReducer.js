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
  SET_ARCHANOVA_SDK_INIT,
  SET_ARCHANOVA_WALLET_ACCOUNTS,
  SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT,
  SET_ARCHANOVA_WALLET_UPGRADE_STATUS,
  SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA,
  RESET_ARCHANOVA_WALLET,
  SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID,
  SET_ARCHANOVA_WALLET_LAST_SYNCED_TRANSACTION_ID,
  START_ARCHANOVA_WALLET_DEPLOYMENT,
  RESET_ARCHANOVA_WALLET_DEPLOYMENT,
  SET_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE,
  SET_GETTING_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE,
  SET_CHECKING_ARCHANOVA_SESSION,
} from 'constants/archanovaConstants';

// types
import type {
  ArchanovaWalletAccount,
  ConnectedArchanovaWalletAccount,
  ArchanovaWalletDeploymentError,
} from 'models/ArchanovaWalletAccount';
import type { ArchanovaTransactionEstimate } from 'services/archanova';


export type SmartWalletReducerState = {
  sdkInitialized: boolean,
  connectedAccount: $Shape<ConnectedArchanovaWalletAccount>,
  accounts: ArchanovaWalletAccount[],
  upgrade: {
    status: ?string,
    deploymentEstimate: ?{
      raw: Object,
      formatted: ArchanovaTransactionEstimate,
    },
    gettingDeploymentEstimate: boolean,
    deploymentStarted: boolean,
    deploymentData: {
      hash: ?string,
      error: ?ArchanovaWalletDeploymentError,
    },
  },
  lastSyncedTransactionId: ?number,
  lastSyncedPaymentId: ?number,
  isCheckingSmartWalletSession: boolean,
};

export type SmartWalletReducerAction = {
  type: string,
  payload?: any,
};

export const initialState = {
  sdkInitialized: false,
  connectedAccount: {},
  accounts: [],
  upgrade: {
    status: null,
    deploymentEstimate: null,
    gettingDeploymentEstimate: false,
    deploymentStarted: false,
    deploymentData: {
      hash: null,
      error: null,
    },
  },
  lastSyncedTransactionId: null,
  lastSyncedPaymentId: null,
  isCheckingSmartWalletSession: false,
};

export default function smartWalletReducer(
  state: SmartWalletReducerState = initialState,
  action: SmartWalletReducerAction,
): SmartWalletReducerState {
  switch (action.type) {
    case SET_ARCHANOVA_SDK_INIT:
      return {
        ...state,
        // $FlowFixMe: flow update to 0.122
        sdkInitialized: action.payload,
      };
    case SET_ARCHANOVA_WALLET_ACCOUNTS:
      return {
        ...state,
        // $FlowFixMe: flow update to 0.122
        accounts: action.payload,
      };
    case SET_ARCHANOVA_WALLET_CONNECTED_ACCOUNT:
      return {
        ...state,
        // $FlowFixMe: flow update to 0.122
        connectedAccount: action.payload,
      };
    case SET_ARCHANOVA_WALLET_UPGRADE_STATUS:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          status: action.payload,
        },
      };
    case SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          // $FlowFixMe: flow update to 0.122
          deploymentData: {
            ...action.payload,
          },
        },
      };
    case SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID:
      return {
        ...state,
        lastSyncedPaymentId: action.payload || initialState.lastSyncedPaymentId,
      };
    case SET_ARCHANOVA_WALLET_LAST_SYNCED_TRANSACTION_ID:
      return {
        ...state,
        lastSyncedTransactionId: action.payload || initialState.lastSyncedTransactionId,
      };
    case RESET_ARCHANOVA_WALLET:
      return { ...initialState };
    case START_ARCHANOVA_WALLET_DEPLOYMENT:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentStarted: true,
        },
      };
    case RESET_ARCHANOVA_WALLET_DEPLOYMENT:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentStarted: false,
        },
      };
    case SET_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentEstimate: action.payload,
          gettingDeploymentEstimate: false,
        },
      };
    case SET_GETTING_ARCHANOVA_WALLET_DEPLOYMENT_ESTIMATE:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          // $FlowFixMe: flow update to 0.122
          gettingDeploymentEstimate: action.payload,
        },
      };
    case SET_CHECKING_ARCHANOVA_SESSION:
      return {
        ...state,
        // $FlowFixMe: flow update to 0.122
        isCheckingSmartWalletSession: action.payload,
      };
    default:
      return state;
  }
}
