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
  ADD_ACCOUNT,
  UPDATE_ACCOUNTS,
  ACCOUNT_TYPES,
} from 'constants/accountsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';
import {
  connectSmartWalletAccountAction,
  initSmartWalletSdkAction,
  setSmartWalletUpgradeStatusAction,
} from 'actions/smartWalletActions';
import { UPDATE_BALANCES } from 'constants/assetsConstants';
import Storage from 'services/storage';
import { migrateBalancesToAccountsFormat } from 'utils/dataMigration';

const storage = Storage.getInstance('db');

export const initDefaultAccountAction = (walletAddress: string) => {
  return async (dispatch: Function) => {
    const { balances = {} } = await storage.get('balances');
    const keyBasedAccount = {
      id: walletAddress,
      type: ACCOUNT_TYPES.KEY_BASED,
      isActive: true,
    };
    dispatch({
      type: ADD_ACCOUNT,
      payload: keyBasedAccount,
    });

    /*
     * Data migration
     */

    // balances
    if (!balances[walletAddress]) {
      const migratedBalances = migrateBalancesToAccountsFormat(balances, [keyBasedAccount]);
      if (migratedBalances) {
        dispatch({ type: UPDATE_BALANCES, payload: migratedBalances });
        dispatch(saveDbAction('balances', { balances: migratedBalances }, true));
      }
    }

    dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));
  };
};

export const addNewAccountAction = (accountAddress: string, accountExtra?: Object = {}) => {
  return async (dispatch: Function, getState: Function) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = {
      id: accountAddress,
      type: ACCOUNT_TYPES.SMART_WALLET,
      extra: accountExtra,
      isActive: false,
    };
    const existingAccount = accounts.find(account => account.id === accountAddress);
    const updatedAccounts = accounts.filter(account => account.id !== accountAddress);
    if (existingAccount) {
      updatedAccounts.push({ ...existingAccount, extra: accountExtra });
    } else {
      updatedAccounts.push(smartWalletAccount);
    }
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const setActiveAccountAction = (accountId: string) => {
  return async (dispatch: Function, getState: Function) => {
    const { accounts: { data: accounts } } = getState();
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      // TODO: account not found in storage
      console.log('setActiveAccountAction account not found by id: ', accountId);
      return;
    }
    const updatedAccounts = accounts.map(acc => ({ ...acc, isActive: acc.id === accountId }));
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
    if (account.type !== ACCOUNT_TYPES.SMART_WALLET || !account.extra) return;
    const { extra: { state = '' } } = account;
    switch (state.toString().toLowerCase()) {
      case 'deployed':
        dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
        break;
      case 'created':
        dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED));
        break;
      default:
        break;
    }
  };
};

export const switchAccountAction = (accountId: string, privateKey?: string) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      assets: { data: assets },
    } = getState();
    const account = accounts.find(_acc => _acc.id === accountId) || {};

    if (account.type === ACCOUNT_TYPES.KEY_BASED) {
      await dispatch(setActiveAccountAction(accountId));
    } else if (account.type === ACCOUNT_TYPES.SMART_WALLET && privateKey) {
      await dispatch(initSmartWalletSdkAction(privateKey));
      await dispatch(connectSmartWalletAccountAction(accountId));
      await dispatch(setActiveAccountAction(accountId));
    }

    dispatch(fetchAssetsBalancesAction(assets));
    dispatch(fetchCollectiblesAction());
  };
};
