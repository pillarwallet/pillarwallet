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
import type { Account, Accounts, AccountTypes } from 'models/Account';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { addressesEqual } from './assets';

export function getActiveAccount(accounts: Accounts = []): ?Account {
  return accounts.find(({ isActive }) => isActive);
}

export function getActiveAccountId(accounts: Accounts = []): string {
  const activeAccount = getActiveAccount(accounts) || {};
  return activeAccount.id || '';
}

export function getActiveAccountType(accounts: Accounts = []): string {
  const activeAccount = getActiveAccount(accounts) || {};
  return activeAccount.type || '';
}

export function getAccountAddress(account: Account): string {
  return get(account, 'id', '');
}

export function getActiveAccountAddress(accounts: Accounts = []): string {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) return '';
  return getAccountAddress(activeAccount);
}

export function findKeyBasedAccount(accounts: Accounts): ?Account {
  return accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
}

export function getActiveAccountWalletId(accounts: Accounts = []): string {
  const activeAccount = getActiveAccount(accounts) || {};
  return activeAccount.walletId || '';
}

export function checkIfSmartWalletAccount(account: Account): boolean {
  return account.type === ACCOUNT_TYPES.SMART_WALLET;
}

export function getAccountName(accountType: AccountTypes): ?string {
  if (!accountType) return null;
  switch (accountType) {
    case ACCOUNT_TYPES.SMART_WALLET:
      return 'Smart Wallet';
    case ACCOUNT_TYPES.KEY_BASED:
      return 'Key Based account';
    default:
      return '';
  }
}

export function getInactiveUserAccounts(accounts: Accounts): Accounts {
  return accounts.filter(({ isActive }) => !isActive);
}

export function findAccountByAddress(
  address: string,
  accounts: Accounts,
) {
  return accounts.find(account => addressesEqual(address, getAccountAddress(account)));
}
