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
  ADD_ACCOUNT_RECOVERY_TRANSACTION,
  SET_ACCOUNT_RECOVERY_ENABLED,
  ACCOUNT_RECOVERY_TRANSACTION_TYPES,
} from 'constants/accountRecoveryConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import smartWalletService from 'services/smartWallet';
import { saveDbAction } from 'actions/dbActions';
import { getActiveAccountAddress, getActiveAccountType } from 'utils/accounts';

import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { AccountRecoveryTransaction } from 'models/Transaction';

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

export const addAccountRecoveryTransactionAction = (transaction: AccountRecoveryTransaction) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accountRecovery: {
        transactions: prevTransactions,
      },
    } = getState();
    const transactions = prevTransactions.concat(transaction);
    dispatch({
      type: ADD_ACCOUNT_RECOVERY_TRANSACTION,
      payload: transaction,
    });
    dispatch(saveDbAction('accountRecovery', { transactions }));
  };
};

export const submitAccountRecoverySetupAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      accountRecovery: {
        agents,
        requiredAgentsCount,
      },
    } = getState();
    const activeAccountType = getActiveAccountType(accounts);
    if (!agents.length || activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return;
    const setupEstimate = await smartWalletService
      .estimateSetupAccountFriendRecoveryExtension(requiredAgentsCount, agents.map(({ address }) => address));
    const setupTransaction = await smartWalletService.setupAccountFriendRecoveryExtension(setupEstimate);
    if (setupTransaction) {
      console.log('setupTransaction: ', setupTransaction);
      const { hash } = setupTransaction;
      dispatch(addAccountRecoveryTransactionAction({
        type: ACCOUNT_RECOVERY_TRANSACTION_TYPES.SETUP,
        hash,
      }));
    }
  };
};

export const submitAccountRecoveryEnableAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const activeAccountType = getActiveAccountType(accounts);
    if (!activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return;
    const enableEstimate = await smartWalletService.estimateAddAccountFriendRecoveryExtension();
    const enableTransaction = await smartWalletService.addAccountFriendRecoveryExtension(enableEstimate);
    if (enableTransaction) {
      console.log('estimateTransaction: ', enableTransaction);
      const { hash } = enableTransaction;
      dispatch(addAccountRecoveryTransactionAction({
        type: ACCOUNT_RECOVERY_TRANSACTION_TYPES.ENABLE,
        hash,
      }));
    }
  };
};

export const enableAccountRecoveryAction = () => {
  return async (dispatch: Function) => {
    dispatch({ type: SET_ACCOUNT_RECOVERY_ENABLED });
    dispatch(saveDbAction('accountRecovery', { enabled: true }));
  };
};

export const checkAccountRecoverySetupAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      accountRecovery: {
        enabled,
        agents,
        transactions: accountRecoveryTransactions,
      },
    } = getState();
    const activeAccountType = getActiveAccountType(accounts);
    if (!agents.length || activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return;
    const setupTransaction = accountRecoveryTransactions.find(
      ({ type }) => type === ACCOUNT_RECOVERY_TRANSACTION_TYPES.SETUP,
    );
    // if enabled and no initial setup let's submit initial setup from stored agents
    if (enabled && !setupTransaction) {
      dispatch(submitAccountRecoverySetupAction());
      return;
    }
    // not enabled, let's check if we need to submit enable
    const enableTransaction = accountRecoveryTransactions.find(
      ({ type }) => type === ACCOUNT_RECOVERY_TRANSACTION_TYPES.ENABLE,
    );
    // no enableTransaction means no enable transaction were submitted
    if (!enableTransaction) {
      const accountAddress = getActiveAccountAddress(accounts);
      const existingRecoverySetup = await smartWalletService.getAccountFriendRecovery(accountAddress).catch(() => null);
      if (existingRecoverySetup) {
        // a setup already exists, enable was already submitted before, let's save this and submit setup
        dispatch(enableAccountRecoveryAction());
        dispatch(submitAccountRecoverySetupAction());
        return;
      }
      dispatch(submitAccountRecoveryEnableAction());
    }
  };
};

export const setupAccountRecoveryAction = (agents: RecoveryAgent[], requiredCount: number) => {
  return async (dispatch: Function) => {
    dispatch(setAccountRecoveryAgentsAction(agents, requiredCount));
    dispatch(checkAccountRecoverySetupAction());
  };
};
