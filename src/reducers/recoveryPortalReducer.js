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
  RESET_RECOVERY_PORTAL_TEMPORARY_WALLET,
  SET_RECOVERY_PORTAL_TEMPORARY_WALLET,
} from 'constants/recoveryPortalConstants';

import type { EthereumWallet } from 'models/Wallet';


export type RecoveryPortalReducerState = {
  temporaryWallet: ?EthereumWallet,
};

export type RecoveryPortalReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  temporaryWallet: null,
};

export default function RecoveryPortalReducer(
  state: RecoveryPortalReducerState = initialState,
  action: RecoveryPortalReducerAction,
) {
  switch (action.type) {
    case SET_RECOVERY_PORTAL_TEMPORARY_WALLET:
      return {
        ...state,
        temporaryWallet: action.payload,
      };
    case RESET_RECOVERY_PORTAL_TEMPORARY_WALLET:
      return {
        ...state,
        temporaryWallet: null,
      };
    default:
      return state;
  }
}
