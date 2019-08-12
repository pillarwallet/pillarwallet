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
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';
import { smartWalletService, ACCOUNT_TRANSACTION_COMPLETED } from 'services/smartWallet';
import { saveDbAction } from 'actions/dbActions';
import { getActiveAccountAddress, getActiveAccountType } from 'utils/accounts';
import { getCombinedHistory } from 'utils/history';

import type { RecoveryAgent } from 'models/RecoveryAgents';
import type { AccountRecoveryTransaction } from 'models/Transaction';
import Toast from 'components/Toast';

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
    const friendsAddresses = agents.map(({ ethAddress }) => ethAddress);
    const setupEstimate = await smartWalletService
      .estimateSetupAccountFriendRecoveryExtension(requiredAgentsCount, friendsAddresses)
      .catch(() => null);
    const setupTransactionHash = await smartWalletService
      .setupAccountFriendRecoveryExtension(setupEstimate)
      .catch(() => null);
    if (setupTransactionHash) {
      dispatch(addAccountRecoveryTransactionAction({
        type: ACCOUNT_RECOVERY_TRANSACTION_TYPES.SETUP,
        hash: setupTransactionHash,
      }));
    }
    Toast.show({
      message: 'Not enough ETH for Account Recovery setup',
      type: 'warning',
      title: 'Unable to setup Account Recovery',
      autoClose: true,
    });
  };
};

export const submitAccountRecoveryEnableAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const activeAccountType = getActiveAccountType(accounts);
    if (activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return;
    const enableEstimate = await smartWalletService
      .estimateAddAccountFriendRecoveryExtension()
      .catch(() => null);
    const enableTransactionHash = await smartWalletService
      .addAccountFriendRecoveryExtension(enableEstimate)
      .catch(() => null);
    if (enableTransactionHash) {
      dispatch(addAccountRecoveryTransactionAction({
        type: ACCOUNT_RECOVERY_TRANSACTION_TYPES.ENABLE,
        hash: enableTransactionHash,
      }));
      return;
    }
    Toast.show({
      message: 'Not enough ETH for enabling Account Recovery extension',
      type: 'warning',
      title: 'Unable to setup Account Recovery',
      autoClose: true,
    });
  };
};

export const enableAccountRecoveryAction = () => {
  return async (dispatch: Function) => {
    dispatch({ type: SET_ACCOUNT_RECOVERY_ENABLED });
    dispatch(saveDbAction('accountRecovery', { enabled: true }));
  };
};

export const checkAccountRecoverySetupAction = (newSetup?: boolean) => {
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
    // if enabled we can submit setup from stored agents or ignore action
    if (enabled) {
      const setupTransaction = accountRecoveryTransactions.find(
        ({ type }) => type === ACCOUNT_RECOVERY_TRANSACTION_TYPES.SETUP,
      );
      // we need to check whether to submit initial setup or new setup if requested
      if (!setupTransaction || newSetup) {
        dispatch(submitAccountRecoverySetupAction());
      }
      return;
    }
    // not enabled, let's check if we need to submit enable transaction or update enable state
    const enableTransaction = accountRecoveryTransactions.find(
      ({ type }) => type === ACCOUNT_RECOVERY_TRANSACTION_TYPES.ENABLE,
    );
    if (enableTransaction) {
      // enable transaction was submitted, let's check if it's completed
      const { hash } = enableTransaction;
      const allHistory = getCombinedHistory(getState());
      const { state } = await smartWalletService.getConnectedAccountTransaction(hash).catch(() => {});
      if (state === ACCOUNT_TRANSACTION_COMPLETED
        || allHistory.find(({ hash: _hash, status }) => _hash === hash && status === TX_CONFIRMED_STATUS)) {
        // completed transaction found, lets update enable state and submit initial setup
        dispatch(enableAccountRecoveryAction());
        dispatch(submitAccountRecoverySetupAction());
      }
      return;
    }
    // no enableTransaction means no enable transaction were submitted
    const accountAddress = getActiveAccountAddress(accounts);
    // check for existing setup, if it exists then recovery was enabled previously (wallet imported case)
    const existingRecoverySetup = await smartWalletService.getAccountFriendRecovery(accountAddress).catch(() => null);
    if (existingRecoverySetup) {
      // a setup already exists, enable was already submitted before, let's save this and submit initial setup
      dispatch(enableAccountRecoveryAction());
      dispatch(submitAccountRecoverySetupAction());
      return;
    }
    // enable transaction nor exists nor was submitted, lets start by submitting it
    dispatch(submitAccountRecoveryEnableAction());
  };
};

export const setupAccountRecoveryAction = (agents: RecoveryAgent[], requiredCount: number) => {
  return async (dispatch: Function) => {
    dispatch(setAccountRecoveryAgentsAction(agents, requiredCount));
    dispatch(checkAccountRecoverySetupAction(true)); // true for new setup
  };
};
