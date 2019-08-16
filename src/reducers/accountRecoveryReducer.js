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
  SET_ACCOUNT_RECOVERY_AGENTS,
  SET_ACCOUNT_RECOVERY_ENABLED,
  ADD_ACCOUNT_RECOVERY_TRANSACTION,
  SET_ACCOUNT_RECOVERY_TRANSACTIONS,
} from 'constants/accountRecoveryConstants';

import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { AccountRecoveryTransaction } from 'models/Transaction';

export type AccountRecoveryReducerState = {
  enabled: boolean,
  agents: RecoveryAgent[],
  requiredAgentsCount: number,
  transactions: AccountRecoveryTransaction[],
}

export type AccountRecoveryReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  enabled: false,
  agents: [],
  requiredAgentsCount: 0,
  transactions: [],
};

export default function accountRecoveryReducer(
  state: AccountRecoveryReducerState = initialState,
  action: AccountRecoveryReducerAction,
): AccountRecoveryReducerState {
  switch (action.type) {
    case SET_ACCOUNT_RECOVERY_AGENTS:
      if (!action.payload) return state;
      const { payload: { agents, requiredCount } } = action;
      return {
        ...state,
        agents,
        requiredAgentsCount: requiredCount,
      };
    case SET_ACCOUNT_RECOVERY_ENABLED:
      return {
        ...state,
        enabled: true,
      };
    case ADD_ACCOUNT_RECOVERY_TRANSACTION:
      return {
        ...state,
        transactions: [
          ...state.transactions,
          action.payload,
        ],
      };
    case SET_ACCOUNT_RECOVERY_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
      };
    default:
      return state;
  }
}
