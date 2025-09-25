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
import { isEqual } from 'lodash';

// constants
import {
  UPDATE_ACCOUNTS,
  ACCOUNT_TYPES,
  CHANGING_ACCOUNT,
  DEPLOY_ACCOUNTS,
  DEPLOY_ACCOUNTS_FETCHING,
} from 'constants/accountsConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { saveDbAction } from 'actions/dbActions';
import { connectEtherspotAccountAction } from 'actions/etherspotActions';

// utils
import {
  findAccountById,
  getAccountId,
  getActiveAccount,
  isEtherspotAccount,
  findFirstEtherspotAccount,
} from 'utils/accounts';
import { logBreadcrumb, isCaseInsensitiveMatch } from 'utils/common';

// services
import etherspotServices from 'services/etherspot';

// selectors
import { accountsSelector } from 'selectors';

// types
import type { AccountTypes } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const addAccountAction = (accountAddress: string, type: AccountTypes, accountExtra?: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const newAccount = {
      id: accountAddress,
      type,
      extra: accountExtra,
      isActive: false,
    };

    const existingAccount = accounts.find((account) => isCaseInsensitiveMatch(account.id, accountAddress));
    const updatedAccounts = accounts.filter((account) => !isCaseInsensitiveMatch(account.id, accountAddress));

    if (existingAccount) {
      // $FlowFixMe: flow gets confused here
      updatedAccounts.push({ ...existingAccount, extra: accountExtra });
    } else {
      // $FlowFixMe: flow gets confused here
      updatedAccounts.push(newAccount);
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });

    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const updateAccountExtraIfNeededAction = (accountId: string, accountExtra: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());
    const accountToUpdate = findAccountById(accountId, accounts);
    if (!accountToUpdate) return;

    const patchedAccountExtra = accountExtra;

    const accountExtraNeedsUpdate = !isEqual(accountToUpdate?.extra, patchedAccountExtra);
    if (!accountExtraNeedsUpdate) return;

    const updatedAccounts = accounts.reduce((updated, account) => {
      if (getAccountId(account) === accountId) {
        return [...updated, { ...account, extra: patchedAccountExtra }];
      }

      return [...updated, account];
    }, []);

    dispatch({ type: UPDATE_ACCOUNTS, payload: updatedAccounts });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const removeAccountAction = (accountAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const updatedAccounts = accounts.filter((account) => account.id.toLowerCase() !== accountAddress.toLowerCase());
    if (accounts.length === updatedAccounts.length) {
      return;
    }
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const setActiveAccountAction = (accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const updatedAccounts = accounts.map((acc) => ({ ...acc, isActive: acc.id === accountId }));
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const switchAccountAction = (accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const activeAccount = accounts.find((account) => getAccountId(account) === accountId);

    dispatch({ type: CHANGING_ACCOUNT, payload: true });

    if (activeAccount?.type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET) {
      dispatch(connectEtherspotAccountAction(accountId));
    }

    dispatch(setActiveAccountAction(accountId));
    // dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
    // dispatch(fetchAssetsBalancesAction());
    // dispatch(fetchTransactionsHistoryAction());
    dispatch({ type: CHANGING_ACCOUNT, payload: false });
  };
};

/**
 * Switch active account to Etherspot.
 */
export const switchToEtherspotAccountIfNeededAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const activeAccount = getActiveAccount(accounts);
    if (isEtherspotAccount(activeAccount)) return;

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      logBreadcrumb('switchToEtherspotAccountIfNeededAction', 'no Etherspot account found', { accounts });
      return;
    }

    dispatch(switchAccountAction(getAccountId(etherspotAccount)));
  };
};

/**
 * Free Deploy Polygon / Gnosis accounts.
 */
export const deployAccounts = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      deployAccounts: { isFetching },
    } = getState();

    const networkChains = [CHAIN.XDAI];

    if (isFetching) return;

    dispatch({ type: DEPLOY_ACCOUNTS_FETCHING, payload: true });

    const networkPromises = networkChains.map((chain) => etherspotServices.setBatchDeployAccount(chain));
    const statusReponses = await Promise.all(networkPromises);

    const finalResponse = networkChains.map((chain, index) => {
      return {
        chain,
        status: statusReponses[index],
      };
    });

    dispatch({ type: DEPLOY_ACCOUNTS, payload: finalResponse });

    dispatch({ type: DEPLOY_ACCOUNTS_FETCHING, payload: false });
  };
};
