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
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import { findFirstSmartAccount } from 'utils/accounts';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import type { Accounts } from 'models/Account';


function addWalletIdToSmartWalletAccount(accounts: Accounts, walletId: string): Accounts {
  return accounts.map(account => {
    if (account.type !== ACCOUNT_TYPES.SMART_WALLET) return account;
    return {
      ...account,
      walletId,
    };
  });
}

export default async function (storageData: Object, dispatch: Function) {
  const { accounts = [] } = get(storageData, 'accounts', {});
  const { user = {} } = get(storageData, 'user', {});

  // wallet is not registered yet
  if (!user.walletId) return accounts;

  const smartWalletAccount = findFirstSmartAccount(accounts);

  if (smartWalletAccount && !smartWalletAccount.walletId) {
    const migratedAccounts = addWalletIdToSmartWalletAccount(accounts, user.walletId);
    dispatch(saveDbAction('accounts', { accounts: migratedAccounts }, true));
    return migratedAccounts;
  }

  return accounts;
}
