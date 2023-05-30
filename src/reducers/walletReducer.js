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
  SET_WALLET_ERROR,
  RESET_WALLET_ERROR,
  REMOVE_WALLET_PRIVATE_KEY,
  UPDATE_PIN_ATTEMPTS,
  SET_WALLET,
  UPDATE_WALLET_BACKUP_STATUS,
  SET_WALLET_IS_DECRYPTING,
  SET_WALLET_IS_ENCRYPTING,
  SET_WALLET_IS_CHANGING_PIN,
  TODAY_FAILED_ATTEMPTS,
} from 'constants/walletConstants';
import type { EthereumWallet } from 'models/Wallet';

export type BackupStatus = {|
  isImported: boolean,
  isBackedUp: boolean,
|};

export type WalletReducerState = {|
  data: ?EthereumWallet,
  backupStatus: BackupStatus,
  pinAttemptsCount: number,
  lastPinAttempt: number,
  isDecrypting: boolean,
  isEncrypting: boolean,
  isChangingPin: boolean,
  errorMessage: ?string,
  failedAttempts: {
    numberOfFailedAttempts: number,
    date: Date,
  },
|};

export type WalletReducerAction = {|
  type: string,
  payload: any,
|};

const initialState = {
  data: null,
  backupStatus: {
    isImported: false,
    isBackedUp: false,
  },
  pinAttemptsCount: 0,
  lastPinAttempt: 0,
  isDecrypting: false,
  isEncrypting: false,
  isChangingPin: false,
  errorMessage: null,
  failedAttempts: {
    numberOfFailedAttempts: 0,
    date: new Date(),
  },
};

const walletReducer = (state: WalletReducerState = initialState, action: WalletReducerAction): WalletReducerState => {
  switch (action.type) {
    case UPDATE_WALLET_BACKUP_STATUS:
      return {
        ...state,
        backupStatus: { ...state.backupStatus, ...action.payload },
      };
    case SET_WALLET:
      return {
        ...state,
        data: action.payload,
        isDecrypting: false,
        isEncrypting: false,
      };
    case REMOVE_WALLET_PRIVATE_KEY:
      return {
        ...state,
        // $FlowFixMe: flow update to 0.122
        data: { ...state.data, privateKey: null },
      };
    case UPDATE_PIN_ATTEMPTS:
      const { pinAttemptsCount, lastPinAttempt } = action.payload;
      return {
        ...state,
        pinAttemptsCount,
        lastPinAttempt,
      };
    case TODAY_FAILED_ATTEMPTS:
      const { failedAttempts } = action.payload;
      return {
        ...state,
        failedAttempts,
      };
    case SET_WALLET_IS_ENCRYPTING:
      return {
        ...state,
        isEncrypting: action.payload !== undefined ? action.payload : true,
      };
    case SET_WALLET_IS_DECRYPTING:
      return {
        ...state,
        isDecrypting: action.payload !== undefined ? action.payload : true,
      };
    case SET_WALLET_IS_CHANGING_PIN:
      return {
        ...state,
        isChangingPin: action.payload !== undefined ? action.payload : true,
      };
    case SET_WALLET_ERROR:
      return {
        ...state,
        errorMessage: action.payload,
        isEncrypting: false,
        isDecrypting: false,
        isChangingPin: false,
      };
    case RESET_WALLET_ERROR:
      return {
        ...state,
        errorMessage: null,
        isDecrypting: false,
        isEncrypting: false,
        isChangingPin: false,
      };
    default:
      return state;
  }
};

export default walletReducer;
