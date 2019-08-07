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
  SET_ACCOUNT_RECOVERY_SETUP_TRANSACTION,
  SET_ACCOUNT_RECOVERY_ENABLE_TRANSACTION,
  SET_ACCOUNT_RECOVERY_ENABLED,
  SET_ACCOUNT_RECOVERY_DISABLED,
} from 'constants/accountRecoveryConstants';
import { saveDbAction } from 'actions/dbActions';

import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { Transaction } from 'models/Transaction';

export const setAccountRecoveryAgentsAction = (agents: RecoveryAgent[], requiredCount: number) => {
  return async (dispatch: Function) => {
    dispatch({
      type: SET_ACCOUNT_RECOVERY_AGENTS,
      payload: {
        agents,
        requiredCount,
      },
    });
    dispatch(saveDbAction('accountRecovery', { agents, requiredAgentsCount: requiredCount }));
  };
};

export const setAccountRecoverySetupTransactionAction = (enableTransaction: Transaction) => {
  return async (dispatch: Function) => {
    dispatch({
      type: SET_ACCOUNT_RECOVERY_SETUP_TRANSACTION,
      payload: enableTransaction,
    });
    dispatch(saveDbAction('accountRecovery', { enableTransaction }));
  };
};

export const setAccountRecoveryEnableTransactionAction = (setupTransaction: Transaction) => {
  return async (dispatch: Function) => {
    dispatch({
      type: SET_ACCOUNT_RECOVERY_ENABLE_TRANSACTION,
      payload: setupTransaction,
    });
    dispatch(saveDbAction('accountRecovery', { setupTransaction }));
  };
};

export const setAccountRecoveryEnabledAction = (enabled: boolean) => {
  return async (dispatch: Function) => {
    dispatch({ type: enabled ? SET_ACCOUNT_RECOVERY_ENABLED : SET_ACCOUNT_RECOVERY_DISABLED });
    dispatch(saveDbAction('accountRecovery', { enabled }));
  };
};
