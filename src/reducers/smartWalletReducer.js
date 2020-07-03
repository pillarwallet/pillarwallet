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
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SET_SMART_WALLET_DEPLOYMENT_DATA,
  RESET_SMART_WALLET,
  SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID,
  SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID,
  START_SMART_WALLET_DEPLOYMENT,
  RESET_SMART_WALLET_DEPLOYMENT,
  ADD_SMART_WALLET_CONNECTED_ACCOUNT_DEVICE,
} from 'constants/smartWalletConstants';
import type {
  SmartWalletAccount,
  ConnectedSmartWalletAccount,
  SmartWalletDeploymentError,
} from 'models/SmartWalletAccount';

export type SmartWalletReducerState = {
  sdkInitialized: boolean,
  connectedAccount: $Shape<ConnectedSmartWalletAccount>,
  accounts: SmartWalletAccount[],
  upgrade: {
    status: ?string,
    deploymentStarted: boolean,
    deploymentData: {
      hash: ?string,
      error: ?SmartWalletDeploymentError,
    },
  },
  lastSyncedTransactionId: ?number,
  lastSyncedPaymentId: ?number,
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
    deploymentStarted: false,
    deploymentData: {
      hash: null,
      error: null,
    },
  },
  lastSyncedTransactionId: null,
  lastSyncedPaymentId: null,
};

export default function smartWalletReducer(
  state: SmartWalletReducerState = initialState,
  action: SmartWalletReducerAction,
): SmartWalletReducerState {
  switch (action.type) {
    case SET_SMART_WALLET_SDK_INIT:
      return {
        ...state,
        sdkInitialized: action.payload,
      };
    case SET_SMART_WALLET_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload,
      };
    case SET_SMART_WALLET_CONNECTED_ACCOUNT:
      return {
        ...state,
        connectedAccount: action.payload,
      };
    case SET_SMART_WALLET_UPGRADE_STATUS:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          status: action.payload,
        },
      };
    case SET_SMART_WALLET_DEPLOYMENT_DATA:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentData: {
            ...action.payload,
          },
        },
      };
    case SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID:
      return {
        ...state,
        lastSyncedPaymentId: action.payload || initialState.lastSyncedPaymentId,
      };
    case SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID:
      return {
        ...state,
        lastSyncedTransactionId: action.payload || initialState.lastSyncedTransactionId,
      };
    case RESET_SMART_WALLET:
      return { ...initialState };
    case START_SMART_WALLET_DEPLOYMENT:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentStarted: true,
        },
      };
    case RESET_SMART_WALLET_DEPLOYMENT:
      return {
        ...state,
        upgrade: {
          ...state.upgrade,
          deploymentStarted: false,
        },
      };
    case ADD_SMART_WALLET_CONNECTED_ACCOUNT_DEVICE:
      return {
        ...state,
        connectedAccount: {
          ...state.connectedAccount,
          devices: [
            ...state.connectedAccount.devices,
            action.payload,
          ],
        },
      };
    default:
      return state;
  }
}
